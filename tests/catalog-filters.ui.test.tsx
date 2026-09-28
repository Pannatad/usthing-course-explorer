import { describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useCatalogFilters } from '../src/features/catalog/useCatalogFilters';

jest.mock('../src/data/catalog', () => {
  const { makeFixtureCatalog } = require('./fixture-catalog');
  const { compactCourseCode } = require('../src/data/repository');
  const catalog = makeFixtureCatalog();
  return {
    catalog,
    ...catalog,
    compactCourseCode,
    terms: catalog.getTerms(),
    defaultTerm: catalog.getTerms()[0],
  };
});

const noFavorites: ReadonlySet<string> = new Set();
const codes = (courses: readonly { code: string }[]) => courses.map((course) => course.code);

describe('useCatalogFilters', () => {
  it('keeps a department and subject the new semester still offers', () => {
    const { result } = renderHook(() => useCatalogFilters(noFavorites));
    act(() => result.current.changeDepartment('ACCT'));
    act(() => result.current.setSubject('ACCT'));
    act(() => result.current.changeTerm('2540'));
    expect(result.current.department).toBe('ACCT');
    expect(result.current.subject).toBe('ACCT');
    expect(codes(result.current.results)).toEqual(['ACCT 5150']);
  });

  it('resets a department and subject the new semester does not offer', () => {
    const { result } = renderHook(() => useCatalogFilters(noFavorites));
    act(() => result.current.changeDepartment('CSE'));
    act(() => result.current.setSubject('COMP'));
    act(() => result.current.changeTerm('2540'));
    expect(result.current.term.name).toBe('2025-26 Summer');
    expect(result.current.department).toBe('All');
    expect(result.current.subject).toBe('All');
  });

  it('clears only an incompatible subject when the department changes', () => {
    const { result } = renderHook(() => useCatalogFilters(noFavorites));
    act(() => result.current.setSubject('COMP'));
    act(() => result.current.changeDepartment('CSE'));
    expect(result.current.subject).toBe('COMP');
    expect(result.current.subjects).toEqual(['COMP']);
    act(() => result.current.changeDepartment('MATH'));
    expect(result.current.subject).toBe('All');
  });

  it('describes active filters and shows no results for an invalid number', () => {
    const { result } = renderHook(() => useCatalogFilters(noFavorites));
    expect(result.current.hasAdditionalFilters).toBe(false);
    act(() => result.current.setNumber('2000'));
    act(() => result.current.setCreditComparison('greater'));
    act(() => result.current.setCreditValue('2'));
    expect(result.current.activeFilters).toEqual(['number > 2000', '> 2 credits']);
    expect(codes(result.current.results)).toEqual(['ACCT 5430', 'COMP 2011']);
    act(() => result.current.setNumber('20x'));
    expect(result.current.activeFilters).toEqual(['invalid number', '> 2 credits']);
    expect(result.current.results).toEqual([]);
    act(() => result.current.clearAdditionalFilters());
    expect(result.current.hasAdditionalFilters).toBe(false);
    expect(result.current.results).toHaveLength(6);
  });

  it('keeps the chosen credit amount listed even when no course offers it', () => {
    const { result } = renderHook(() => useCatalogFilters(noFavorites));
    expect(result.current.creditValues).toEqual([0, 3]);
    act(() => result.current.setCreditValue('7'));
    expect(result.current.creditValues).toEqual([0, 3, 7]);
  });

  it('narrows results to favorites only when asked', () => {
    const favorites: ReadonlySet<string> = new Set(['COMP2011']);
    const { result } = renderHook(() => useCatalogFilters(favorites));
    expect(result.current.results).toHaveLength(6);
    act(() => result.current.toggleFavoritesOnly());
    expect(codes(result.current.results)).toEqual(['COMP 2011']);
  });
});
