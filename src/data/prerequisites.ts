import { catalog } from './catalog';
import { courseKey, type CourseSummary } from './course';
import type { CatalogRepository } from './repository';

export type PrerequisiteResolution =
  | { status: 'found'; summary: CourseSummary; usedFallback: boolean; requestedTermCode: string }
  | { status: 'unavailable'; code: string };

export function resolvePrerequisite(code: string, preferredTermCode: string, repository: CatalogRepository = catalog): PrerequisiteResolution {
  const sameTerm = repository.getCourseSummary(preferredTermCode, code);
  const latestTerm = repository.getAvailableTermsForCourse(code)[0];
  const summary = sameTerm ?? (latestTerm ? repository.getCourseSummary(latestTerm, code) : undefined);
  return summary
    ? { status: 'found', summary, usedFallback: summary.termCode !== preferredTermCode, requestedTermCode: preferredTermCode }
    : { status: 'unavailable', code };
}
export function isAlreadyInPath(course: Pick<CourseSummary, 'termCode' | 'code'>, path: ReadonlySet<string>) {
  return path.has(courseKey(course));
}
export function extendPath(course: Pick<CourseSummary, 'termCode' | 'code'>, path: ReadonlySet<string>) {
  return new Set([...path, courseKey(course)]);
}
