import { createCatalogRepository, type Manifest } from '../src/data/repository';
import type { CourseDetailPayload, CourseSummary } from '../src/data/course';
const details: CourseDetailPayload[] = [
  { description:'Learn programming', prerequisite:'COMP 1023 OR COMP 1028; CORE 1120', corequisite:'', exclusion:'', careerType:'UG', prerequisiteCodes:['COMP 1023','COMP 1028','CORE 1120'] },
  { description:'Python foundations', prerequisite:'',corequisite:'',exclusion:'',careerType:'UG',prerequisiteCodes:[] },
  { description:'Bridge', prerequisite:'COMP 1021',corequisite:'',exclusion:'',careerType:'UG',prerequisiteCodes:['COMP 1021'] },
  { description:'Computer science', prerequisite:'COMP 2011',corequisite:'',exclusion:'',careerType:'UG',prerequisiteCodes:['COMP 2011'] },
  { description:'Accounting', prerequisite:'ACCT 5150',corequisite:'',exclusion:'',careerType:'PG',prerequisiteCodes:['ACCT 5150'] },
  { description:'Old accounting course', prerequisite:'',corequisite:'',exclusion:'',careerType:'PG',prerequisiteCodes:[] },
];
const summary=(termCode:string,code:string,title:string,department:string,detailId:number):CourseSummary=>({termCode,code,title,department,detailId,minCredits:3,maxCredits:3,hasPrerequisite:!!details[detailId].prerequisite,prerequisiteCount:details[detailId].prerequisiteCodes.length});
const rows:Record<string,CourseSummary[]>={
  '2610':[
    summary('2610','ACCT 5430','Tax and Business Strategy','ACCT',4),
    summary('2610','COMP 1021','Introduction to Computer Science','CSE',3),
    summary('2610','COMP 1023','Introduction to Python','CSE',1),
    summary('2610','COMP 1028','Extended Python','CSE',2),
    summary('2610','COMP 2011','Programming with C++','CSE',0),
    summary('2610','MATH 1014','Calculus','MATH',1),
  ],
  '2540':[summary('2540','ACCT 5150','Accounting Foundations','ACCT',5)],
};
export function makeFixtureCatalog(){
  const manifest:Manifest={schemaVersion:2,detailChunkSize:1,detailCount:details.length,
    terms:[{code:'2610',name:'2026-27 Fall',count:6,departments:['ACCT','CSE','MATH']},{code:'2540',name:'2025-26 Summer',count:1,departments:['ACCT']}],
    courseTerms:Object.fromEntries(Object.values(rows).flat().map(c=>[c.code,[c.termCode]]))};
  return createCatalogRepository(manifest,{summaries:Object.fromEntries(Object.entries(rows).map(([term,courses])=>[term,()=>courses])),details:Object.fromEntries(details.map((d,i)=>[i,()=>[d]]))});
}
