export type Course = {
  termCode: string;
  termName: string;
  code: string;
  department: string;
  title: string;
  minCredits: number;
  maxCredits: number;
  description: string;
  prerequisite: string;
  corequisite: string;
  exclusion: string;
  careerType: string;
};

export function courseKey(course: Pick<Course, 'termCode' | 'code'>) {
  return `${course.termCode}:${course.code}`;
}

export function formatCredits(course: Pick<Course, 'minCredits' | 'maxCredits'>) {
  const amount = course.minCredits === course.maxCredits
    ? String(course.minCredits)
    : `${course.minCredits}–${course.maxCredits}`;
  return `${amount} ${course.maxCredits === 1 ? 'credit' : 'credits'}`;
}
