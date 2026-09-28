import { Link } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCredits, type CourseSummary } from '@/data/course';
import { compactCourseCode } from '@/data/catalog';
import { CourseLevelBadge } from './CourseLevelBadge';
import { useFavorites } from '@/features/favorites/FavoritesProvider';
import { colors } from '@/theme';

type CourseRowProps = {
  course: CourseSummary;
};

export function CourseRow({ course }: CourseRowProps) {
  const postgraduate = course.careerType === 'PG';
  const { codes: favorites } = useFavorites();
  const isFavorite = favorites.has(compactCourseCode(course.code));
  return (
    <View style={[styles.card, postgraduate && styles.postgraduateCard]}>
    <Link
      href={{
        pathname: '/course/[termCode]/[courseCode]',
        params: {
          termCode: course.termCode,
          courseCode: compactCourseCode(course.code),
        },
      }}
      asChild>
      <Pressable style={styles.courseLink} onPress={() => Keyboard.dismiss()} accessibilityRole="button" accessibilityLabel={`Open ${course.code}, ${course.title}`}>
        {({ pressed }) => (
          <View style={[styles.linkContent, pressed && (postgraduate ? styles.postgraduatePressed : styles.pressed)]}>
            {isFavorite && <Text style={styles.favoriteMark} accessibilityLabel="Favorite course">♥</Text>}
            <View style={styles.information}>
              <View style={styles.heading}>
                <View style={styles.identity}><Text style={[styles.code, postgraduate && styles.postgraduateText]}>{course.code}</Text><CourseLevelBadge careerType={course.careerType} /></View>
                <Text style={styles.credits}>{formatCredits(course)}</Text>
              </View>
              <Text style={styles.title}>{course.title}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.courseSurface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  courseLink: { width: '100%' },
  linkContent: { paddingHorizontal: 20, paddingVertical: 18, gap: 6 },
  favoriteMark: { color: colors.favorite, fontSize: 21, lineHeight: 24, alignSelf: 'flex-start' },
  pressed: {
    backgroundColor: colors.pressedSurface,
  },
  postgraduateCard: { backgroundColor: colors.postgraduateSurface },
  postgraduatePressed: { backgroundColor: colors.postgraduatePressedSurface },
  postgraduateText: { color: colors.postgraduateAccent },
  information: { flex: 1, gap: 8 },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
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
});
