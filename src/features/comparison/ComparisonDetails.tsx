import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { compactCourseCode } from '@/data/catalog';
import { formatCredits, type Course } from '@/data/course';
import { colors } from '@/theme';

import { comparisonStyles as shared } from './ComparisonAction';

type Pair = [Course, Course];

function formatLevel(course: Course) {
  if (course.careerType === 'UG') {
    return 'Undergraduate';
  }
  if (course.careerType === 'PG') {
    return 'Postgraduate';
  }
  return course.careerType;
}

/**
 * Side-by-side fields for two loaded courses. Owns only which sections are expanded; the
 * parent remounts it with a new key when either course or the semester changes.
 */
export function ComparisonDetails({ courses }: { courses: Pair }) {
  const [fullPrerequisites, setFullPrerequisites] = useState(false);
  const [descriptions, setDescriptions] = useState(false);
  const [requirements, setRequirements] = useState(false);

  return (
    <View>
      <Field title="Credits" courses={courses} value={formatCredits} compact />
      <Field title="Level" courses={courses} value={formatLevel} compact />
      <Field
        title="Prerequisites"
        courses={courses}
        value={(course) => course.prerequisite || 'No listed prerequisites.'}
        lines={fullPrerequisites ? undefined : 3}
      />
      {courses.some((course) => !!course.prerequisite) && (
        <Toggle
          label="Full prerequisite wording"
          expanded={fullPrerequisites}
          onPress={() => setFullPrerequisites((value) => !value)}
        />
      )}
      <Toggle
        label="Descriptions"
        expanded={descriptions}
        onPress={() => setDescriptions((value) => !value)}
      />
      {descriptions && (
        <Field
          title="Descriptions"
          courses={courses}
          value={(course) => course.description || 'No description supplied.'}
        />
      )}
      <Toggle
        label="Corequisites and exclusions"
        expanded={requirements}
        onPress={() => setRequirements((value) => !value)}
      />
      {requirements && (
        <>
          <Field
            title="Corequisites"
            courses={courses}
            value={(course) => course.corequisite || 'None listed.'}
          />
          <Field
            title="Exclusions"
            courses={courses}
            value={(course) => course.exclusion || 'None listed.'}
          />
        </>
      )}
      <View style={styles.detailLinks}>
        {courses.map((course) => (
          <Link
            key={course.code}
            href={{
              pathname: '/course/[termCode]/[courseCode]',
              params: { termCode: course.termCode, courseCode: compactCourseCode(course.code) },
            }}
            asChild>
            <Pressable accessibilityRole="link" style={shared.action}>
              <Text style={shared.actionText}>Open {course.code} details →</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

function Toggle({
  label,
  expanded,
  onPress,
}: {
  label: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.toggle, pressed && shared.pressed]}>
      <Text style={shared.actionText}>
        {expanded ? 'Hide' : 'Show'} {label.toLowerCase()}
      </Text>
      <Text accessible={false} style={shared.actionText}>
        {expanded ? '−' : '+'}
      </Text>
    </Pressable>
  );
}

function Field({
  title,
  courses,
  value,
  compact = false,
  lines,
}: {
  title: string;
  courses: Pair;
  value: (course: Course) => string;
  /** Short values sit side by side; long text stacks. */
  compact?: boolean;
  lines?: number;
}) {
  return (
    <View style={styles.field}>
      <Text accessibilityRole="header" style={styles.fieldTitle}>
        {title}
      </Text>
      <View style={compact ? styles.compactValues : styles.values}>
        {courses.map((course) => (
          <View key={course.code} style={styles.value}>
            <Text style={styles.valueLabel}>{course.code}</Text>
            <Text style={shared.body} numberOfLines={lines}>
              {value(course)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { borderTopWidth: 1, borderColor: colors.border, paddingVertical: 18, gap: 12 },
  fieldTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  compactValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  values: { gap: 16 },
  value: { flex: 1, minWidth: 135, gap: 4 },
  valueLabel: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    gap: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  detailLinks: { marginTop: 16 },
});
