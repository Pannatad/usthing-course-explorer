import { readFileSync, mkdirSync, writeFileSync, readdirSync, mkdtempSync, renameSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { extractCourseCodes } from './lib/prerequisite-parser.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const config = JSON.parse(readFileSync(path.join(projectRoot, 'data/catalog-config.json'), 'utf8'));
const generatedDirectory = path.join(projectRoot, 'src/data/generated');
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const text = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Expected non-empty ${field}`);
  return value.trim();
};
const optionalText = (value, field) => {
  if (value == null) return '';
  if (typeof value !== 'string') throw new Error(`Expected text for ${field}`);
  return value.trim();
};
const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());

export function normalizeCourse(record) {
  const minCredits = record.min_credits;
  const maxCredits = record.max_credits;
  if (!Number.isFinite(minCredits) || !Number.isFinite(maxCredits) || minCredits < 0 || maxCredits < minCredits) {
    throw new Error(`Invalid credits for ${record.prefix} ${record.number}`);
  }
  return {
    termCode: text(record.term_code, 'term_code'), termName: text(record.term_name, 'term_name'),
    code: `${text(record.prefix, 'prefix').toUpperCase()} ${text(record.number, 'number').toUpperCase()}`,
    department: text(record.department_code, 'department_code'), title: text(record.title, 'title'),
    minCredits, maxCredits,
    description: optionalText(record.description, 'description'), prerequisite: optionalText(record.prerequisite, 'prerequisite'),
    corequisite: optionalText(record.corequisite, 'corequisite'), exclusion: optionalText(record.exclusion, 'exclusion'),
    careerType: optionalText(record.career_type, 'career_type'),
  };
}

export function prepareCourses(sourceRecords, provenance = {}) {
  if (!Array.isArray(sourceRecords)) throw new Error('The source dataset must be a JSON array');
  const latest = new Map();
  const report = { sourceRows: sourceRecords.length, excludedCampus: 0, excludedTerm: 0, duplicateVersions: 0, inactiveLatest: 0 };
  for (const record of sourceRecords) {
    const campus = text(record.campus_code, 'campus_code');
    const term = text(record.term_code, 'term_code');
    if (!/^\d{4}$/.test(term)) throw new Error(`Invalid term: ${term}`);
    if (campus !== config.campus) { report.excludedCampus++; continue; }
    if (!config.terms.includes(term)) { report.excludedTerm++; continue; }
    const prefix = text(record.prefix, 'prefix').toUpperCase();
    const number = text(record.number, 'number').toUpperCase();
    if (!/^[A-Z]+$/.test(prefix) || !/^\d[\dA-Z-]*$/.test(number)) throw new Error(`Invalid code: ${prefix} ${number}`);
    if (!['ACTIVE', 'INACTIVE'].includes(record.status)) throw new Error(`Invalid status for ${prefix} ${number}`);
    if (typeof record.timestamp !== 'string' || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(record.timestamp)) throw new Error('Timestamp needs an explicit timezone');
    const timestamp = Date.parse(record.timestamp);
    if (!Number.isFinite(timestamp)) throw new Error(`Invalid timestamp for ${prefix} ${number}`);
    const key = `${term}:${prefix} ${number}`;
    const prior = latest.get(key);
    if (prior) report.duplicateVersions++;
    // Keep tied candidates until the newest timestamp is known, independent of input order.
    if (!prior || timestamp > prior.timestamp) latest.set(key, { timestamp, records: [record] });
    else if (timestamp === prior.timestamp) prior.records.push(record);
  }
  const courses = [];
  for (const [key, value] of latest) {
    if (new Set(value.records.map(canonical)).size > 1) throw new Error(`Conflicting latest records for ${key}`);
    const record = value.records[0];
    if (record.status === 'INACTIVE') { report.inactiveLatest++; continue; }
    courses.push(normalizeCourse(record));
  }
  courses.sort((a, b) => compare(a.termCode, b.termCode) || compare(a.code, b.code));
  const prefixes = new Set(courses.map((c) => c.code.split(' ')[0]));
  const detailStrings = new Map();
  const payloadFor = (c) => JSON.stringify({ description: c.description, prerequisite: c.prerequisite, corequisite: c.corequisite,
    exclusion: c.exclusion, careerType: c.careerType, prerequisiteCodes: extractCourseCodes(c.prerequisite, prefixes) });
  for (const c of courses) { const value = payloadFor(c); detailStrings.set(value, JSON.parse(value)); }
  const sortedDetails = [...detailStrings.keys()].sort(compare);
  const detailIds = new Map(sortedDetails.map((value, i) => [value, i]));
  const details = sortedDetails.map((value) => detailStrings.get(value));
  const coursesByTerm = new Map();
  const names = new Map();
  const courseTerms = {};
  for (const c of courses) {
    if (names.has(c.termCode) && names.get(c.termCode) !== c.termName) throw new Error(`Conflicting semester name ${c.termCode}`);
    names.set(c.termCode, c.termName);
    const detailId = detailIds.get(payloadFor(c));
    const summary = { termCode: c.termCode, code: c.code, department: c.department, title: c.title,
      minCredits: c.minCredits, maxCredits: c.maxCredits, careerType: c.careerType, detailId,
      hasPrerequisite: Boolean(c.prerequisite), prerequisiteCount: details[detailId].prerequisiteCodes.length };
    if (!coursesByTerm.has(c.termCode)) coursesByTerm.set(c.termCode, []);
    coursesByTerm.get(c.termCode).push(summary);
    (courseTerms[c.code] ??= []).push(c.termCode);
  }
  const terms = [...coursesByTerm.keys()].sort((a, b) => compare(b, a)).map((code) => ({ code, name: names.get(code),
    count: coursesByTerm.get(code).length, departments: [...new Set(coursesByTerm.get(code).map((c) => c.department))].sort(compare) }));
  const manifest = { schemaVersion: config.schemaVersion, sourceRevision: config.revision, parquetSha256: config.parquetSha256,
    sourceSha256: provenance.sourceSha256 ?? sha256(JSON.stringify([...sourceRecords].map(canonical).sort(compare))),
    configurationSha256: sha256(JSON.stringify(config)), detailChunkSize: config.detailChunkSize, detailCount: details.length,
    terms, courseTerms: Object.fromEntries(Object.keys(courseTerms).sort(compare).map((code) => [code, courseTerms[code].sort((a, b) => compare(b, a))])) };
  const unresolved = courses.flatMap((c) => details[detailIds.get(payloadFor(c))].prerequisiteCodes
    .filter((code) => !courseTerms[code]).map((code) => ({ course: `${c.termCode}:${c.code}`, reference: code })));
  return { coursesByTerm, details, manifest, report: { ...report, uniqueCourses: courses.length, sharedDetails: details.length, unresolvedPrerequisites: unresolved } };
}

export function createArtifacts(prepared) {
  const files = new Map();
  const json = (name, value) => files.set(name, `${JSON.stringify(value)}\n`);
  for (const [term, rows] of prepared.coursesByTerm) json(`summaries/${term}.json`, rows);
  const chunks = [];
  for (let offset = 0; offset < prepared.details.length; offset += config.detailChunkSize) {
    const file = `details/${String(chunks.length).padStart(3, '0')}.json`;
    chunks.push(file); json(file, prepared.details.slice(offset, offset + config.detailChunkSize));
  }
  for (const rows of prepared.coursesByTerm.values()) for (const row of rows) {
    if (!prepared.details[row.detailId]) throw new Error(`Invalid detail reference ${row.code}`);
  }
  json('manifest.json', prepared.manifest);
  const catalogueJsonBytes = [...files.values()].reduce((sum, body) => sum + Buffer.byteLength(body), 0);
  json('quality-report.json', { ...prepared.report, catalogueJsonBytes, baselineJsonBytes: config.baselineJsonBytes,
    reduction: 1 - catalogueJsonBytes / config.baselineJsonBytes,
    artifactBytes: Object.fromEntries([...files].map(([name, body]) => [name, Buffer.byteLength(body)])) });
  files.set('loaders.ts', `// Generated by prepare:data. Do not edit.\nimport type { CourseSummary, CourseDetailPayload } from '../course';\n\nexport const summaryLoaders: Record<string, () => readonly CourseSummary[]> = {\n${prepared.manifest.terms.map((t) => `  '${t.code}': () => require('./summaries/${t.code}.json'),`).join('\n')}\n};\n\nexport const detailLoaders: Record<number, () => readonly CourseDetailPayload[]> = {\n${chunks.map((file, i) => `  ${i}: () => require('./${file}'),`).join('\n')}\n};\n`);
  return files;
}

export function writePreparedData(prepared, directory) {
  for (const [name, body] of createArtifacts(prepared)) {
    const destination = path.join(directory, name);
    mkdirSync(path.dirname(destination), { recursive: true }); writeFileSync(destination, body);
  }
}
function fileNames(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? fileNames(path.join(directory, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]).sort(compare);
}
export function checkArtifacts(directory, expected) {
  const actual = fileNames(directory);
  if (JSON.stringify(actual) !== JSON.stringify([...expected.keys()].sort(compare))) throw new Error('Generated filenames differ; run npm run prepare:data');
  for (const [name, body] of expected) if (readFileSync(path.join(directory, name), 'utf8') !== body) throw new Error(`Stale generated file: ${name}`);
}
export function prepareFromDisk() {
  const raw = readFileSync(path.join(projectRoot, 'data/source/courses.json'));
  const parquet = path.join(projectRoot, 'data/source/courses.parquet');
  if (!existsSync(parquet) || sha256(readFileSync(parquet)) !== config.parquetSha256) throw new Error('Pinned Parquet snapshot hash mismatch');
  return prepareCourses(JSON.parse(raw), { sourceSha256: sha256(raw) });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prepared = prepareFromDisk();
  const files = createArtifacts(prepared);
  const report = JSON.parse(files.get('quality-report.json'));
  if (report.reduction < config.minimumReduction) throw new Error(`Size reduction ${(report.reduction * 100).toFixed(1)}% is below target`);
  const check = process.argv.includes('--check');
  const staging = mkdtempSync(path.join(check ? os.tmpdir() : path.dirname(generatedDirectory), '.catalog-'));
  try {
    writePreparedData(prepared, staging); checkArtifacts(staging, files);
    if (check) checkArtifacts(generatedDirectory, files);
    else {
      const backup = `${staging}-previous`;
      if (existsSync(generatedDirectory)) renameSync(generatedDirectory, backup);
      try { renameSync(staging, generatedDirectory); }
      catch (error) { if (existsSync(backup)) renameSync(backup, generatedDirectory); throw error; }
      rmSync(backup, { recursive: true, force: true });
    }
  } finally { rmSync(staging, { recursive: true, force: true }); }
  console.log(`${check ? 'Verified' : 'Prepared'} ${report.uniqueCourses} courses, ${report.sharedDetails} shared details; ${(report.reduction * 100).toFixed(1)}% smaller catalogue JSON.`);
}
