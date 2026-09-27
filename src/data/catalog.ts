import { detailLoaders, summaryLoaders } from './generated/loaders';
import { createCatalogRepository, type Manifest } from './repository';

const manifest = require('./generated/manifest.json') as Manifest;
export const catalog = createCatalogRepository(manifest, { summaries: summaryLoaders, details: detailLoaders });
export const { getTerms, getCourseSummaries, getCourseSummary, getCourseDetails, getAvailableTermsForCourse, searchCourses } = catalog;
export const terms = getTerms();
export const defaultTerm = terms[0];
export { compactCourseCode } from './repository';
export type { Term } from './repository';
