export type CourseSummary = {
  termCode: string;
  code: string;
  department: string;
  title: string;
  minCredits: number;
  maxCredits: number;
  detailId: number;
  hasPrerequisite: boolean;
  prerequisiteCount: number;
};

export type CourseDetailPayload = {
  description: string;
  prerequisite: string;
  corequisite: string;
  exclusion: string;
  careerType: string;
  prerequisiteCodes: readonly string[];
};

export type Course = CourseSummary & CourseDetailPayload & { termName: string };

export function courseKey(course: Pick<CourseSummary, 'termCode' | 'code'>) {
  return `${course.termCode}:${course.code}`;
}

export function formatCredits(course: Pick<CourseSummary, 'minCredits' | 'maxCredits'>) {
  const amount = course.minCredits === course.maxCredits
    ? String(course.minCredits)
    : `${course.minCredits}–${course.maxCredits}`;
  return `${amount} ${course.maxCredits === 1 ? 'credit' : 'credits'}`;
}
