"""UTC timestamps stored as naive values by the existing database schema."""

from datetime import UTC, datetime


def utc_now():
    return datetime.now(UTC).replace(tzinfo=None)
