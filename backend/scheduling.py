"""Shared allocation rules for lesson creation and changes."""

from models import ClassGroup, Lesson, Room, User, db

CLOSED_LESSON_STATUSES = ('cancelled', 'completed')


def allocate_room(teacher_id, room_id, start, end, exclude_id=None):
    db.session.execute(db.select(User).where(User.id == teacher_id).with_for_update()).scalar_one()
    room = db.session.execute(
        db.select(Room).where(Room.id == room_id).with_for_update()
    ).scalar_one_or_none()
    if room is None:
        return None, False
    teacher_classes = db.select(ClassGroup.id).where(ClassGroup.teacher_id == teacher_id)
    conflicts = Lesson.query.filter(
        Lesson.status.notin_(CLOSED_LESSON_STATUSES),
        Lesson.start < end,
        Lesson.end > start,
        db.or_(Lesson.room_id == room_id, Lesson.class_id.in_(teacher_classes)),
    )
    if exclude_id is not None:
        conflicts = conflicts.filter(Lesson.id != exclude_id)
    return room, conflicts.first() is not None
