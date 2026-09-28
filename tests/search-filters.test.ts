import { describe, expect, it } from 'vitest';
import { matchesCredits, parseCourseCode } from '../src/data/search';
import { createCatalogRepository } from '../src/data/repository';
import type { CourseSummary } from '../src/data/course';
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
  it('lists undergraduate courses before postgraduate ones within a department', () => {
    const course = (code: string, careerType: string): CourseSummary => ({ termCode: '2610', code, title: code, department: 'CSE', careerType, minCredits: 3, maxCredits: 3, detailId: 0, hasPrerequisite: false, prerequisiteCount: 0 });
    const summaries = [course('ARIN 5101', 'PG'), course('COMP 1021', 'UG'), course('COMP 5111', 'PG'), course('CSIT 2011', 'UG')];
    const repo = createCatalogRepository(
      { schemaVersion: 2, detailChunkSize: 1, detailCount: 1, terms: [{ code: '2610', name: '2026-27 Fall', count: 4, departments: ['CSE'] }], courseTerms: {} },
      { summaries: { '2610': () => summaries }, details: {} },
    );
    const codes = (department: string) => repo.searchCourses({ termCode: '2610', department, query: '' }).map((c) => c.code);
    expect(codes('CSE')).toEqual(['COMP 1021', 'CSIT 2011', 'ARIN 5101', 'COMP 5111']);
    expect(codes('All')).toEqual(['ARIN 5101', 'COMP 1021', 'COMP 5111', 'CSIT 2011']);
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
