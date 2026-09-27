import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { prepareCourses } from '../scripts/prepare-courses.mjs';
import { getAvailableTermsForCourse, getCourse, getCoursesForTerm } from '../src/data/catalog';
import type { Course } from '../src/data/course';
import { extractCourseCodes, extendPath, isAlreadyInPath, resolvePrerequisite } from '../src/data/prerequisites';
import { filterCourses } from '../src/data/search';

const source = JSON.parse(readFileSync(path.join(process.cwd(), 'data/source/courses.json'), 'utf8'));

describe('prepared catalogue', () => {
  it('keeps unique Clear Water Bay course-semester pairs and regenerates deterministically', () => {
    const first = prepareCourses(source);
    const second = prepareCourses(source);
    const courses = [...first.coursesByTerm.values()].flat();
    expect(courses).toHaveLength(12427);
    expect(new Set(courses.map((course: Course) => `${course.termCode}:${course.code}`)).size).toBe(12427);
    expect(JSON.stringify(first.manifest)).toBe(JSON.stringify(second.manifest));
    for (const [termCode, records] of first.coursesByTerm) {
      expect(JSON.stringify(records)).toBe(JSON.stringify(second.coursesByTerm.get(termCode)));
    }
  });

  it('looks up courses by semester and code, including compact URLs', () => {
    expect(getCoursesForTerm('2610')).toHaveLength(3170);
    expect(getCourse('2610', 'COMP2011')?.code).toBe('COMP 2011');
    expect(getCourse('bogus', 'COMP2011')).toBeUndefined();
    expect(getAvailableTermsForCourse('comp2011')[0]).toBe('2610');
  });
});

describe('search and prerequisites', () => {
  const courses = getCoursesForTerm('2610');

  it('combines department with space and case independent code/title matching', () => {
    expect(filterCourses(courses, 'CSE', 'comp2011').map((course) => course.code)).toEqual(['COMP 2011']);
    expect(filterCourses(courses, 'CSE', 'programming with c++').some((course) => course.code === 'COMP 2011')).toBe(true);
    expect(filterCourses(courses, 'MATH', 'comp2011')).toHaveLength(0);
  });

  it('extracts unique links while leaving AND/OR wording to the original text', () => {
    expect(extractCourseCodes('COMP 1023 OR (COMP1028 AND MATH 1014); COMP 1023, from 2022'))
      .toEqual(['COMP 1023', 'COMP 1028', 'MATH 1014']);
    expect(extractCourseCodes('Instructor consent or equivalent')).toEqual([]);
  });

  it('prefers the viewed semester, then the latest available one', () => {
    expect(resolvePrerequisite('COMP 1023', '2610')?.termCode).toBe('2610');
    expect(resolvePrerequisite('ACCT 5150', '2610')?.termCode).toBe('2540');
    expect(resolvePrerequisite('FAKE 9999', '2610')).toBeUndefined();
  });

  it('ends a synthetic cycle on its own path but allows a sibling path', () => {
    const a = { termCode: '2610', code: 'TEST 1000' } as Course;
    const b = { termCode: '2610', code: 'TEST 2000' } as Course;
    const aPath = extendPath(a, new Set<string>());
    const bPath = extendPath(b, aPath);
    expect(isAlreadyInPath(a, bPath)).toBe(true);
    expect(isAlreadyInPath(b, aPath)).toBe(false);
    expect(isAlreadyInPath(b, new Set<string>())).toBe(false);
  });
});
