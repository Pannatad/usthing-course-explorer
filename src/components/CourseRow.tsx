import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCredits, type Course } from '@/data/course';
import { compactCourseCode } from '@/data/catalog';
import { colors } from '@/theme';

type CourseRowProps = {
  course: Course;
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
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${course.code}, ${course.title}`}>
        {({ pressed }) => (
          <View style={[styles.card, pressed && styles.pressed]}>
            <View style={styles.heading}>
              <Text style={styles.code}>{course.code}</Text>
              <Text style={styles.credits}>{formatCredits(course)}</Text>
            </View>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.detail}>View course details →</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  pressed: {
    opacity: 0.72,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  code: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  credits: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  detail: {
    color: colors.secondaryText,
    fontSize: 13,
  },
});
