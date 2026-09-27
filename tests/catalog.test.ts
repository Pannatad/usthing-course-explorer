import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { prepareCourses, createArtifacts, checkArtifacts, writePreparedData, config } from '../scripts/prepare-courses.mjs';
import { extractCourseCodes } from '../scripts/lib/prerequisite-parser.mjs';
import { catalog, getCourseDetails, getCourseSummary, searchCourses, getAvailableTermsForCourse } from '../src/data/catalog';
import { createCatalogRepository, CatalogIntegrityError, type Manifest } from '../src/data/repository';
import { summaryLoaders, detailLoaders } from '../src/data/generated/loaders';
import { extendPath, isAlreadyInPath, resolvePrerequisite } from '../src/data/prerequisites';
import type { CourseSummary } from '../src/data/course';
import baseline from './catalog-baseline.json';

const source = JSON.parse(readFileSync('data/source/courses.json', 'utf8'));
const base = source.find((r: {term_code: string}) => r.term_code === '2610');
const record = (overrides: Record<string, unknown> = {}) => ({ ...base, prefix: 'TEST', number: '1000', status: 'ACTIVE', timestamp: '2026-09-01T00:00:00+00:00', ...overrides });
const manifest = JSON.parse(readFileSync('src/data/generated/manifest.json', 'utf8')) as Manifest;

describe('preparation and provenance', () => {
  it('keeps the latest version, and does not resurrect inactive courses', () => {
    const result = prepareCourses([record({title:'Old', timestamp:'2026-01-01T00:00:00Z'}),record({title:'New'}),record({number:'2000'}),record({number:'2000',status:'INACTIVE',timestamp:'2026-10-01T00:00:00Z'})]);
    expect(result.coursesByTerm.get('2610').map((c: CourseSummary) => c.title)).toEqual(['New']);
    expect(result.report.inactiveLatest).toBe(1);
  });
  it('compares instants, not timezone strings', () => {
    const result = prepareCourses([record({title:'Earlier',timestamp:'2026-09-01T01:00:00+08:00'}),record({title:'Later',timestamp:'2026-08-31T20:00:00Z'})]);
    expect(result.coursesByTerm.get('2610')[0].title).toBe('Later');
  });
  it('rejects conflicting latest ties, accepts identical duplicates and obsolete conflicts', () => {
    expect(() => prepareCourses([record(),record({title:'Conflict'})])).toThrow(/TEST 1000/);
    expect(prepareCourses([record(),record()]).report.uniqueCourses).toBe(1);
    const rows=[record(),record({title:'Conflict'}),record({timestamp:'2026-10-01T00:00:00Z'})];
    expect(prepareCourses(rows).report.uniqueCourses).toBe(1);
    expect(prepareCourses([...rows].reverse()).report.uniqueCourses).toBe(1);
  });
  it('validates selected content only, normalizes optional nulls, rejects malformed credit ranges', () => {
    const result=prepareCourses([record({title:null,timestamp:'2026-01-01T00:00:00Z'}),record({description:null,prerequisite:null})]);
    expect(result.details[0].description).toBe('');
    for(const credits of [{min_credits:-1},{min_credits:NaN},{max_credits:Infinity},{min_credits:5,max_credits:1}]) expect(()=>prepareCourses([record(credits)])).toThrow(/credits/);
    expect(()=>prepareCourses([record({description:12})])).toThrow(/description/);
    expect(()=>prepareCourses([record({timestamp:'invalid'})])).toThrow(/Timestamp/);
  });
  it('filters campus/terms and reports exclusions', () => {
    const result=prepareCourses([record(),record({campus_code:'GZ'}),record({term_code:'2410'})]);
    expect(result.report).toMatchObject({uniqueCourses:1,excludedCampus:1,excludedTerm:1});
  });
  it('deduplicates identical detail payloads without merging differing semester wording', () => {
    const result=prepareCourses([record(),record({term_code:'2530',term_name:'2025-26 Spring'}),record({number:'2000',prerequisite:'TEST 1000'})]);
    expect(result.details).toHaveLength(2);
    expect(result.coursesByTerm.get('2610')[0].detailId).toBe(result.coursesByTerm.get('2530')[0].detailId);
  });
  it('is deterministic even when source order changes', () => {
    const first=createArtifacts(prepareCourses(source));
    const second=createArtifacts(prepareCourses([...source].reverse()));
    expect([...second]).toEqual([...first]);
  });
  it('detects stale content and extra generated files without rewriting them', () => {
    const dir=mkdtempSync(path.join(os.tmpdir(),'catalog-test-'));
    try {
      const prepared=prepareCourses([record()]);writePreparedData(prepared,dir);const files=createArtifacts(prepared);
      expect(()=>checkArtifacts(dir,files)).not.toThrow();
      writeFileSync(path.join(dir,'manifest.json'),'stale');expect(()=>checkArtifacts(dir,files)).toThrow(/Stale/);
      writePreparedData(prepared,dir);writeFileSync(path.join(dir,'obsolete.json'),'[]');expect(()=>checkArtifacts(dir,files)).toThrow(/filenames/);
    } finally {rmSync(dir,{recursive:true,force:true});}
  });
  it('preserves every pre-refactor displayed field and identity in the full real catalogue', () => {
    const rows=catalog.getTerms().flatMap(t=>catalog.getCourseSummaries(t.code).map(s=>getCourseDetails(t.code,s.code)!))
      .sort((a,b)=>a.termCode.localeCompare(b.termCode)||a.code.localeCompare(b.code));
    expect(rows).toHaveLength(baseline.records);
    expect(new Set(rows.map(c=>`${c.termCode}:${c.code}`)).size).toBe(baseline.records);
    const normalized=rows.map(c=>Object.fromEntries(baseline.fields.map(k=>[k,c[k as keyof typeof c]])));
    expect(createHash('sha256').update(JSON.stringify(normalized)).digest('hex')).toBe(baseline.displayedFieldsSha256);
  });
  it('meets the 40% serialized reduction target and has complete loader coverage', () => {
    const report=JSON.parse(readFileSync('src/data/generated/quality-report.json','utf8'));
    expect(report.reduction).toBeGreaterThanOrEqual(.4);
    expect(Object.keys(summaryLoaders).sort()).toEqual(manifest.terms.map(t=>t.code).sort());
    expect(Object.keys(detailLoaders)).toHaveLength(Math.ceil(manifest.detailCount/config.detailChunkSize));
    for(const t of manifest.terms) expect(summaryLoaders[t.code]()).toHaveLength(t.count);
  });
});

describe('repository search and loading', () => {
  it('combines department, code/title substring, case and whitespace normalization', () => {
    expect(searchCourses({termCode:'2610',department:'CSE',query:'comp 2011'}).map(c=>c.code)).toEqual(['COMP 2011']);
    expect(searchCourses({termCode:'2610',department:'CSE',query:'programming with c++'}).some(c=>c.code==='COMP 2011')).toBe(true);
    expect(searchCourses({termCode:'2610',department:'MATH',query:'comp2011'})).toEqual([]);
    expect(searchCourses({termCode:'bogus',department:'All',query:''})).toEqual([]);
    expect(getCourseSummary('2610','comp2011')?.code).toBe('COMP 2011');
    expect(getAvailableTermsForCourse(' comp 2011 ')).toContain('2610');
    expect(getCourseDetails('bogus','COMP2011')).toBeUndefined();
  });
  it('never loads details for browsing, search, lookup, or prerequisite resolution', () => {
    const spies=Object.fromEntries(Object.entries(detailLoaders).map(([key,fn])=>[key,vi.fn(fn)]));
    const repo=createCatalogRepository(manifest,{summaries:summaryLoaders,details:spies});
    repo.searchCourses({termCode:'2610',department:'All',query:'comp'});
    repo.getCourseSummary('2610','COMP2011');resolvePrerequisite('ACCT 5150','2610',repo);
    expect(repo.getDiagnostics().loadedDetailChunks).toEqual([]);
    for(const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled();
    const c=repo.getCourseDetails('2610','COMP2011')!;
    repo.getCourseDetails('2610','COMP2011');
    expect(spies[Math.floor(c.detailId/manifest.detailChunkSize)]).toHaveBeenCalledTimes(1);
  });
  it('distinguishes unknown routes from corrupt data', () => {
    const repo=createCatalogRepository(manifest,{summaries:summaryLoaders,details:{}});
    expect(repo.getCourseDetails('2610','NOPE9999')).toBeUndefined();
    expect(()=>repo.getCourseDetails('2610','COMP2011')).toThrow(CatalogIntegrityError);
    const bad=createCatalogRepository(manifest,{summaries:{},details:detailLoaders});
    expect(()=>bad.getCourseSummaries('2610')).toThrow(CatalogIntegrityError);
  });
  it('prefers same term, otherwise explicitly labels fallback and unavailable references', () => {
    expect(resolvePrerequisite('COMP 1023','2610')).toMatchObject({status:'found',usedFallback:false,summary:{termCode:'2610'}});
    expect(resolvePrerequisite('ACCT 5150','2610')).toMatchObject({status:'found',usedFallback:true,summary:{termCode:'2540'}});
    expect(resolvePrerequisite('CORE 1120','2610')).toEqual({status:'unavailable',code:'CORE 1120'});
  });
});

describe('prerequisite extraction and traversal', () => {
  const prefixes=new Set(['COMP','MATH','LIFS']);
  it.each([
    ['LIFS 2040/2210, and LIFS 3140',['LIFS 2040','LIFS 2210','LIFS 3140']],
    ['comp1023 or 1028, 2011 and MATH 1014',['COMP 1023','COMP 1028','COMP 2011','MATH 1014']],
    ['COMP 1022P OR COMP1022P; CORE 1120',['COMP 1022P','CORE 1120']],
    ['COMP 1023, taken before 2022; FROM 2022 YEAR 2023',['COMP 1023']],
    ['COMP 1023. 1028',['COMP 1023']],
    ['Instructor consent or equivalent',[]],
    ['COMP 1000-1999',[]],
  ])('extracts %s', (input, expected) => expect(extractCourseCodes(input,prefixes)).toEqual(expected));
  it('fixes the real shorthand and unknown-prefix omissions without changing text', () => {
    const c=getCourseDetails('2610','LIFS4060')!;
    expect(c.prerequisite).toBe('LIFS 2040/2210, and LIFS 3140');
    expect(c.prerequisiteCodes).toEqual(['LIFS 2040','LIFS 2210','LIFS 3140']);
    expect(getCourseDetails('2610','CHEM3010')!.prerequisiteCodes).toContain('CORE 1120');
  });
  it('stops self and two-node cycles while allowing sibling paths', () => {
    const a={termCode:'2610',code:'TEST 1000'},b={termCode:'2610',code:'TEST 2000'};
    const path=extendPath(a,new Set());expect(isAlreadyInPath(a,path)).toBe(true);
    expect(isAlreadyInPath(a,extendPath(b,path))).toBe(true);
    expect(isAlreadyInPath(b,path)).toBe(false);
    expect(isAlreadyInPath({...a,termCode:'2530'},path)).toBe(false);
  });
});
