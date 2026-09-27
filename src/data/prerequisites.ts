import { getAvailableTermsForCourse, getCourse, knownCoursePrefixes } from './catalog';
import { courseKey, type Course } from './course';

// Extract links only. The original text remains authoritative for AND/OR logic.
export function extractCourseCodes(text: string) {
  const matches = text.toUpperCase().matchAll(/\b([A-Z]{4})\s*(\d{4}[A-Z]?)\b/g);
  return [...new Set([...matches]
    .filter((match) => knownCoursePrefixes.has(match[1]))
    .map((match) => `${match[1]} ${match[2]}`))];
}

export function resolvePrerequisite(code: string, preferredTermCode: string) {
  const sameTerm = getCourse(preferredTermCode, code);
  if (sameTerm) return sameTerm;
  const latestTerm = getAvailableTermsForCourse(code)[0];
  return latestTerm ? getCourse(latestTerm, code) : undefined;
}

export function isAlreadyInPath(course: Course, path: ReadonlySet<string>) {
  return path.has(courseKey(course));
}

export function extendPath(course: Course, path: ReadonlySet<string>) {
  return new Set([...path, courseKey(course)]);
}
