import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CourseNumberFilter } from '@/components/CourseNumberFilter';
import { CreditFilter } from '@/components/CreditFilter';
import { OptionPicker } from '@/components/OptionPicker';
import { colors } from '@/theme';

import type { CatalogFiltersState } from './useCatalogFilters';

type Props = {
  filters: Pick<
    CatalogFiltersState,
    | 'termOptions'
    | 'departmentOptions'
    | 'subjects'
    | 'creditValues'
    | 'termCode'
    | 'department'
    | 'subject'
    | 'number'
    | 'creditValue'
    | 'creditComparison'
    | 'activeFilters'
    | 'hasAdditionalFilters'
    | 'changeTerm'
    | 'changeDepartment'
    | 'setSubject'
    | 'setNumber'
    | 'setCreditValue'
    | 'setCreditComparison'
    | 'clearAdditionalFilters'
  >;
  expanded: boolean;
  onToggleExpanded: () => void;
};

/**
 * Controlled filter inputs. Returns sibling elements so the parent header's spacing applies
 * to each row exactly as before.
 */
export function CatalogFilters({ filters, expanded, onToggleExpanded }: Props) {
  return (
    <>
      <View style={styles.filters}>
        <OptionPicker
          label="Semester"
          value={filters.termCode}
          options={filters.termOptions}
          onChange={filters.changeTerm}
        />
        <OptionPicker
          label="Department"
          value={filters.department}
          options={filters.departmentOptions}
          onChange={filters.changeDepartment}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide additional filters' : 'Show additional filters'}
        accessibilityState={{ expanded }}
        onPress={onToggleExpanded}
        style={styles.moreFilters}>
        <View style={styles.moreFiltersText}>
          <Text style={styles.moreFiltersTitle}>More filters</Text>
          {!!filters.activeFilters.length && (
            <Text style={styles.activeFilters}>{filters.activeFilters.join(' · ')}</Text>
          )}
        </View>
        <Text style={styles.moreFiltersChevron} accessibilityElementsHidden>
          {expanded ? '⌃' : '⌄'}
        </Text>
      </Pressable>
      {expanded && (
        <View style={styles.additionalFilters}>
          <CourseNumberFilter
            subject={filters.subject}
            subjects={filters.subjects}
            number={filters.number}
            onSubjectChange={filters.setSubject}
            onNumberChange={filters.setNumber}
          />
          <CreditFilter
            comparison={filters.creditComparison}
            value={filters.creditValue}
            values={filters.creditValues}
            onComparisonChange={filters.setCreditComparison}
            onValueChange={filters.setCreditValue}
          />
          {filters.hasAdditionalFilters && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all additional filters"
              onPress={filters.clearAdditionalFilters}
              style={styles.clearAdditionalFilters}>
              <Text style={styles.clearAdditionalFiltersText}>Clear all filters</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moreFilters: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.searchSurface,
    paddingHorizontal: 16,
    gap: 12,
  },
  moreFiltersText: { flex: 1, paddingVertical: 8, gap: 2 },
  moreFiltersTitle: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  activeFilters: { color: colors.secondaryText, fontSize: 13, lineHeight: 18 },
  moreFiltersChevron: { color: colors.accent, fontSize: 22 },
  additionalFilters: { gap: 18 },
  clearAdditionalFilters: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  clearAdditionalFiltersText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
