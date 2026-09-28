import { useLocalSearchParams } from 'expo-router';

import { CourseComparison } from '@/features/comparison/CourseComparison';

export default function CompareScreen() {
  const { termCode, courseCode } = useLocalSearchParams<{ termCode?: string; courseCode?: string }>();
  return <CourseComparison initialTerm={termCode} initialCourse={courseCode} />;
}

export { CatalogErrorBoundary as ErrorBoundary } from '@/components/CatalogErrorBoundary';
