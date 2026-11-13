from datetime import datetime, timedelta

import pytest
from app import create_app
from models import ClassGroup, Lesson, Membership, Notice, Room, User, db
from werkzeug.security import generate_password_hash


@pytest.fixture
def app():
    database = 'sqlite://'
    app = create_app(
        {
            'TESTING': True,
            'SECRET_KEY': 'tests-only-key',
            'SQLALCHEMY_DATABASE_URI': database,
            'SESSION_COOKIE_SECURE': False,
        }
    )
    with app.app_context():
        db.create_all()
        for id, role in [
            (1, 'student'),
            (2, 'teacher'),
            (4, 'student'),
            (5, 'teacher'),
        ]:
            db.session.add(
                User(
                    id=id,
                    name=f'Usuário {id}',
                    email=f'u{id}@ifsp.edu.br',
                    identifier=f'id{id}',
                    role=role,
                    password_hash=generate_password_hash('TestPass123'),
                    active=id != 4,
                )
            )
        db.session.add_all(
            [
                Room(id=1, name='Sala 1', floor=5, node='r1'),
                Room(id=2, name='Sala 2', floor=5, node='r2'),
            ]
        )
        db.session.flush()
        db.session.add_all(
            [
                ClassGroup(id=1, name='Turma 1', subject='Banco de Dados', teacher_id=2),
                ClassGroup(id=2, name='Turma 2', subject='Web', teacher_id=5),
            ]
        )
        db.session.flush()
        db.session.add(Membership(user_id=1, class_id=1))
        start = datetime(2026, 10, 2, 19, 0)
        db.session.add_all(
            [
                Lesson(
                    id=1, class_id=1, room_id=1, start=start, end=start + timedelta(minutes=100)
                ),
                Lesson(
                    id=2, class_id=2, room_id=2, start=start, end=start + timedelta(minutes=100)
                ),
            ]
        )
        db.session.commit()
    yield app
    with app.app_context():
        db.drop_all()


def login(client, id):
    token = client.get('/api/csrf').json['token']
    response = client.post(
        '/api/login',
        json={'identifier': f'id{id}', 'password': 'TestPass123'},
        headers={'X-CSRF-Token': token},
    )
    assert response.status_code == 200
    return {'X-CSRF-Token': response.json['token']}


def test_authentication_and_csrf(app):
    client = app.test_client()
    assert client.get('/api/classes').status_code == 401
    assert client.post('/api/login', json={}).status_code == 403
    token = client.get('/api/csrf').json['token']
    assert (
        client.post(
            '/api/login',
            json={'identifier': 'id4', 'password': 'TestPass123'},
            headers={'X-CSRF-Token': token},
        ).status_code
        == 401
    )
    headers = login(client, 1)
    assert 'password_hash' not in client.get('/api/me').json
    assert client.post('/api/logout', headers=headers).status_code == 200
    assert client.get('/api/me').status_code == 401


def test_student_isolation(app):
    client = app.test_client()
    headers = login(client, 1)
    assert [c['id'] for c in client.get('/api/classes').json] == [1]
    assert [lesson['id'] for lesson in client.get('/api/lessons').json] == [1]
    assert client.post('/api/lessons', headers=headers, json={}).status_code == 403
    assert client.post('/api/lessons/1/start', headers=headers).status_code == 403


def test_student_can_join_a_class(app):
    client = app.test_client()
    headers = login(client, 1)
    assert [c['id'] for c in client.get('/api/classes').json] == [1]
    response = client.post('/api/memberships', headers=headers, json={'class_id': 2})
    assert response.status_code == 201
    assert [c['id'] for c in client.get('/api/classes').json] == [1, 2]
    assert client.post('/api/memberships', headers=headers, json={'class_id': 2}).status_code == 409


def test_teacher_start_and_conflict(app):
    client = app.test_client()
    headers = login(client, 2)
    assert client.post('/api/lessons/2/start', headers=headers).status_code == 403
    response = client.patch('/api/lessons/1', headers=headers, json={'room_id': 2})
    assert response.status_code == 409
    assert (
        client.patch(
            '/api/lessons/1',
            headers=headers,
            json={'start': '2026-10-02T22:30:00', 'end': '2026-10-02T23:30:00', 'room_id': 2},
        ).status_code
        == 200
    )
    assert client.post('/api/lessons/1/start', headers=headers).status_code == 200
    assert client.post('/api/lessons/1/start', headers=headers).status_code == 200
    with app.app_context():
        assert Notice.query.filter_by(class_id=1).count() == 2  # alteration + first start


def test_profile_security(app):
    client = app.test_client()
    headers = login(client, 1)
    assert (
        client.patch(
            '/api/profile',
            headers=headers,
            json={'role': 'admin', 'active': True, 'id': 3, 'name': 'Aluno Atualizado'},
        ).status_code
        == 200
    )
    assert client.get('/api/me').json['role'] == 'student'
    assert (
        client.patch(
            '/api/profile',
            headers=headers,
            json={'password': 'NewPass123', 'current_password': 'wrong'},
        ).status_code
        == 403
    )


def test_profile_avatar(app):
    client = app.test_client()
    headers = login(client, 1)
    avatar = 'data:image/jpeg;base64,ZmFrZQ=='
    response = client.patch('/api/profile', headers=headers, json={'avatar': avatar})
    assert response.status_code == 200
    assert response.json['avatar'] == avatar
    assert client.get('/api/me').json['avatar'] == avatar
    assert (
        client.patch(
            '/api/profile', headers=headers, json={'avatar': 'data:text/html;base64,ZmFrZQ=='}
        ).status_code
        == 400
    )


def test_login_throttling(app):
    client = app.test_client()
    token = client.get('/api/csrf').json['token']
    headers = {'X-CSRF-Token': token}
    for _ in range(5):
        assert (
            client.post(
                '/api/login', headers=headers, json={'identifier': 'unknown', 'password': 'wrong'}
            ).status_code
            == 401
        )
    assert (
        client.post(
            '/api/login', headers=headers, json={'identifier': 'unknown', 'password': 'wrong'}
        ).status_code
        == 429
    )


def test_teacher_registration_waits_for_activation(app):
    client = app.test_client()
    headers = {'X-CSRF-Token': client.get('/api/csrf').json['token']}
    data = {
        'name': 'Professor Novo',
        'email': 'novo.prof@ifsp.edu.br',
        'identifier': 'siape99',
        'password': 'TestPass123',
        'confirm_password': 'TestPass123',
        'confirm_server': True,
        'villain': 'Venom',
        'role': 'teacher',
        'active': True,
    }
    assert (
        client.post(
            '/api/register/teacher', headers=headers, json={**data, 'villain': 'Desconhecido'}
        ).status_code
        == 400
    )
    result = client.post('/api/register/teacher', headers=headers, json=data)
    assert result.status_code == 201 and result.json == {'ok': True, 'pending': True}
    assert client.post('/api/register/teacher', headers=headers, json=data).status_code == 409
    teacher_login = client.post(
        '/api/login', headers=headers, json={'identifier': 'siape99', 'password': 'TestPass123'}
    )
    assert teacher_login.status_code == 401
    with app.app_context():
        User.query.filter_by(identifier='siape99').update({'active': True})
        db.session.commit()
    teacher_login = client.post(
        '/api/login', headers=headers, json={'identifier': 'siape99', 'password': 'TestPass123'}
    )
    assert teacher_login.status_code == 200 and teacher_login.json['user']['role'] == 'teacher'


def test_villain_is_shown_to_students(app):
    teacher = app.test_client()
    headers = login(teacher, 2)
    assert (
        teacher.patch('/api/profile', headers=headers, json={'villain': 'Duende Verde'}).status_code
        == 200
    )
    student = app.test_client()
    login(student, 1)
    assert student.get('/api/classes').json[0]['teacher']['villain'] == 'Duende Verde'
    assert student.get('/api/lessons').json[0]['teacher']['villain'] == 'Duende Verde'


def test_class_management_and_schedule_conflicts(app):
    teacher = app.test_client()
    h = login(teacher, 2)
    student = app.test_client()
    sh = login(student, 1)
    assert (
        student.post('/api/classes', headers=sh, json={'name': 'X', 'subject': 'Web'}).status_code
        == 403
    )
    created = teacher.post(
        '/api/classes', headers=h, json={'name': 'ADS 4', 'subject': 'Redes', 'teacher_id': 5}
    )
    assert created.status_code == 201 and created.json['teacher']['id'] == 2
    group_id = created.json['id']
    assert (
        teacher.patch(
            '/api/classes/2', headers=h, json={'name': 'Outra', 'subject': 'Outra'}
        ).status_code
        == 403
    )
    assert (
        teacher.patch(
            f'/api/classes/{group_id}', headers=h, json={'name': 'ADS 4A', 'subject': 'Redes II'}
        ).status_code
        == 200
    )
    lesson = {
        'class_id': group_id,
        'room_id': 2,
        'start': '2026-10-02T19:20:00',
        'end': '2026-10-02T20:20:00',
    }
    assert teacher.post('/api/lessons', headers=h, json=lesson).status_code == 409
    created = teacher.post(
        '/api/lessons',
        headers=h,
        json={**lesson, 'start': '2026-10-02T22:30:00', 'end': '2026-10-02T23:30:00'},
    )
    assert created.status_code == 201
    assert student.post('/api/lessons', headers=sh, json=lesson).status_code == 403
    assert teacher.get('/api/health').json['database'] == 'connected'


def test_lesson_lifecycle_and_notice_scope(app):
    teacher = app.test_client()
    h = login(teacher, 2)
    student = app.test_client()
    sh = login(student, 1)
    assert (
        teacher.post('/api/lessons/2/status', headers=h, json={'status': 'cancelled'}).status_code
        == 403
    )
    assert (
        student.post('/api/lessons/1/status', headers=sh, json={'status': 'cancelled'}).status_code
        == 403
    )
    assert (
        teacher.post('/api/lessons/1/status', headers=h, json={'status': 'completed'}).status_code
        == 409
    )
    assert teacher.post('/api/lessons/1/start', headers=h).status_code == 200
    assert (
        teacher.post('/api/lessons/1/status', headers=h, json={'status': 'completed'}).status_code
        == 200
    )
    assert (
        teacher.post('/api/lessons/1/status', headers=h, json={'status': 'completed'}).status_code
        == 200
    )
    assert teacher.post('/api/lessons/1/start', headers=h).status_code == 409
    kinds = [n['kind'] for n in student.get('/api/notices').json]
    assert kinds.count('started') == 1 and kinds.count('completed') == 1
    assert all(n['lesson_id'] == 1 for n in student.get('/api/notices').json)
    other = app.test_client()
    login(other, 5)
    assert other.get('/api/notices').json == []


def test_cancellation_releases_the_room(app):
    teacher = app.test_client()
    h = login(teacher, 2)
    assert (
        teacher.post(
            '/api/lessons/1/status',
            headers=h,
            json={'status': 'cancelled', 'reason': 'Professor ausente'},
        ).status_code
        == 200
    )
    assert teacher.patch('/api/lessons/1', headers=h, json={'room_id': 2}).status_code == 409
    other = app.test_client()
    oh = login(other, 5)
    assert (
        other.post('/api/lessons/2/status', headers=oh, json={'status': 'cancelled'}).status_code
        == 200
    )
    created = other.post(
        '/api/lessons',
        headers=oh,
        json={
            'class_id': 2,
            'room_id': 1,
            'start': '2026-10-02T19:00:00',
            'end': '2026-10-02T20:40:00',
        },
    )
    assert created.status_code == 201
    student = app.test_client()
    login(student, 1)
    notices = student.get('/api/notices').json
    assert notices[0]['kind'] == 'cancelled' and 'Professor ausente' in notices[0]['body']


def post_with_csrf(client, path, data):
    token = client.get('/api/csrf').json['token']
    return client.post(path, json=data, headers={'X-CSRF-Token': token})


def test_user_survives_backend_restart(tmp_path):
    config = {
        'TESTING': True,
        'SECRET_KEY': 'restart-test',
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{tmp_path / "persist.db"}',
        'SESSION_COOKIE_SECURE': False,
    }
    first = create_app(config)
    with first.app_context():
        db.create_all()
        db.session.add(
            User(
                name='Aluno persistente',
                email='persist@ifsp.edu.br',
                identifier='persist',
                role='student',
                active=True,
                password_hash=generate_password_hash('PersistPass123'),
            )
        )
        db.session.commit()
        db.session.remove()
        db.engine.dispose()
    second = create_app(config)
    client = second.test_client()
    response = post_with_csrf(
        client, '/api/login', {'identifier': 'persist', 'password': 'PersistPass123'}
    )
    assert response.status_code == 200
    assert client.get('/api/me').json['name'] == 'Aluno persistente'


def test_database_check_is_read_only(app):
    with app.app_context():
        count = User.query.count()
    result = app.test_cli_runner().invoke(args=['check-db'])
    assert result.exit_code == 0
    with app.app_context():
        assert User.query.count() == count
