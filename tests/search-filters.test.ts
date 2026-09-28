import { describe, expect, it } from 'vitest';
import { matchesCredits, parseCourseCode } from '../src/data/search';
import { makeFixtureCatalog } from './fixture-catalog';

describe('structured course filters', () => {
  it('parses course prefixes and numeric portions with suffixes', () => {
    expect(parseCourseCode(' comp 2011A ')).toEqual({ subject: 'COMP', number: 2011 });
    expect(parseCourseCode('invalid')).toBeUndefined();
  });
  it('combines subject, strict number threshold, credits and text without details', () => {
    const repo = makeFixtureCatalog();
    const filters = { termCode: '2610', department: 'All', query: '', subject: 'COMP', numberAbove: 2000, credits: { comparison: 'exact' as const, value: 3 } };
    expect(repo.searchCourses(filters).map(c => c.code)).toEqual(['COMP 2011']);
    expect(repo.searchCourses({ ...filters, numberAbove: 2011 })).toEqual([]);
    expect(repo.searchCourses({ ...filters, department: 'MATH' })).toEqual([]);
    expect(repo.searchCourses({ ...filters, query: 'Python' })).toEqual([]);
    expect(repo.searchCourses({ ...filters, credits: { comparison: 'greater', value: 3 } })).toEqual([]);
    expect(repo.getDiagnostics().loadedDetailChunks).toEqual([]);
    expect(repo.searchCourses(filters)[0].careerType).toBe('UG');
  });
  it('matches variable ranges, fractional credits, zero, and strict boundaries', () => {
    const course = { minCredits: 1, maxCredits: 4 };
    expect(matchesCredits(course, { comparison: 'exact', value: 3 })).toBe(true);
    expect(matchesCredits(course, { comparison: 'greater', value: 3 })).toBe(true);
    expect(matchesCredits(course, { comparison: 'greater', value: 4 })).toBe(false);
    expect(matchesCredits(course, { comparison: 'exact', value: 0 })).toBe(false);
    expect(matchesCredits({ minCredits: 0.5, maxCredits: 0.5 }, { comparison: 'exact', value: 0.5 })).toBe(true);
    expect(matchesCredits({ minCredits: 0, maxCredits: 0 }, { comparison: 'exact', value: 0 })).toBe(true);
    expect(matchesCredits(course, { comparison: 'exact', value: NaN })).toBe(false);
    expect(matchesCredits(course)).toBe(true);
  });
});
