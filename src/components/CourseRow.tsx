import { Link } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCredits, type CourseSummary } from '@/data/course';
import { compactCourseCode } from '@/data/catalog';
import { colors } from '@/theme';

type CourseRowProps = {
  course: CourseSummary;
};

export function CourseRow({ course }: CourseRowProps) {
  return (
    <Link
      href={{
        pathname: '/course/[termCode]/[courseCode]',
        params: {
          termCode: course.termCode,
          courseCode: compactCourseCode(course.code),
        },
      }}
      asChild>
      <Pressable onPress={() => Keyboard.dismiss()} accessibilityRole="button" accessibilityLabel={`Open ${course.code}, ${course.title}`}>
        {({ pressed }) => (
          <View style={[styles.card, pressed && styles.pressed]}>
            <View style={styles.information}>
              <View style={styles.heading}>
                <Text style={styles.code}>{course.code}</Text>
                <Text style={styles.credits}>{formatCredits(course)}</Text>
              </View>
              <Text style={styles.title}>{course.title}</Text>
            </View>
            <Text style={styles.chevron} accessibilityElementsHidden>›</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.courseSurface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    backgroundColor: colors.pressedSurface,
  },
  information: { flex: 1, gap: 8 },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  code: {
    color: colors.accent,
    fontSize: 21,
    fontWeight: '700',
  },
  credits: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  chevron: { color: colors.accent, fontSize: 29, lineHeight: 30, fontWeight: '400' },
});
