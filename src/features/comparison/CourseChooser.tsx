import { useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchField } from '@/components/SearchField';
import { compactCourseCode, searchCourses } from '@/data/catalog';
import { courseKey, formatCredits } from '@/data/course';
import { colors } from '@/theme';

import { ComparisonAction, comparisonStyles as shared } from './ComparisonAction';

type Props = {
  slotName: 'A' | 'B';
  termCode: string;
  termName: string;
  /** The course already in this slot, marked as selected. */
  selectedCode?: string;
  /** The course in the other slot, which cannot be chosen twice. */
  otherCode?: string;
  onSelect: (code: string) => void;
  onCancel: () => void;
};

/**
 * Searches summaries only; details load after a course is chosen. The query starts empty
 * each time the chooser opens because the chooser unmounts when it closes.
 */
export function CourseChooser({
  slotName,
  termCode,
  termName,
  selectedCode,
  otherCode,
  onSelect,
  onCancel,
}: Props) {
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => searchCourses({ termCode, department: 'All', query }),
    [termCode, query],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <ComparisonAction
          label="Back to comparison"
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
        />
        <Text accessibilityRole="header" style={styles.heading}>
          Choose course {slotName}
        </Text>
        <Text style={shared.muted}>{termName} · Search by code or title</Text>
        <SearchField value={query} onChangeText={setQuery} />
      </View>
      <FlatList
        data={results}
        keyExtractor={courseKey}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={shared.body}>No courses match. Try another code or title.</Text>
        }
        renderItem={({ item }) => {
          const code = compactCourseCode(item.code);
          const duplicate = code === otherCode;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.code}, ${item.title}`}
              accessibilityState={{ disabled: duplicate, selected: code === selectedCode }}
              disabled={duplicate}
              onPress={() => {
                Keyboard.dismiss();
                onSelect(code);
              }}
              style={({ pressed }) => [
                styles.result,
                pressed && shared.pressed,
                duplicate && styles.unavailable,
              ]}>
              <Text style={shared.code}>{item.code}</Text>
              <Text style={shared.body}>{item.title}</Text>
              <Text style={shared.muted}>
                {duplicate ? 'Already selected for the other course' : formatCredits(item)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  header: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  list: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  result: { paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border, gap: 4 },
  unavailable: { backgroundColor: colors.searchSurface },
});
