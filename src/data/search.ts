import type { Course } from './course';

export function normalizeSearch(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

export function filterCourses(courses: Course[], department: string, query: string) {
  const normalizedQuery = normalizeSearch(query);
  return courses.filter((course) =>
    (department === 'All' || course.department === department) &&
    (!normalizedQuery ||
      normalizeSearch(course.code).includes(normalizedQuery) ||
      normalizeSearch(course.title).includes(normalizedQuery)),
  );
}
