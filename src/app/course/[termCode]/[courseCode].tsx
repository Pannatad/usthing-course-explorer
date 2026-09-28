import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrerequisiteExplorer } from '@/components/PrerequisiteExplorer';
import { FavoriteButton } from '@/components/FavoriteButton';
import { getCourseDetails } from '@/data/catalog';
import { formatCredits } from '@/data/course';
import { colors } from '@/theme';

export default function CourseDetailsScreen() {
  const { termCode, courseCode } = useLocalSearchParams<{
    termCode: string;
    courseCode: string;
  }>();
  const course = typeof termCode === 'string' && typeof courseCode === 'string'
    ? getCourseDetails(termCode, courseCode) : undefined;

  if (!course) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Course not found' }} />
        <View style={styles.content}>
          <Text style={styles.title}>Course not found</Text>
          <Text style={styles.body}>This course is not in the supplied Clear Water Bay catalogue.</Text>
          <Link href="/" style={styles.link}>Back to courses</Link>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: course.code }} />
      <View style={styles.hero}>
        <View style={styles.heroHeading}><FavoriteButton code={course.code} /><Text style={styles.code}>{course.code}</Text></View>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.metadata}>{course.termName} · {course.department}</Text>
        <Text style={styles.metadata}>{formatCredits(course)} · {course.careerType}</Text>
      </View>

      <Link href={{ pathname: '/compare', params: { termCode: course.termCode, courseCode: course.code } }} asChild>
        <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={styles.link}>Compare with another course →</Text>
        </Pressable>
      </Link>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.body}>{course.description || 'No description supplied.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prerequisites</Text>
        <View style={styles.requirement}><Text style={styles.requirementTitle}>Requirement</Text><Text style={styles.body}>{course.prerequisite || 'No listed prerequisites.'}</Text></View>
        {!!course.prerequisite && <PrerequisiteExplorer course={course} />}
      </View>

      {!!course.corequisite && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Corequisites</Text>
          <Text style={styles.body}>{course.corequisite}</Text>
        </View>
      )}
      {!!course.exclusion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exclusions</Text>
          <Text style={styles.body}>{course.exclusion}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48, gap: 6 },
  hero: { backgroundColor: colors.courseSurface, borderRadius: 16, padding: 20, gap: 8, marginBottom: 8 },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: -8 },
  code: { color: colors.accent, fontSize: 27, fontWeight: '700' },
  title: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: '700' },
  metadata: { color: colors.secondaryText, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  section: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  requirement: { backgroundColor: colors.searchSurface, borderRadius: 12, padding: 16, gap: 8 },
  requirementTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: colors.accent, fontSize: 19, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  link: { color: colors.accent, fontSize: 15, fontWeight: '700', marginTop: 12 },
});

export { CatalogErrorBoundary as ErrorBoundary } from '@/components/CatalogErrorBoundary';
