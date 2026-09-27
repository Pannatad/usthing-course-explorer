import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { describe, it, expect } from 'vitest';
import { createCatalogRepository, type Manifest } from '../src/data/repository';
import { summaryLoaders, detailLoaders } from '../src/data/generated/loaders';

// Host-only measurements. These do not measure native startup, input latency, or frames.
describe('repository workload',()=>{
  it('keeps repeated working-set caches stable and records a reproducible host benchmark',()=>{
    const manifest=JSON.parse(readFileSync('src/data/generated/manifest.json','utf8')) as Manifest;
    const repo=createCatalogRepository(manifest,{summaries:summaryLoaders,details:detailLoaders});
    const measure=(fn:()=>unknown)=>{const start=performance.now();fn();return performance.now()-start;};
    const firstTermMs=measure(()=>repo.getCourseSummaries('2610'));
    const queries=['','comp','comp2011','programming with c++','math','unmatched'];
    const searches:number[]=[];
    for(let i=0;i<120;i++) searches.push(measure(()=>repo.searchCourses({termCode:'2610',department:i%2?'CSE':'All',query:queries[i%queries.length]})));
    expect(repo.getDiagnostics().loadedDetailChunks).toHaveLength(0);
    const firstDetailMs=measure(()=>repo.getCourseDetails('2610','COMP2011'));
    const repeatDetailMs=measure(()=>repo.getCourseDetails('2610','COMP2011'));
    function cycle(){for(const term of manifest.terms){repo.getCourseSummaries(term.code);repo.getCourseDetails(term.code,'COMP2011');repo.getCourseDetails(term.code,'LIFS4060');}}
    cycle();const warmed=repo.getDiagnostics();
    for(let i=0;i<20;i++) cycle();
    expect(repo.getDiagnostics()).toEqual(warmed);
    searches.sort((a,b)=>a-b);
    const report={scope:'Node host only; not native UI performance',node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model,
      firstTermMs,searchOperations:searches.length,searchMedianMs:searches[Math.floor(searches.length/2)],searchP95Ms:searches[Math.ceil(searches.length*.95)-1],firstDetailMs,repeatDetailMs,cycles:20,cachesAfter20Cycles:repo.getDiagnostics()};
    console.log(JSON.stringify(report));
    // Opt-in artifact output keeps ordinary test runs read-only with respect to tracked files.
    if(process.env.CATALOG_BENCHMARK_OUTPUT) writeFileSync(process.env.CATALOG_BENCHMARK_OUTPUT,JSON.stringify(report,null,2)+'\n');
  });
});
