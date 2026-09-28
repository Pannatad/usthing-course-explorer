import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OptionPicker } from '@/components/OptionPicker';
import { SearchField } from '@/components/SearchField';
import { compactCourseCode, defaultTerm, getCourseDetails, getCourseSummary, searchCourses, terms } from '@/data/catalog';
import { courseKey, formatCredits, type Course } from '@/data/course';
import { colors } from '@/theme';

const termOptions = terms.map(term => ({ value: term.code, label: term.name }));
type Slot = 0 | 1;

/** Only the two selected records load long details; the chooser searches summaries. */
export function CourseComparison({ initialTerm, initialCourse }: { initialTerm?: string; initialCourse?: string }) {
  const [termCode, setTermCode] = useState(() => terms.some(term => term.code === initialTerm) ? initialTerm! : defaultTerm.code);
  const [codes, setCodes] = useState<[string | undefined, string | undefined]>(() => [
    typeof initialCourse === 'string' && getCourseSummary(termCode, initialCourse) ? compactCourseCode(initialCourse) : undefined,
    undefined,
  ]);
  const [choosing, setChoosing] = useState<Slot | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const courses = useMemo(() => codes.map(code => code ? getCourseDetails(termCode, code) : undefined), [codes, termCode]);
  const results = useMemo(() => searchCourses({ termCode, department: 'All', query }), [termCode, query]);
  const termName = terms.find(term => term.code === termCode)!.name;

  function choose(slot: Slot) { setQuery(''); setChoosing(slot); }
  function update(slot: Slot, code?: string) {
    setCodes(previous => slot === 0 ? [code, previous[1]] : [previous[0], code]);
    setNotice('');
  }
  function changeTerm(next: string) {
    const available = codes.map(code => code && getCourseSummary(next, code) ? code : undefined) as typeof codes;
    setNotice(codes.some((code, index) => code && !available[index]) ? 'A selected course is not listed in this semester. Choose a replacement.' : '');
    setCodes(available);
    setTermCode(next);
  }

  if (choosing !== null) {
    const otherCode = codes[choosing === 0 ? 1 : 0];
    return <View style={styles.screen}>
      <View style={styles.chooserHeader}>
        <Action label="Back to comparison" onPress={() => { Keyboard.dismiss(); setChoosing(null); }} />
        <Text accessibilityRole="header" style={styles.heading}>Choose course {choosing === 0 ? 'A' : 'B'}</Text>
        <Text style={styles.muted}>{termName} · Search by code or title</Text>
        <SearchField value={query} onChangeText={setQuery} />
      </View>
      <FlatList data={results} keyExtractor={courseKey} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={styles.chooserList}
        ListEmptyComponent={<Text style={styles.body}>No courses match. Try another code or title.</Text>}
        renderItem={({ item }) => {
          const code = compactCourseCode(item.code);
          const duplicate = code === otherCode;
          return <Pressable accessibilityRole="button" accessibilityLabel={`Select ${item.code}, ${item.title}`}
            accessibilityState={{ disabled: duplicate, selected: code === codes[choosing] }} disabled={duplicate}
            onPress={() => { update(choosing, code); Keyboard.dismiss(); setChoosing(null); }}
            style={({ pressed }) => [styles.result, pressed && styles.pressed, duplicate && styles.unavailable]}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.body}>{item.title}</Text>
            <Text style={styles.muted}>{duplicate ? 'Already selected for the other course' : formatCredits(item)}</Text>
          </Pressable>;
        }} />
    </View>;
  }

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <OptionPicker label="Comparison semester" value={termCode} options={termOptions} onChange={changeTerm} />
    {!!notice && <Text accessibilityLiveRegion="polite" style={styles.muted}>{notice}</Text>}
    <View style={styles.slots}>
      {([0, 1] as const).map(slot => {
        const course = courses[slot];
        const name = slot === 0 ? 'A' : 'B';
        if (!course) return <Pressable key={slot} accessibilityRole="button" accessibilityLabel={`Choose course ${name}`}
          onPress={() => choose(slot)} style={({ pressed }) => [styles.slot, styles.emptySlot, pressed && styles.pressed]}>
          <Text style={styles.emptySlotLabel}>Course {name}</Text>
        </Pressable>;
        return <View key={slot} style={styles.slot}>
          <Text style={styles.muted}>Course {name}</Text>
            <Text style={styles.code}>{course.code}</Text>
            <Text style={styles.body}>{course.title}</Text>
            <View style={styles.actions}>
              <Action label="Change" accessibilityLabel={`Change course ${name}`} onPress={() => choose(slot)} />
              <Action label="Remove" accessibilityLabel={`Remove course ${name}`} onPress={() => update(slot)} />
            </View>
        </View>;
      })}
    </View>
    {courses[0] && courses[1] ? <ComparisonDetails key={`${termCode}:${codes.join(':')}`} courses={[courses[0], courses[1]]} />
      : <Text style={styles.empty}>Choose {courses.some(Boolean) ? 'one more course' : 'two courses'} to compare credits, level, and prerequisites.</Text>}
  </ScrollView>;
}

function Action({ label, accessibilityLabel = label, onPress }: { label: string; accessibilityLabel?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
    style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

function ComparisonDetails({ courses }: { courses: [Course, Course] }) {
  const [fullPrerequisites, setFullPrerequisites] = useState(false);
  const [descriptions, setDescriptions] = useState(false);
  const [requirements, setRequirements] = useState(false);
  return <View>
    <Field title="Credits" courses={courses} value={formatCredits} compact />
    <Field title="Level" courses={courses} value={course => course.careerType === 'UG' ? 'Undergraduate' : course.careerType === 'PG' ? 'Postgraduate' : course.careerType} compact />
    <Field title="Prerequisites" courses={courses} value={course => course.prerequisite || 'No listed prerequisites.'} lines={fullPrerequisites ? undefined : 3} />
    {courses.some(course => !!course.prerequisite) && <Toggle label="Full prerequisite wording" expanded={fullPrerequisites} onPress={() => setFullPrerequisites(value => !value)} />}
    <Toggle label="Descriptions" expanded={descriptions} onPress={() => setDescriptions(value => !value)} />
    {descriptions && <Field title="Descriptions" courses={courses} value={course => course.description || 'No description supplied.'} />}
    <Toggle label="Corequisites and exclusions" expanded={requirements} onPress={() => setRequirements(value => !value)} />
    {requirements && <>
      <Field title="Corequisites" courses={courses} value={course => course.corequisite || 'None listed.'} />
      <Field title="Exclusions" courses={courses} value={course => course.exclusion || 'None listed.'} />
    </>}
    <View style={styles.detailLinks}>
      {courses.map(course => <Link key={course.code} href={{ pathname: '/course/[termCode]/[courseCode]', params: { termCode: course.termCode, courseCode: compactCourseCode(course.code) } }} asChild>
        <Pressable accessibilityRole="link" style={styles.action}><Text style={styles.actionText}>Open {course.code} details →</Text></Pressable>
      </Link>)}
    </View>
  </View>;
}

function Toggle({ label, expanded, onPress }: { label: string; expanded: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onPress}
    style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
    <Text style={styles.actionText}>{expanded ? 'Hide' : 'Show'} {label.toLowerCase()}</Text>
    <Text accessible={false} style={styles.actionText}>{expanded ? '−' : '+'}</Text>
  </Pressable>;
}

function Field({ title, courses, value, compact = false, lines }: { title: string; courses: [Course, Course]; value: (course: Course) => string; compact?: boolean; lines?: number }) {
  return <View style={styles.field}>
    <Text accessibilityRole="header" style={styles.fieldTitle}>{title}</Text>
    <View style={compact ? styles.compactValues : styles.values}>
      {courses.map(course => <View key={course.code} style={styles.value}>
        <Text style={styles.valueLabel}>{course.code}</Text>
        <Text style={styles.body} numberOfLines={lines}>{value(course)}</Text>
      </View>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, paddingBottom: 48, gap: 20 },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slot: { flex: 1, minWidth: 135, backgroundColor: colors.courseSurface, borderRadius: 12, padding: 16, gap: 6 },
  emptySlot: { minHeight: 112, justifyContent: 'center', alignItems: 'center' },
  emptySlotLabel: { color: colors.accent, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  code: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  actionText: { color: colors.accent, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  pressed: { opacity: 0.65 },
  empty: { color: colors.secondaryText, fontSize: 16, lineHeight: 24, paddingVertical: 12 },
  field: { borderTopWidth: 1, borderColor: colors.border, paddingVertical: 18, gap: 12 },
  fieldTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  compactValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  values: { gap: 16 },
  value: { flex: 1, minWidth: 135, gap: 4 },
  valueLabel: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, gap: 16, borderTopWidth: 1, borderColor: colors.border, paddingVertical: 12 },
  detailLinks: { marginTop: 16 },
  chooserHeader: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chooserList: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 32 },
  result: { paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border, gap: 4 },
  unavailable: { backgroundColor: colors.searchSurface },
});
