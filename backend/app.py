import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

from clock import utc_now
from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from models import (
    ClassGroup,
    Contact,
    Lesson,
    LoginAttempt,
    Membership,
    Notice,
    Room,
    User,
    db,
)
from scheduling import CLOSED_LESSON_STATUSES, allocate_room
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.security import check_password_hash, generate_password_hash


def create_app(test_config=None):
    load_dotenv()
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY'),
        SQLALCHEMY_DATABASE_URI=os.getenv(
            'DATABASE_URL', f'sqlite:///{Path(__file__).with_name("aracnoif.db").resolve()}'
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=os.getenv('COOKIE_SECURE', 'false') == 'true',
        PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
        MAX_CONTENT_LENGTH=64 * 1024,
    )
    if test_config:
        app.config.update(test_config)
    if not app.config['SECRET_KEY'] or not app.config['SQLALCHEMY_DATABASE_URI']:
        raise RuntimeError('Configure SECRET_KEY no arquivo .env. SQLite é usado por padrão.')
    db.init_app(app)

    with app.app_context():
        inspector = inspect(db.engine)
        if 'user' in inspector.get_table_names():
            columns = {column['name'] for column in inspector.get_columns('user')}
            if 'avatar' not in columns:
                db.session.execute(text('ALTER TABLE user ADD COLUMN avatar TEXT'))
                db.session.commit()

    def fail(message, code=400):
        return jsonify(error=message), code

    def payload():
        value = request.get_json(silent=True)
        return value if isinstance(value, dict) else {}

    def current():
        user = db.session.get(User, session.get('uid')) if session.get('uid') else None
        return (
            user
            if user
            and user.active
            and session.get('auth_stamp') == hashlib.sha256(user.password_hash.encode()).hexdigest()
            else None
        )

    def auth(*roles):
        def decorate(fn):
            @wraps(fn)
            def wrapped(*args, **kwargs):
                user = current()
                if not user:
                    return fail('Entre na sua conta para continuar.', 401)
                if roles and user.role not in roles:
                    return fail('Você não tem permissão para esta ação.', 403)
                return fn(*args, **kwargs)

            return wrapped

        return decorate

    def allowed(group_id):
        user = current()
        group = db.session.get(ClassGroup, group_id)
        return bool(
            user
            and group
            and (
                user.role == 'admin'
                or (user.role == 'teacher' and group.teacher_id == user.id)
                or Membership.query.filter_by(user_id=user.id, class_id=group_id).first()
            )
        )

    def class_ids():
        user = current()
        if user.role == 'admin':
            return [g.id for g in ClassGroup.query.all()]
        if user.role == 'teacher':
            return [g.id for g in ClassGroup.query.filter_by(teacher_id=user.id)]
        return [m.class_id for m in Membership.query.filter_by(user_id=user.id)]

    def publish(body, class_id=None, kind='info', lesson_id=None):
        notice = Notice(
            body=body, class_id=class_id, user_id=current().id, kind=kind, lesson_id=lesson_id
        )
        db.session.add(notice)
        return notice

    def email_valid(value):
        domain = os.getenv('INSTITUTIONAL_EMAIL_DOMAIN', 'ifsp.edu.br')
        return bool(
            re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value)
            and (
                value.rsplit('@', 1)[1] == domain or value.rsplit('@', 1)[1].endswith('.' + domain)
            )
        )

    @app.before_request
    def csrf_guard():
        if request.path.startswith('/api/') and request.method in (
            'POST',
            'PATCH',
            'DELETE',
            'PUT',
        ):
            token = session.get('csrf')
            if not token or not secrets.compare_digest(
                token, request.headers.get('X-CSRF-Token', '')
            ):
                return fail('Sessão expirada. Atualize a página.', 403)

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(IntegrityError)
    def integrity(_):
        db.session.rollback()
        return fail('E-mail, identificação ou vínculo já cadastrado.', 409)

    @app.errorhandler(SQLAlchemyError)
    def database_error(error):
        db.session.rollback()
        app.logger.error('Database operation failed: %s', type(error).__name__)
        return fail('Não foi possível acessar os dados. Tente novamente.', 503)

    @app.get('/api/csrf')
    def csrf():
        if not session.get('csrf'):
            session['csrf'] = secrets.token_urlsafe(32)
        return jsonify(token=session['csrf'])

    @app.post('/api/login')
    def login():
        p = payload()
        identifier = str(p.get('identifier', '')).strip().lower()
        key = hashlib.sha256(identifier.encode()).hexdigest()
        attempts = LoginAttempt.query.filter(
            LoginAttempt.key == key,
            LoginAttempt.created > utc_now() - timedelta(minutes=15),
        ).count()
        if attempts >= 5:
            return fail('Muitas tentativas. Aguarde 15 minutos.', 429)
        user = User.query.filter(
            db.or_(User.email == identifier, User.identifier == identifier)
        ).first()
        if (
            not user
            or not user.active
            or not check_password_hash(user.password_hash, str(p.get('password', '')))
        ):
            db.session.add(LoginAttempt(key=key))
            db.session.commit()
            return fail('Identificação ou senha inválida.', 401)
        session.clear()
        session['uid'] = user.id
        session['auth_stamp'] = hashlib.sha256(user.password_hash.encode()).hexdigest()
        session['csrf'] = secrets.token_urlsafe(32)
        session.permanent = True
        LoginAttempt.query.filter_by(key=key).delete()
        db.session.commit()
        return jsonify(user=user.public(), token=session['csrf'])

    @app.post('/api/logout')
    def logout():
        session.clear()
        return jsonify(ok=True)

    @app.post('/api/register/teacher')
    def register_teacher():
        p = payload()
        name = str(p.get('name', '')).strip()
        email = str(p.get('email', '')).strip().lower()
        identifier = str(p.get('identifier', '')).strip().lower()
        password = str(p.get('password', ''))
        villain = p.get('villain')
        if (
            not 3 <= len(name) <= 120
            or not email_valid(email)
            or not 1 <= len(identifier) <= 40
            or len(password) < 8
            or villain not in VILLAINS
            or p.get('confirm_password') != password
            or p.get('confirm_server') is not True
        ):
            return fail('Confira os dados, a confirmação de senha e a identidade temática.')
        user = User(
            name=name,
            email=email,
            identifier=identifier,
            password_hash=generate_password_hash(password),
            role='teacher',
            active=False,
            villain=villain,
            course=str(p.get('course', ''))[:120],
        )
        db.session.add(user)
        db.session.commit()
        return jsonify(ok=True, pending=True), 201

    @app.get('/api/me')
    @auth()
    def me():
        return jsonify(current().public())

    @app.patch('/api/profile')
    @auth()
    def profile():
        p = payload()
        user = current()
        name = str(p.get('name', user.name)).strip()
        email = str(p.get('email', user.email)).strip().lower()
        valid_email = email_valid(email) or (
            user.role == 'admin'
            and email == user.email
            and re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email)
        )
        if len(name) < 3 or len(name) > 120 or not valid_email:
            return fail('Informe nome e e-mail válidos.')
        if p.get('password'):
            if not check_password_hash(user.password_hash, str(p.get('current_password', ''))):
                return fail('Senha atual inválida.', 403)
            if len(str(p['password'])) < 8:
                return fail('A senha deve ter pelo menos 8 caracteres.')
            user.password_hash = generate_password_hash(p['password'])
            session['auth_stamp'] = hashlib.sha256(user.password_hash.encode()).hexdigest()
        avatar = p.get('avatar', user.avatar or '')
        if avatar is None:
            avatar = ''
        if not isinstance(avatar, str) or len(avatar) > 50000:
            return fail('A foto deve ter no máximo 50 KB.')
        if avatar and not re.fullmatch(
            r'data:image/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+', avatar
        ):
            return fail('Use uma foto JPG, PNG ou WEBP.')
        user.name = name
        user.email = email
        user.avatar = avatar
        if user.role == 'teacher' and 'villain' in p:
            if p['villain'] not in VILLAINS:
                return fail('Escolha um vilão válido.')
            user.villain = p['villain']
        db.session.commit()
        return jsonify(user.public())

    @app.get('/api/rooms')
    def rooms():
        return jsonify([r.public() for r in Room.query.order_by(Room.floor, Room.id)])

    @app.get('/api/teachers')
    def teachers():
        return jsonify(
            [
                u.public()
                for u in User.query.filter_by(role='teacher', active=True).order_by(User.name)
            ]
        )

    @app.get('/api/classes')
    @auth()
    def groups():
        return jsonify(
            [g.public() for g in ClassGroup.query.filter(ClassGroup.id.in_(class_ids()))]
        )

    @app.get('/api/lessons')
    @auth()
    def lessons():
        return jsonify(
            [
                lesson.public()
                for lesson in Lesson.query.filter(Lesson.class_id.in_(class_ids())).order_by(
                    Lesson.start
                )
            ]
        )

    @app.post('/api/lessons/<int:lesson_id>/start')
    @auth('teacher', 'admin')
    def start_lesson(lesson_id):
        lesson = db.session.execute(
            db.select(Lesson).where(Lesson.id == lesson_id).with_for_update()
        ).scalar_one_or_none()
        if not lesson:
            return fail('Aula não encontrada.', 404)
        if not allowed(lesson.class_id):
            return fail('Acesso negado.', 403)
        if lesson.status in CLOSED_LESSON_STATUSES:
            return fail('Esta aula já foi encerrada ou cancelada.', 409)
        if lesson.status == 'started':
            return jsonify(lesson.public())
        lesson.status = 'started'
        publish(
            f'A aula de {lesson.group.subject} começou em {lesson.room.name}, {lesson.room.floor}º pavimento.',
            lesson.class_id,
            'started',
            lesson.id,
        )
        db.session.commit()
        return jsonify(lesson.public())

    @app.patch('/api/lessons/<int:lesson_id>')
    @auth('teacher', 'admin')
    def change_lesson(lesson_id):
        lesson = db.session.get(Lesson, lesson_id)
        if not lesson:
            return fail('Aula não encontrada.', 404)
        if not allowed(lesson.class_id):
            return fail('Acesso negado.', 403)
        if lesson.status in CLOSED_LESSON_STATUSES:
            return fail('Esta aula já foi encerrada ou cancelada.', 409)
        p = payload()
        try:
            start = datetime.fromisoformat(p.get('start', lesson.start.isoformat()))
            end = datetime.fromisoformat(p.get('end', lesson.end.isoformat()))
            room_id = int(p.get('room_id', lesson.room_id))
        except (TypeError, ValueError):
            return fail('Horário ou sala inválidos.')
        if end <= start or start.tzinfo or end.tzinfo:
            return fail('Informe horários locais válidos, com o término após o início.')
        room, clash = allocate_room(
            lesson.group.teacher_id, room_id, start, end, exclude_id=lesson.id
        )
        if not room:
            return fail('Sala não encontrada.', 404)
        if clash:
            return fail('A sala ou o professor já tem aula neste horário.', 409)
        lesson.start = start
        lesson.end = end
        lesson.room_id = room_id
        publish(
            f'Aula de {lesson.group.subject} atualizada: {room.name}, {room.floor}º pavimento, {start:%d/%m às %H:%M}.',
            lesson.class_id,
            'changed',
            lesson.id,
        )
        db.session.commit()
        return jsonify(lesson.public())

    @app.get('/api/health')
    def health():
        db.session.execute(text('SELECT 1'))
        return jsonify(ok=True, database='connected')

    @app.post('/api/classes')
    @auth('teacher', 'admin')
    def create_group():
        p = payload()
        name = str(p.get('name', '')).strip()
        subject = str(p.get('subject', '')).strip()
        teacher_id = current().id if current().role == 'teacher' else p.get('teacher_id')
        teacher = db.session.get(User, teacher_id)
        if (
            not 1 <= len(name) <= 120
            or not 1 <= len(subject) <= 120
            or not teacher
            or teacher.role != 'teacher'
            or not teacher.active
        ):
            return fail('Informe turma, matéria e professor ativo.')
        group = ClassGroup(name=name, subject=subject, teacher_id=teacher.id)
        db.session.add(group)
        db.session.commit()
        return jsonify(group.public()), 201

    @app.patch('/api/classes/<int:group_id>')
    @auth('teacher', 'admin')
    def edit_group(group_id):
        group = db.session.get(ClassGroup, group_id)
        if not group or not allowed(group_id):
            return fail('Acesso negado.', 403)
        p = payload()
        name = str(p.get('name', group.name)).strip()
        subject = str(p.get('subject', group.subject)).strip()
        if not 1 <= len(name) <= 120 or not 1 <= len(subject) <= 120:
            return fail('Informe turma e matéria válidas.')
        group.name = name
        group.subject = subject
        db.session.commit()
        return jsonify(group.public())

    @app.post('/api/lessons')
    @auth('teacher', 'admin')
    def create_lesson():
        p = payload()
        try:
            group_id = int(p.get('class_id'))
            room_id = int(p.get('room_id'))
            start = datetime.fromisoformat(p.get('start'))
            end = datetime.fromisoformat(p.get('end'))
        except (TypeError, ValueError):
            return fail('Informe turma, sala e horários válidos.')
        if not allowed(group_id):
            return fail('Acesso negado.', 403)
        if start.tzinfo or end.tzinfo or end <= start:
            return fail('O término deve ser após o início, em horário local.')
        group = db.session.get(ClassGroup, group_id)
        room, clash = allocate_room(group.teacher_id, room_id, start, end)
        if not room:
            return fail('Sala não encontrada.', 404)
        if clash:
            return fail('A sala ou o professor já tem aula neste horário.', 409)
        lesson = Lesson(class_id=group_id, room_id=room_id, start=start, end=end)
        db.session.add(lesson)
        db.session.flush()
        publish(
            f'Nova aula de {group.subject}: {room.name}, {start:%d/%m às %H:%M}.',
            group_id,
            'scheduled',
            lesson.id,
        )
        db.session.commit()
        return jsonify(lesson.public()), 201

    @app.post('/api/lessons/<int:lesson_id>/status')
    @auth('teacher', 'admin')
    def lesson_status(lesson_id):
        lesson = db.session.execute(
            db.select(Lesson).where(Lesson.id == lesson_id).with_for_update()
        ).scalar_one_or_none()
        if not lesson:
            return fail('Aula não encontrada.', 404)
        if not allowed(lesson.class_id):
            return fail('Acesso negado.', 403)
        status = payload().get('status')
        reason = str(payload().get('reason', '')).strip()
        if status not in ('cancelled', 'completed') or len(reason) > 300:
            return fail('Informe status e motivo válidos.')
        if status == lesson.status:
            return jsonify(lesson.public())
        if lesson.status in CLOSED_LESSON_STATUSES:
            return fail('Esta aula já foi encerrada ou cancelada.', 409)
        if status == 'completed' and lesson.status != 'started':
            return fail('Inicie a aula antes de encerrá-la.', 409)
        lesson.status = status
        body = (
            f'Aula de {lesson.group.subject} '
            + ('cancelada' if status == 'cancelled' else 'encerrada')
            + f' ({lesson.start:%d/%m às %H:%M}).'
        )
        if reason:
            body += ' Motivo: ' + reason
        publish(body, lesson.class_id, status, lesson.id)
        db.session.commit()
        return jsonify(lesson.public())

    @app.get('/api/notices')
    @auth()
    def notices():
        return jsonify(
            [
                n.public()
                for n in Notice.query.filter(
                    db.or_(Notice.class_id.is_(None), Notice.class_id.in_(class_ids()))
                )
                .order_by(Notice.id.desc())
                .limit(100)
            ]
        )

    @app.post('/api/notices')
    @auth('teacher', 'admin')
    def create_notice():
        p = payload()
        body = str(p.get('body', '')).strip()
        class_id = p.get('class_id')
        if not 3 <= len(body) <= 2000:
            return fail('Escreva uma mensagem entre 3 e 2000 caracteres.')
        if class_id in ('', None):
            class_id = None
        else:
            try:
                class_id = int(class_id)
            except (TypeError, ValueError):
                return fail('Turma inválida.')
            if not allowed(class_id):
                return fail('Você não pode publicar nesta turma.', 403)
        notice = publish(body, class_id, 'info')
        db.session.commit()
        return jsonify(notice.public()), 201

    @app.post('/api/contact')
    def create_contact():
        p = payload()
        name = str(p.get('name', '')).strip()
        email = str(p.get('email', '')).strip().lower()
        subject = str(p.get('subject', '')).strip()
        body = str(p.get('body', '')).strip()
        if not 3 <= len(name) <= 120 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
            return fail('Informe nome e e-mail válidos.')
        if not 3 <= len(subject) <= 160 or not 5 <= len(body) <= 2000:
            return fail('Preencha assunto e mensagem corretamente.')
        contact = Contact(name=name, email=email, subject=subject, body=body)
        db.session.add(contact)
        db.session.commit()
        return jsonify(ok=True), 201

    @app.get('/api/contacts')
    @auth('admin')
    def contacts():
        return jsonify([c.public() for c in Contact.query.order_by(Contact.id.desc()).limit(100)])

    @app.get('/api/users')
    @auth('admin')
    def users():
        return jsonify([u.public() for u in User.query.order_by(User.name)])

    @app.post('/api/users')
    @auth('admin')
    def add_user():
        p = payload()
        role = p.get('role')
        name = str(p.get('name', '')).strip()
        email = str(p.get('email', '')).lower().strip()
        identifier = str(p.get('identifier', '')).lower().strip()
        password = str(p.get('password', ''))
        if (
            role not in ('student', 'teacher')
            or not 3 <= len(name) <= 120
            or not email_valid(email)
            or not 1 <= len(identifier) <= 40
            or len(password) < 8
        ):
            return fail(
                'Confira nome, prontuário/SIAPE, e-mail institucional e senha (mínimo 8 caracteres).'
            )
        if p.get('villain') and p['villain'] not in VILLAINS:
            return fail('Vilão inválido.')
        user = User(
            name=name,
            email=email,
            identifier=identifier,
            password_hash=generate_password_hash(password),
            role=role,
            semester=str(p.get('semester', ''))[:20],
            course=str(p.get('course', ''))[:120],
            villain=str(p.get('villain', '')),
        )
        db.session.add(user)
        db.session.commit()
        return jsonify(user.public()), 201

    @app.patch('/api/users/<int:user_id>')
    @auth('admin')
    def update_user(user_id):
        user = db.session.get(User, user_id)
        if not user:
            return fail('Usuário não encontrado.', 404)
        if user.id == current().id or user.role == 'admin':
            return fail(
                'A administração de outros administradores não está disponível nesta versão.', 403
            )
        if not isinstance(payload().get('active'), bool):
            return fail('Informe o status do usuário.')
        user.active = payload()['active']
        db.session.commit()
        return jsonify(user.public())

    @app.post('/api/memberships')
    @auth('student', 'admin')
    def membership():
        p = payload()
        current_user = current()
        user = current_user if current_user.role == 'student' else db.session.get(User, p.get('user_id'))
        group = db.session.get(ClassGroup, p.get('class_id'))
        if not user or user.role != 'student' or not group:
            return fail('Selecione aluno e turma válidos.')
        if Membership.query.filter_by(user_id=user.id, class_id=group.id).first():
            return fail('Você já está vinculado a esta turma.', 409)
        db.session.add(Membership(user_id=user.id, class_id=group.id))
        db.session.commit()
        return jsonify(ok=True), 201

    @app.cli.command('check-db')
    def check_db():
        db.session.execute(text('SELECT 1'))
        User.query.limit(1).all()
        Room.query.limit(1).all()
        print('Conexão e tabelas acessíveis. Nenhum dado foi alterado.')

    @app.cli.command('init-db')
    def init_db():
        db.create_all()
        print('Estrutura inicial criada.')

    @app.cli.command('create-admin')
    def create_admin():
        import getpass

        name = input('Nome: ').strip()
        email = input('E-mail institucional: ').strip().lower()
        identifier = input('Identificação: ').strip().lower()
        password = getpass.getpass('Senha (mínimo 8 caracteres): ')
        if len(name) < 3 or not email_valid(email) or not identifier or len(password) < 8:
            raise RuntimeError('Dados inválidos.')
        db.session.add(
            User(
                name=name,
                email=email,
                identifier=identifier,
                password_hash=generate_password_hash(password),
                role='admin',
            )
        )
        db.session.commit()
        print('Administrador criado.')

    @app.cli.command('bootstrap-admin')
    def bootstrap_admin():
        import json
        from pathlib import Path

        config = json.loads(Path(__file__).with_name('initial_admin.json').read_text())
        existing = User.query.filter(
            db.or_(User.email == config['email'], User.identifier == config['identifier'])
        ).first()
        if existing:
            if existing.email != config['email'] or existing.role != 'admin':
                raise RuntimeError(
                    'E-mail ou identificação já pertence a outra conta. Nenhuma conta foi alterada.'
                )
            print('Administrador já cadastrado. Senha e dados existentes foram preservados.')
            return
        db.session.add(User(**config, role='admin', active=True))
        db.session.commit()
        print('Administrador solicitado cadastrado com sucesso.')

    @app.cli.command('load-campus')
    def load_campus():
        import json
        from pathlib import Path

        entries = json.loads(Path(__file__).with_name('campus.json').read_text())
        for entry in entries:
            if not Room.query.filter_by(node=entry['node']).first():
                db.session.add(Room(**entry))
        db.session.commit()
        print('Salas das plantas carregadas. Nenhum usuário fictício foi criado.')

    return app


VILLAINS = [
    'Doutor Octopus',
    'Duende Verde',
    'Venom',
    'Mystério',
    'Electro',
    'Abutre',
    'Homem-Areia',
    'Lagarto',
]

if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=False)
