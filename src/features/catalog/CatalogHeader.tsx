import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchField } from '@/components/SearchField';
import { colors } from '@/theme';

type Props = {
  termCode: string;
  termName: string;
  resultCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  favoritesOnly: boolean;
  favoritesReady: boolean;
  favoritesError: boolean;
  onToggleFavoritesOnly: () => void;
  /** Filter controls, rendered between the favorites control and the result count. */
  children: ReactNode;
};

export function CatalogHeader({
  termCode,
  termName,
  resultCount,
  query,
  onQueryChange,
  favoritesOnly,
  favoritesReady,
  favoritesError,
  onToggleFavoritesOnly,
  children,
}: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.intro}>Explore courses and their prerequisites.</Text>
      <CompareEntry termCode={termCode} />
      <SearchField value={query} onChangeText={onQueryChange} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show favorite courses only"
        accessibilityState={{ selected: favoritesOnly, disabled: !favoritesReady }}
        disabled={!favoritesReady}
        onPress={onToggleFavoritesOnly}
        style={[styles.favoritesFilter, favoritesOnly && styles.favoritesFilterActive]}>
        <Text style={[styles.favoritesFilterText, favoritesOnly && styles.favoritesFilterTextActive]}>
          {favoritesOnly ? '♥ Favorites' : '♡ Favorites'}
        </Text>
      </Pressable>
      {favoritesError && (
        <Text style={styles.storageError}>Favorites could not be saved on this device.</Text>
      )}
      {children}
      <Text style={styles.count}>
        {resultCount.toLocaleString()} {resultCount === 1 ? 'course' : 'courses'} in {termName}
      </Text>
    </View>
  );
}

/** Opens the comparison screen in the semester currently being browsed. */
function CompareEntry({ termCode }: { termCode: string }) {
  return (
    <Link href={{ pathname: '/compare', params: { termCode } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel="Compare two courses">
        {({ pressed }) => (
          <View style={[styles.compareButton, pressed && styles.compareButtonPressed]}>
            <View
              style={styles.compareIcon}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <View style={styles.compareColumn}>
                <View style={styles.compareLine} />
                <View style={styles.compareLineShort} />
              </View>
              <View style={styles.compareColumn}>
                <View style={styles.compareLine} />
                <View style={styles.compareLineShort} />
              </View>
            </View>
            <View style={styles.compareCopy}>
              <Text style={styles.compareTitle}>Compare two courses</Text>
              <Text style={styles.compareSubtitle}>See the differences at a glance</Text>
            </View>
            <Text style={styles.compareArrow} accessible={false} accessibilityElementsHidden>
              →
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: { gap: 18, marginBottom: 18 },
  intro: { color: colors.secondaryText, fontSize: 15, lineHeight: 22 },
  compareButton: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  compareButtonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  compareCopy: { flex: 1, gap: 4 },
  compareTitle: { color: colors.surface, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  compareSubtitle: { color: colors.courseSurface, fontSize: 12, lineHeight: 18 },
  compareIcon: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  compareColumn: {
    width: 15,
    height: 27,
    borderWidth: 1.5,
    borderColor: colors.surface,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingTop: 7,
    gap: 4,
  },
  compareLine: { height: 2, backgroundColor: colors.surface, borderRadius: 1 },
  compareLineShort: { height: 2, width: 4, backgroundColor: colors.surface, borderRadius: 1 },
  compareArrow: { color: colors.surface, fontSize: 23 },
  favoritesFilter: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  favoritesFilterActive: { backgroundColor: colors.favorite, borderColor: colors.favorite },
  favoritesFilterText: { color: colors.favorite, fontSize: 15, fontWeight: '700' },
  favoritesFilterTextActive: { color: colors.surface },
  storageError: { color: colors.favorite, fontSize: 13 },
  count: { color: colors.secondaryText, fontSize: 14, fontWeight: '600', marginTop: 2 },
});
