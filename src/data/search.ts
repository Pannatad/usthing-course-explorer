export function normalizeSearch(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

export type CreditFilter = { comparison: 'exact' | 'greater' | 'lower'; value: number };

/** An empty value means "no number filter"; anything else must be a safe whole number. */
export function isValidCourseNumber(value: string) {
  return !value || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)));
}

export function parseCourseCode(code: string) {
  const match = /^([A-Z]+)(\d+)[A-Z-]*$/.exec(normalizeSearch(code));
  return match ? { subject: match[1], number: Number(match[2]) } : undefined;
}

export function matchesCredits(course: { minCredits: number; maxCredits: number }, filter?: CreditFilter) {
  if (!filter) return true;
  if (!Number.isFinite(filter.value) || filter.value < 0) return false;

  switch (filter.comparison) {
    case 'exact':
      return course.minCredits <= filter.value
        && course.maxCredits >= filter.value;

    case 'greater':
      return course.maxCredits > filter.value;

    case 'lower':
      return course.minCredits < filter.value;
  }
}
