const closed = new Set(['cancelled', 'completed']);
export function nextLesson(lessons, now = new Date()) {
  return lessons
    .filter((lesson) => !closed.has(lesson.status) && new Date(lesson.end) > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}
