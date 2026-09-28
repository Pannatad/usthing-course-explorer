import type { Course, CourseDetailPayload, CourseSummary } from './course';
import { normalizeSearch, parseCourseCode, matchesCredits, type CreditFilter } from './search';

export type Term = { code: string; name: string; count: number; departments: readonly string[] };
export type Manifest = {
  schemaVersion: number;
  detailChunkSize: number;
  detailCount: number;
  terms: readonly Term[];
  courseTerms: Record<string, readonly string[]>;
};
export type CatalogLoaders = {
  summaries: Record<string, () => readonly CourseSummary[]>;
  details: Record<number, () => readonly CourseDetailPayload[]>;
};
/** Every condition intersects; omitted optional filters match all courses. */
export type CourseSearchFilters = {
  termCode: string;
  department: string;
  query: string;
  subject?: string;
  numberAbove?: number;
  credits?: CreditFilter;
};
export class CatalogIntegrityError extends Error {
  constructor(message: string) { super(message); this.name = 'CatalogIntegrityError'; }
}
export function compactCourseCode(code: string) { return normalizeSearch(code); }

// A fresh instance is also useful for isolated tests and repeatable cold-load measurements.
export function createCatalogRepository(manifest: Manifest, loaders: CatalogLoaders) {
  if (manifest.schemaVersion !== 2 || !manifest.terms.length || !Number.isInteger(manifest.detailChunkSize) || manifest.detailChunkSize < 1) {
    throw new CatalogIntegrityError('Unsupported catalogue manifest');
  }
  const termsByCode = new Map(manifest.terms.map((term) => [term.code, term]));
  const availableTerms = new Map(Object.entries(manifest.courseTerms).map(([code, terms]) => [compactCourseCode(code), terms]));
  type Entry = { summary: CourseSummary; code: string; title: string; parts: ReturnType<typeof parseCourseCode> };
  type TermData = { summaries: readonly CourseSummary[]; byCode: Map<string, CourseSummary>; all: Entry[]; departments: Map<string, Entry[]> };
  const loadedTerms = new Map<string, TermData>();
  const loadedDetails = new Map<number, readonly CourseDetailPayload[]>();
  const empty: readonly CourseSummary[] = [];
  function termData(code: string) {
    if (!termsByCode.has(code)) return undefined;
    const cached = loadedTerms.get(code);
    if (cached) return cached;
    let summaries: readonly CourseSummary[];
    try {
      if (!Object.hasOwn(loaders.summaries, code)) throw new Error('missing loader');
      summaries = loaders.summaries[code]();
    } catch { throw new CatalogIntegrityError(`Unable to load semester ${code}`); }
    if (!Array.isArray(summaries) || summaries.length !== termsByCode.get(code)!.count) throw new CatalogIntegrityError(`Invalid semester ${code}`);
    const byCode = new Map<string, CourseSummary>();
    const all: Entry[] = [];
    const departments = new Map<string, Entry[]>();
    for (const summary of summaries) {
      const key = compactCourseCode(summary.code);
      if (summary.termCode !== code || byCode.has(key)) throw new CatalogIntegrityError(`Invalid course identity ${summary.code}`);
      byCode.set(key, summary);
      const entry = { summary, code: key, title: normalizeSearch(summary.title), parts: parseCourseCode(summary.code) };
      all.push(entry);
      const group = departments.get(summary.department) ?? [];
      group.push(entry); departments.set(summary.department, group);
    }
    const data = { summaries, byCode, all, departments };
    loadedTerms.set(code, data);
    return data;
  }
  function getCourseSummary(term: string, code: string) { return termData(term)?.byCode.get(compactCourseCode(code)); }
  function getCourseDetails(term: string, code: string): Course | undefined {
    const summary = getCourseSummary(term, code);
    if (!summary) return undefined;
    if (!Number.isInteger(summary.detailId) || summary.detailId < 0 || summary.detailId >= manifest.detailCount) {
      throw new CatalogIntegrityError(`Invalid detail reference for ${summary.code}`);
    }
    const chunk = Math.floor(summary.detailId / manifest.detailChunkSize);
    let payloads = loadedDetails.get(chunk);
    if (!payloads) {
      try {
        if (!Object.hasOwn(loaders.details, chunk)) throw new Error('missing chunk');
        payloads = loaders.details[chunk]();
      } catch { throw new CatalogIntegrityError(`Unable to load course detail group ${chunk}`); }
      if (!Array.isArray(payloads)) throw new CatalogIntegrityError(`Invalid detail group ${chunk}`);
      loadedDetails.set(chunk, payloads);
    }
    const detail = payloads[summary.detailId % manifest.detailChunkSize];
    if (!detail || !Array.isArray(detail.prerequisiteCodes)) throw new CatalogIntegrityError(`Missing course detail for ${summary.code}`);
    return { ...summary, ...detail, termName: termsByCode.get(term)!.name };
  }
  return {
    getTerms: () => manifest.terms,
    getCourseSummaries: (term: string) => termData(term)?.summaries ?? empty,
    getCourseSummary,
    getCourseDetails,
    getAvailableTermsForCourse: (code: string) => availableTerms.get(compactCourseCode(code)) ?? [],
    searchCourses: ({ termCode, department, query, subject, numberAbove, credits }: CourseSearchFilters) => {
      const data = termData(termCode);
      if (!data) return empty;
      const normalized = normalizeSearch(query);
      const candidates = department === 'All' ? data.all : data.departments.get(department) ?? [];
      return candidates.filter((entry) =>
        (!normalized || entry.code.includes(normalized) || entry.title.includes(normalized)) &&
        (!subject || subject === 'All' || entry.parts?.subject === subject) &&
        (numberAbove === undefined || (Number.isFinite(numberAbove) && entry.parts !== undefined && entry.parts.number > numberAbove)) &&
        matchesCredits(entry.summary, credits)
      ).map((entry) => entry.summary);
    },
    getDiagnostics: () => ({ loadedTerms: [...loadedTerms.keys()], loadedDetailChunks: [...loadedDetails.keys()] }),
  };
}
export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
