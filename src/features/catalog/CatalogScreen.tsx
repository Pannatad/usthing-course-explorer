import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CourseRow } from '@/components/CourseRow';
import { courseKey } from '@/data/course';
import { useFavorites } from '@/features/favorites/FavoritesProvider';
import { colors } from '@/theme';

import { CatalogFilters } from './CatalogFilters';
import { CatalogHeader } from './CatalogHeader';
import { useCatalogFilters } from './useCatalogFilters';

/**
 * The catalogue stays mounted underneath pushed screens, so filter state here survives
 * opening a course and coming back.
 */
export function CatalogScreen() {
  const favorites = useFavorites();
  const filters = useCatalogFilters(favorites.codes);
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  const { results } = filters;

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={results}
      keyExtractor={courseKey}
      renderItem={({ item }) => <CourseRow course={item} />}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <CatalogHeader
          termCode={filters.termCode}
          termName={filters.term.name}
          resultCount={results.length}
          query={filters.query}
          onQueryChange={filters.setQuery}
          favoritesOnly={filters.favoritesOnly}
          favoritesReady={favorites.ready}
          favoritesError={favorites.error}
          onToggleFavoritesOnly={filters.toggleFavoritesOnly}>
          <CatalogFilters
            filters={filters}
            expanded={showAdditionalFilters}
            onToggleExpanded={() => setShowAdditionalFilters((shown) => !shown)}
          />
        </CatalogHeader>
      }
      ListEmptyComponent={
        <EmptyState noFavoritesYet={filters.favoritesOnly && favorites.codes.size === 0} />
      }
    />
  );
}

function EmptyState({ noFavoritesYet }: { noFavoritesYet: boolean }) {
  return (
    <Text style={styles.empty}>
      {noFavoritesYet
        ? 'No favorites yet. Open a course and tap its heart to save it here.'
        : 'No courses match these filters. Try changing the search, subject, number, or credits.'}
    </Text>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  empty: { color: colors.secondaryText, fontSize: 15, lineHeight: 23, paddingVertical: 24 },
  separator: { height: 12 },
});
