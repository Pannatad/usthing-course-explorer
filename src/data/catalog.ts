import type { Course } from './course';

export type Term = {
  code: string;
  name: string;
  count: number;
  departments: string[];
};

type Manifest = {
  terms: Term[];
  courseTerms: Record<string, string[]>;
};

const manifest = require('./generated/manifest.json') as Manifest;
const loadedTerms = new Map<string, { courses: Course[]; byCode: Map<string, Course> }>();

function loadTermFile(termCode: string): Course[] {
  switch (termCode) {
    case '2610': return require('./generated/2610.json') as Course[];
    case '2540': return require('./generated/2540.json') as Course[];
    case '2530': return require('./generated/2530.json') as Course[];
    case '2520': return require('./generated/2520.json') as Course[];
    default: return [];
  }
}

export const terms = manifest.terms;
export const defaultTerm = terms[0];
export const knownCoursePrefixes = new Set(Object.keys(manifest.courseTerms).map((code) => code.split(' ')[0]));

export function compactCourseCode(code: string) {
  return code.replace(/\s+/g, '').toUpperCase();
}

function getTermData(termCode: string) {
  const cached = loadedTerms.get(termCode);
  if (cached) return cached;

  const courses = loadTermFile(termCode);
  const byCode = new Map(courses.map((course) => [compactCourseCode(course.code), course]));
  const termData = { courses, byCode };
  loadedTerms.set(termCode, termData);
  return termData;
}

export function getCoursesForTerm(termCode: string) {
  return getTermData(termCode).courses;
}

export function getCourse(termCode: string, courseCode: string) {
  return getTermData(termCode).byCode.get(compactCourseCode(courseCode));
}

export function getAvailableTermsForCourse(courseCode: string) {
  const normalizedCode = courseCode.trim().toUpperCase().replace(/^([A-Z]+)\s*(\d)/, '$1 $2');
  return manifest.courseTerms[normalizedCode] ?? [];
}
