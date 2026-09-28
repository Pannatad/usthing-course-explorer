import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { CourseNumberFilter } from '@/components/CourseNumberFilter';
import { CourseRow } from '@/components/CourseRow';
import { CreditFilter } from '@/components/CreditFilter';
import { OptionPicker } from '@/components/OptionPicker';
import { SearchField } from '@/components/SearchField';
import { compactCourseCode, defaultTerm, getCourseSummaries, searchCourses, terms } from '@/data/catalog';
import { courseKey } from '@/data/course';
import { parseCourseCode, type CreditFilter as CreditCondition } from '@/data/search';
import { useFavorites } from '@/features/favorites/FavoritesProvider';
import { colors } from '@/theme';

const termOptions = terms.map((term) => ({ value: term.code, label: term.name }));

export default function HomeScreen() {
  const [termCode, setTermCode] = useState(defaultTerm.code);
  const [department, setDepartment] = useState('All');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All');
  const [number, setNumber] = useState('');
  const [creditValue, setCreditValue] = useState('');
  const [creditComparison, setCreditComparison] = useState<CreditCondition['comparison']>('exact');
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { codes: favoriteCodes, ready: favoritesReady, error: favoritesError } = useFavorites();
  const term = terms.find((item) => item.code === termCode) ?? defaultTerm;
  const departmentOptions = useMemo(() => [
    { value: 'All', label: 'All departments' },
    ...term.departments.map((value) => ({ value, label: value })),
  ], [term]);
  const subjects = useMemo(() => [...new Set(getCourseSummaries(termCode)
    .filter(course => department === 'All' || course.department === department)
    .map(course => parseCourseCode(course.code)?.subject)
    .filter((value): value is string => !!value))].sort(), [termCode, department]);
  const creditValues = useMemo(() => {
    const values = new Set<number>([0]);
    for (const course of getCourseSummaries(termCode)) {
      values.add(course.minCredits); values.add(course.maxCredits);
      for (let value = Math.ceil(course.minCredits); value <= course.maxCredits; value++) values.add(value);
    }
    if (creditValue) values.add(Number(creditValue));
    return [...values].sort((a, b) => a - b);
  }, [termCode, creditValue]);
  const validNumber = !number || (/^\d+$/.test(number) && Number.isSafeInteger(Number(number)));
  const creditSymbol = {
    exact: '=',
    greater: '>',
    lower: '<',
  }[creditComparison];
  const activeFilters = [
    subject !== 'All' ? subject : '',
    number ? (validNumber ? `number > ${number}` : 'invalid number') : '',
    creditValue ? `${creditSymbol} ${creditValue} credits` : '',
  ].filter(Boolean);
  const results = useMemo(() => validNumber ? searchCourses({ termCode, department, query, subject,
    numberAbove: number ? Number(number) : undefined,
    credits: creditValue ? { comparison: creditComparison, value: Number(creditValue) } : undefined,
  }).filter(course => !favoritesOnly || favoriteCodes.has(compactCourseCode(course.code))) : [], [termCode, department, query, subject, number, validNumber, creditValue, creditComparison, favoritesOnly, favoriteCodes]);

  function changeTerm(nextTermCode: string) {
    setTermCode(nextTermCode);
    const nextTerm = terms.find((item) => item.code === nextTermCode);
    const nextDepartment = nextTerm?.departments.includes(department) ? department : 'All';
    if (nextDepartment !== department) setDepartment(nextDepartment);
    if (!getCourseSummaries(nextTermCode).some(course =>
      (nextDepartment === 'All' || course.department === nextDepartment) && parseCourseCode(course.code)?.subject === subject
    )) setSubject('All');
  }

  function changeDepartment(nextDepartment: string) {
    setDepartment(nextDepartment);
    if (subject !== 'All' && !getCourseSummaries(termCode).some(course =>
      (nextDepartment === 'All' || course.department === nextDepartment) && parseCourseCode(course.code)?.subject === subject
    )) setSubject('All');
  }

  function clearAdditionalFilters() {
    setSubject('All');
    setNumber('');
    setCreditValue('');
    setCreditComparison('exact');
  }

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={results}
      keyExtractor={courseKey}
      renderItem={({ item }) => <CourseRow course={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.intro}>Explore courses and their prerequisites.</Text>
          <Link href={{ pathname: '/compare', params: { termCode } }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Compare two courses">
              {({ pressed }) => <View style={[styles.compareButton, pressed && styles.compareButtonPressed]}>
              <View style={styles.compareIcon} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View style={styles.compareColumn}><View style={styles.compareLine} /><View style={styles.compareLineShort} /></View>
                <View style={styles.compareColumn}><View style={styles.compareLine} /><View style={styles.compareLineShort} /></View>
              </View>
              <View style={styles.compareCopy}>
                <Text style={styles.compareTitle}>Compare two courses</Text>
                <Text style={styles.compareSubtitle}>See the differences at a glance</Text>
              </View>
              <Text style={styles.compareArrow} accessible={false} accessibilityElementsHidden>→</Text>
              </View>}
            </Pressable>
          </Link>
          <SearchField value={query} onChangeText={setQuery} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show favorite courses only"
            accessibilityState={{ selected: favoritesOnly, disabled: !favoritesReady }}
            disabled={!favoritesReady}
            onPress={() => setFavoritesOnly(value => !value)}
            style={[styles.favoritesFilter, favoritesOnly && styles.favoritesFilterActive]}>
            <Text style={[styles.favoritesFilterText, favoritesOnly && styles.favoritesFilterTextActive]}>{favoritesOnly ? '♥ Favorites' : '♡ Favorites'}</Text>
          </Pressable>
          {favoritesError && <Text style={styles.storageError}>Favorites could not be saved on this device.</Text>}
          <View style={styles.filters}>
            <OptionPicker label="Semester" value={termCode} options={termOptions} onChange={changeTerm} />
            <OptionPicker label="Department" value={department} options={departmentOptions} onChange={changeDepartment} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showAdditionalFilters ? 'Hide additional filters' : 'Show additional filters'}
            accessibilityState={{ expanded: showAdditionalFilters }}
            onPress={() => setShowAdditionalFilters((shown) => !shown)}
            style={styles.moreFilters}>
            <View style={styles.moreFiltersText}>
              <Text style={styles.moreFiltersTitle}>More filters</Text>
              {!!activeFilters.length && <Text style={styles.activeFilters}>{activeFilters.join(' · ')}</Text>}
            </View>
            <Text style={styles.moreFiltersChevron} accessibilityElementsHidden>{showAdditionalFilters ? '⌃' : '⌄'}</Text>
          </Pressable>
          {showAdditionalFilters && <View style={styles.additionalFilters}>
            <CourseNumberFilter subject={subject} subjects={subjects} number={number} onSubjectChange={setSubject} onNumberChange={setNumber} />
            <CreditFilter comparison={creditComparison} value={creditValue} values={creditValues} onComparisonChange={setCreditComparison} onValueChange={setCreditValue} />
            {(subject !== 'All' || !!number || !!creditValue || creditComparison !== 'exact') && <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all additional filters"
              onPress={clearAdditionalFilters}
              style={styles.clearAdditionalFilters}>
              <Text style={styles.clearAdditionalFiltersText}>Clear all filters</Text>
            </Pressable>}
          </View>}
          <Text style={styles.count}>{results.length.toLocaleString()} {results.length === 1 ? 'course' : 'courses'} in {term.name}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{favoritesOnly && favoriteCodes.size === 0 ? 'No favorites yet. Open a course and tap its heart to save it here.' : 'No courses match these filters. Try changing the search, subject, number, or credits.'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  header: { gap: 18, marginBottom: 18 },
  intro: { color: colors.secondaryText, fontSize: 15, lineHeight: 22 },
  compareButton: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accent, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16 },
  compareButtonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  compareCopy: { flex: 1, gap: 4 },
  compareTitle: { color: colors.surface, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  compareSubtitle: { color: colors.courseSurface, fontSize: 12, lineHeight: 18 },
  compareIcon: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  compareColumn: { width: 15, height: 27, borderWidth: 1.5, borderColor: colors.surface, borderRadius: 3, paddingHorizontal: 3, paddingTop: 7, gap: 4 },
  compareLine: { height: 2, backgroundColor: colors.surface, borderRadius: 1 },
  compareLineShort: { height: 2, width: 4, backgroundColor: colors.surface, borderRadius: 1 },
  compareArrow: { color: colors.surface, fontSize: 23 },
  favoritesFilter: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 16 },
  favoritesFilterActive: { backgroundColor: colors.favorite, borderColor: colors.favorite },
  favoritesFilterText: { color: colors.favorite, fontSize: 15, fontWeight: '700' },
  favoritesFilterTextActive: { color: colors.surface },
  storageError: { color: colors.favorite, fontSize: 13 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moreFilters: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 12, backgroundColor: colors.searchSurface, paddingHorizontal: 16, gap: 12 },
  moreFiltersText: { flex: 1, paddingVertical: 8, gap: 2 },
  moreFiltersTitle: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  activeFilters: { color: colors.secondaryText, fontSize: 13, lineHeight: 18 },
  moreFiltersChevron: { color: colors.accent, fontSize: 22 },
  additionalFilters: { gap: 18 },
  clearAdditionalFilters: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  clearAdditionalFiltersText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  count: { color: colors.secondaryText, fontSize: 14, fontWeight: '600', marginTop: 2 },
  empty: { color: colors.secondaryText, fontSize: 15, lineHeight: 23, paddingVertical: 24 },
  separator: { height: 12 },
});

export { CatalogErrorBoundary as ErrorBoundary } from '@/components/CatalogErrorBoundary';
