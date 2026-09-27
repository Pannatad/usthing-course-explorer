import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CourseRow } from '@/components/CourseRow';
import { OptionPicker } from '@/components/OptionPicker';
import { SearchField } from '@/components/SearchField';
import { defaultTerm, getCoursesForTerm, terms } from '@/data/catalog';
import { courseKey } from '@/data/course';
import { filterCourses } from '@/data/search';
import { colors } from '@/theme';

const termOptions = terms.map((term) => ({ value: term.code, label: term.name }));

export default function HomeScreen() {
  const [termCode, setTermCode] = useState(defaultTerm.code);
  const [department, setDepartment] = useState('All');
  const [query, setQuery] = useState('');
  const term = terms.find((item) => item.code === termCode) ?? defaultTerm;
  const courses = getCoursesForTerm(termCode);
  const departmentOptions = useMemo(() => [
    { value: 'All', label: 'All departments' },
    ...term.departments.map((value) => ({ value, label: value })),
  ], [term]);
  const results = useMemo(() => filterCourses(courses, department, query), [courses, department, query]);

  function changeTerm(nextTermCode: string) {
    setTermCode(nextTermCode);
    const nextTerm = terms.find((item) => item.code === nextTermCode);
    if (!nextTerm?.departments.includes(department)) setDepartment('All');
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={results}
      keyExtractor={courseKey}
      renderItem={({ item }) => <CourseRow course={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.intro}>Explore Clear Water Bay courses and their prerequisites.</Text>
          <SearchField value={query} onChangeText={setQuery} />
          <View style={styles.filters}>
            <OptionPicker label="Semester" value={termCode} options={termOptions} onChange={changeTerm} />
            <OptionPicker label="Department" value={department} options={departmentOptions} onChange={setDepartment} />
          </View>
          <Text style={styles.count}>{results.length.toLocaleString()} {results.length === 1 ? 'course' : 'courses'} in {term.name}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No courses match these filters. Try another search or department.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  header: { gap: 18, marginBottom: 18 },
  intro: { color: colors.secondaryText, fontSize: 15, lineHeight: 22 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  count: { color: colors.secondaryText, fontSize: 14, fontWeight: '600', marginTop: 2 },
  empty: { color: colors.secondaryText, fontSize: 15, lineHeight: 23, paddingVertical: 24 },
  separator: { height: 12 },
});
