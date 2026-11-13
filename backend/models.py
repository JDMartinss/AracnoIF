from clock import utc_now
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    identifier = db.Column(db.String(40), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    semester = db.Column(db.String(20), default='')
    course = db.Column(db.String(120), default='')
    villain = db.Column(db.String(60), default='')
    avatar = db.Column(db.Text, default='', nullable=False)

    def public(self):
        # Nunca mando password_hash para o frontend.
        data = {
            k: getattr(self, k)
            for k in [
                'id',
                'name',
                'email',
                'identifier',
                'role',
                'active',
                'semester',
                'course',
                'villain',
                'avatar',
            ]
        }
        data['avatar'] = self.avatar or ''
        return data


class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    floor = db.Column(db.Integer, nullable=False)
    node = db.Column(db.String(80), unique=True, nullable=False)

    def public(self):
        return {k: getattr(self, k) for k in ['id', 'name', 'floor', 'node']}


class ClassGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(120), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    teacher = db.relationship('User')

    def public(self):
        return {
            'id': self.id,
            'name': self.name,
            'subject': self.subject,
            'teacher': self.teacher.public(),
        }


class Membership(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('class_group.id'), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'class_id', name='uq_membership'),)


class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class_group.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    start = db.Column(db.DateTime, nullable=False, index=True)
    end = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled', nullable=False)
    group = db.relationship('ClassGroup')
    room = db.relationship('Room')

    def public(self):
        return {
            'id': self.id,
            'class_id': self.class_id,
            'subject': self.group.subject,
            'class_name': self.group.name,
            'teacher': self.group.teacher.public(),
            'room': self.room.public(),
            'start': self.start.isoformat(),
            'end': self.end.isoformat(),
            'status': self.status,
        }


class Notice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class_group.id'), nullable=True, index=True)
    kind = db.Column(db.String(20), default='info', nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created = db.Column(db.DateTime, default=utc_now, nullable=False)

    def public(self):
        return {
            'id': self.id,
            'class_id': self.class_id,
            'body': self.body,
            'kind': self.kind,
            'lesson_id': self.lesson_id,
            'created': self.created.isoformat() + 'Z',
        }


class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False)
    subject = db.Column(db.String(160), nullable=False)
    body = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='new', nullable=False)
    created = db.Column(db.DateTime, default=utc_now, nullable=False, index=True)

    def public(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'body': self.body,
            'status': self.status,
            'created': self.created.isoformat() + 'Z',
        }


class LoginAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), nullable=False, index=True)
    created = db.Column(db.DateTime, default=utc_now, nullable=False, index=True)
