import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OptionPicker } from '@/components/OptionPicker';
import {
  compactCourseCode,
  defaultTerm,
  getCourseDetails,
  getCourseSummary,
  terms,
} from '@/data/catalog';
import type { Course } from '@/data/course';
import { colors } from '@/theme';

import { ComparisonAction, comparisonStyles as shared } from './ComparisonAction';
import { ComparisonDetails } from './ComparisonDetails';
import { CourseChooser } from './CourseChooser';

const termOptions = terms.map((term) => ({ value: term.code, label: term.name }));
const slotNames = ['A', 'B'] as const;
type Slot = 0 | 1;
type SelectedCodes = [string | undefined, string | undefined];

function initialTermCode(initialTerm?: string) {
  return terms.some((term) => term.code === initialTerm) ? initialTerm! : defaultTerm.code;
}

/**
 * Coordinates the two selected courses. Only the two selected records load long details;
 * the chooser searches summaries.
 */
export function CourseComparison({
  initialTerm,
  initialCourse,
}: {
  initialTerm?: string;
  initialCourse?: string;
}) {
  const [termCode, setTermCode] = useState(() => initialTermCode(initialTerm));
  const [codes, setCodes] = useState<SelectedCodes>(() => {
    const preselected =
      typeof initialCourse === 'string' && getCourseSummary(termCode, initialCourse)
        ? compactCourseCode(initialCourse)
        : undefined;
    return [preselected, undefined];
  });
  const [choosing, setChoosing] = useState<Slot | null>(null);
  const [notice, setNotice] = useState('');
  const courses = useMemo(
    () => codes.map((code) => (code ? getCourseDetails(termCode, code) : undefined)),
    [codes, termCode],
  );
  const termName = terms.find((term) => term.code === termCode)!.name;

  function update(slot: Slot, code?: string) {
    setCodes((previous) => (slot === 0 ? [code, previous[1]] : [previous[0], code]));
    setNotice('');
  }

  /** Keeps selections the new semester offers and explains any that were cleared. */
  function changeTerm(next: string) {
    const available = codes.map((code) =>
      code && getCourseSummary(next, code) ? code : undefined,
    ) as SelectedCodes;
    const cleared = codes.some((code, index) => code && !available[index]);
    setNotice(
      cleared ? 'A selected course is not listed in this semester. Choose a replacement.' : '',
    );
    setCodes(available);
    setTermCode(next);
  }

  if (choosing !== null) {
    return (
      <CourseChooser
        slotName={slotNames[choosing]}
        termCode={termCode}
        termName={termName}
        selectedCode={codes[choosing]}
        otherCode={codes[choosing === 0 ? 1 : 0]}
        onSelect={(code) => {
          update(choosing, code);
          setChoosing(null);
        }}
        onCancel={() => setChoosing(null)}
      />
    );
  }

  const [first, second] = courses;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <OptionPicker
        label="Comparison semester"
        value={termCode}
        options={termOptions}
        onChange={changeTerm}
      />
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={shared.muted}>
          {notice}
        </Text>
      )}
      <View style={styles.slots}>
        {([0, 1] as const).map((slot) => (
          <CourseSlot
            key={slot}
            name={slotNames[slot]}
            course={courses[slot]}
            onChoose={() => setChoosing(slot)}
            onRemove={() => update(slot)}
          />
        ))}
      </View>
      {first && second ? (
        <ComparisonDetails key={`${termCode}:${codes.join(':')}`} courses={[first, second]} />
      ) : (
        <Text style={styles.empty}>
          Choose {first || second ? 'one more course' : 'two courses'} to compare credits, level,
          and prerequisites.
        </Text>
      )}
    </ScrollView>
  );
}

function CourseSlot({
  name,
  course,
  onChoose,
  onRemove,
}: {
  name: string;
  course?: Course;
  onChoose: () => void;
  onRemove: () => void;
}) {
  if (!course) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose course ${name}`}
        onPress={onChoose}
        style={({ pressed }) => [styles.slot, styles.emptySlot, pressed && shared.pressed]}>
        <Text style={styles.emptySlotLabel}>Course {name}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.slot}>
      <Text style={shared.muted}>Course {name}</Text>
      <Text style={shared.code}>{course.code}</Text>
      <Text style={shared.body}>{course.title}</Text>
      <View style={styles.actions}>
        <ComparisonAction
          label="Change"
          accessibilityLabel={`Change course ${name}`}
          onPress={onChoose}
        />
        <ComparisonAction
          label="Remove"
          accessibilityLabel={`Remove course ${name}`}
          onPress={onRemove}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 48,
    gap: 20,
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slot: {
    flex: 1,
    minWidth: 135,
    backgroundColor: colors.courseSurface,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  emptySlot: { minHeight: 112, justifyContent: 'center', alignItems: 'center' },
  emptySlotLabel: { color: colors.accent, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: { color: colors.secondaryText, fontSize: 16, lineHeight: 24, paddingVertical: 12 },
});
