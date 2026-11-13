import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextLesson } from '../src/utils/agenda.js';
const lessons = [
  {
    id: 1,
    class_id: 10,
    teacher: { id: 20 },
    start: '2026-10-08T18:00:00',
    end: '2026-10-08T19:00:00',
    status: 'scheduled',
  },
  {
    id: 2,
    class_id: 11,
    teacher: { id: 21 },
    start: '2026-10-09T18:00:00',
    end: '2026-10-09T19:00:00',
    status: 'cancelled',
  },
  {
    id: 3,
    class_id: 11,
    teacher: { id: 21 },
    start: '2026-10-09T20:00:00',
    end: '2026-10-09T21:00:00',
    status: 'scheduled',
  },
];
test('next lesson skips closed and expired classes without reordering source', () => {
  assert.equal(nextLesson(lessons, new Date('2026-10-09T19:00:00')).id, 3);
  assert.equal(nextLesson(lessons, new Date('2026-10-10T00:00:00')), undefined);
  assert.deepEqual(
    lessons.map((l) => l.id),
    [1, 2, 3],
  );
});
