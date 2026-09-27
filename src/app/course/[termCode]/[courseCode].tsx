import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrerequisiteExplorer } from '@/components/PrerequisiteExplorer';
import { getCourse } from '@/data/catalog';
import { formatCredits } from '@/data/course';
import { colors } from '@/theme';

export default function CourseDetailsScreen() {
  const { termCode, courseCode } = useLocalSearchParams<{
    termCode: string;
    courseCode: string;
  }>();
  const course = getCourse(termCode, courseCode);

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
        <Text style={styles.code}>{course.code}</Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.metadata}>{course.termName} · {course.department}</Text>
        <Text style={styles.metadata}>{formatCredits(course)} · {course.careerType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.body}>{course.description || 'No description supplied.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prerequisites</Text>
        <Text style={styles.body}>{course.prerequisite || 'No listed prerequisites.'}</Text>
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
  code: { color: colors.accent, fontSize: 27, fontWeight: '700' },
  title: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: '700' },
  metadata: { color: colors.secondaryText, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  section: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  sectionTitle: { color: colors.accent, fontSize: 19, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  link: { color: colors.accent, fontSize: 15, fontWeight: '700', marginTop: 12 },
});
