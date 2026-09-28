import { useMemo, useState } from 'react';

import {
  compactCourseCode,
  defaultTerm,
  getCourseSummaries,
  searchCourses,
  terms,
  type CourseSearchFilters,
} from '@/data/catalog';
import { isValidCourseNumber, parseCourseCode, type CreditFilter } from '@/data/search';

export type CreditComparison = CreditFilter['comparison'];
type Option = { value: string; label: string };

const ALL = 'All';
const termOptions: Option[] =terms.map((term) => ({ value: term.code, label: term.name }));
const creditSymbols: Record<CreditComparison, string> = { exact: '=', greater: '>', lower: '<' };

function findTerm(termCode: string) {
  return terms.find((term) => term.code === termCode) ?? defaultTerm;
}

function inDepartment(course: { department: string }, department: string) {
  return department === ALL || course.department === department;
}

/** A subject stays selected only if some course in that semester and department still uses it. */
function subjectIsAvailable(termCode: string, department: string, subject: string) {
  if (subject === ALL) {
    return true;
  }
  return getCourseSummaries(termCode).some(
    (course) => inDepartment(course, department) && parseCourseCode(course.code)?.subject === subject,
  );
}

function listSubjects(termCode: string, department: string) {
  const subjects = new Set<string>();
  for (const course of getCourseSummaries(termCode)) {
    const subject = inDepartment(course, department) ? parseCourseCode(course.code)?.subject : undefined;
    if (subject) {
      subjects.add(subject);
    }
  }
  return [...subjects].sort();
}

/** Every whole credit inside each course's range, plus exact endpoints such as 0.5. */
function listCreditValues(termCode: string, selectedValue: string) {
  const values = new Set<number>([0]);
  for (const course of getCourseSummaries(termCode)) {
    values.add(course.minCredits);
    values.add(course.maxCredits);
    for (let value = Math.ceil(course.minCredits); value <= course.maxCredits; value++) {
      values.add(value);
    }
  }
  // Keep the current choice visible even if the new semester has no course with that amount.
  if (selectedValue) {
    values.add(Number(selectedValue));
  }
  return [...values].sort((a, b) => a - b);
}

/**
 * Owns the catalogue's filter state and the rules that keep it consistent.
 * Components only display the values and call the returned actions.
 */
export function useCatalogFilters(favoriteCodes: ReadonlySet<string>) {
  const [termCode, setTermCode] = useState(defaultTerm.code);
  const [department, setDepartment] = useState(ALL);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState(ALL);
  const [number, setNumber] = useState('');
  const [creditValue, setCreditValue] = useState('');
  const [creditComparison, setCreditComparison] = useState<CreditComparison>('exact');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const term = findTerm(termCode);
  const validNumber = isValidCourseNumber(number);

  const departmentOptions = useMemo<Option[]>(
    () => [
      { value: ALL, label: 'All departments' },
      ...term.departments.map((value) => ({ value, label: value })),
    ],
    [term],
  );
  const subjects = useMemo(() => listSubjects(termCode, department), [termCode, department]);
  const creditValues = useMemo(
    () => listCreditValues(termCode, creditValue),
    [termCode, creditValue],
  );

  const activeFilters = [
    subject !== ALL ? subject : '',
    number ? (validNumber ? `number > ${number}` : 'invalid number') : '',
    creditValue ? `${creditSymbols[creditComparison]} ${creditValue} credits` : '',
  ].filter(Boolean);
  const hasAdditionalFilters =
    subject !== ALL || !!number || !!creditValue || creditComparison !== 'exact';

  const results = useMemo(() => {
    // An invalid number shows its hint and no results rather than silently ignoring the filter.
    if (!validNumber) {
      return [];
    }
    const filters: CourseSearchFilters = {
      termCode,
      department,
      query,
      subject,
      numberAbove: number ? Number(number) : undefined,
      credits: creditValue
        ? { comparison: creditComparison, value: Number(creditValue) }
        : undefined,
    };
    const matches = searchCourses(filters);
    if (!favoritesOnly) {
      return matches;
    }
    return matches.filter((course) => favoriteCodes.has(compactCourseCode(course.code)));
  }, [
    termCode,
    department,
    query,
    subject,
    number,
    validNumber,
    creditValue,
    creditComparison,
    favoritesOnly,
    favoriteCodes,
  ]);

  /** Keeps the department and subject when the new semester still offers them. */
  function changeTerm(nextTermCode: string) {
    const nextTerm = terms.find((item) => item.code === nextTermCode);
    const nextDepartment = nextTerm?.departments.includes(department) ? department : ALL;
    setTermCode(nextTermCode);
    setDepartment(nextDepartment);
    if (!subjectIsAvailable(nextTermCode, nextDepartment, subject)) {
      setSubject(ALL);
    }
  }

  function changeDepartment(nextDepartment: string) {
    setDepartment(nextDepartment);
    if (!subjectIsAvailable(termCode, nextDepartment, subject)) {
      setSubject(ALL);
    }
  }

  function clearAdditionalFilters() {
    setSubject(ALL);
    setNumber('');
    setCreditValue('');
    setCreditComparison('exact');
  }

  function toggleFavoritesOnly() {
    setFavoritesOnly((value) => !value);
  }

  return {
    term,
    termOptions,
    departmentOptions,
    subjects,
    creditValues,
    termCode,
    department,
    query,
    subject,
    number,
    creditValue,
    creditComparison,
    favoritesOnly,
    activeFilters,
    hasAdditionalFilters,
    results,
    changeTerm,
    changeDepartment,
    setQuery,
    setSubject,
    setNumber,
    setCreditValue,
    setCreditComparison,
    toggleFavoritesOnly,
    clearAdditionalFilters,
  };
}

export type CatalogFiltersState = ReturnType<typeof useCatalogFilters>;
