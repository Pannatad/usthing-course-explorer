import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(projectRoot, 'data/source/courses.json');
const outputDirectory = path.join(projectRoot, 'src/data/generated');

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Expected a non-empty ${field}`);
  }
  return value.trim();
}

export function normalizeCourse(record) {
  const termCode = requiredText(record.term_code, 'term_code');
  const prefix = requiredText(record.prefix, 'prefix').toUpperCase();
  const number = requiredText(record.number, 'number').toUpperCase();

  if (!/^\d{4}$/.test(termCode)) {
    throw new Error(`Unexpected term code: ${termCode}`);
  }
  if (typeof record.min_credits !== 'number' || typeof record.max_credits !== 'number') {
    throw new Error(`Missing credits for ${prefix} ${number}`);
  }

  return {
    termCode,
    termName: requiredText(record.term_name, 'term_name'),
    code: `${prefix} ${number}`,
    department: requiredText(record.department_code, 'department_code'),
    title: requiredText(record.title, 'title'),
    minCredits: record.min_credits,
    maxCredits: record.max_credits,
    description: record.description.trim(),
    prerequisite: record.prerequisite.trim(),
    corequisite: record.corequisite.trim(),
    exclusion: record.exclusion.trim(),
    careerType: record.career_type.trim(),
  };
}

export function prepareCourses(sourceRecords) {
  if (!Array.isArray(sourceRecords)) {
    throw new Error('The source dataset must be a JSON array');
  }

  const coursesByTerm = new Map();
  const termNames = new Map();
  const seen = new Set();
  const termsByCourseCode = new Map();

  for (const record of sourceRecords) {
    if (record.campus_code !== 'MAIN') continue;

    const course = normalizeCourse(record);
    const key = `${course.termCode}:${course.code}`;
    if (seen.has(key)) throw new Error(`Duplicate course in semester: ${key}`);
    seen.add(key);

    const existingName = termNames.get(course.termCode);
    if (existingName && existingName !== course.termName) {
      throw new Error(`Conflicting names for semester ${course.termCode}`);
    }
    termNames.set(course.termCode, course.termName);

    if (!coursesByTerm.has(course.termCode)) coursesByTerm.set(course.termCode, []);
    coursesByTerm.get(course.termCode).push(course);

    if (!termsByCourseCode.has(course.code)) termsByCourseCode.set(course.code, []);
    termsByCourseCode.get(course.code).push(course.termCode);
  }

  const termCodes = [...coursesByTerm.keys()].sort((a, b) => Number(b) - Number(a));
  const terms = termCodes.map((code) => {
    const courses = coursesByTerm.get(code);
    courses.sort((a, b) => a.code.localeCompare(b.code));
    return {
      code,
      name: termNames.get(code),
      count: courses.length,
      departments: [...new Set(courses.map((course) => course.department))].sort(),
    };
  });

  const courseTerms = Object.fromEntries(
    [...termsByCourseCode.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, offeredTerms]) => [
        code,
        offeredTerms.sort((a, b) => Number(b) - Number(a)),
      ]),
  );

  return { coursesByTerm, manifest: { terms, courseTerms } };
}

export function writePreparedData(prepared, directory) {
  mkdirSync(directory, { recursive: true });
  for (const [termCode, courses] of prepared.coursesByTerm) {
    writeFileSync(path.join(directory, `${termCode}.json`), `${JSON.stringify(courses)}\n`);
  }
  writeFileSync(path.join(directory, 'manifest.json'), `${JSON.stringify(prepared.manifest)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceRecords = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const prepared = prepareCourses(sourceRecords);
  writePreparedData(prepared, outputDirectory);
  const total = prepared.manifest.terms.reduce((sum, term) => sum + term.count, 0);
  console.log(`Prepared ${total} Clear Water Bay records across ${prepared.manifest.terms.length} semesters.`);
}
