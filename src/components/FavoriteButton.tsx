import { Pressable, StyleSheet, Text } from 'react-native';

import { normalizeSearch } from '@/data/search';
import { useFavorites } from '@/features/favorites/FavoritesProvider';
import { colors } from '@/theme';

export function FavoriteButton({ code }: { code: string }) {
  const { codes, ready, toggle } = useFavorites();
  const saved = codes.has(normalizeSearch(code));
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${saved ? 'Remove' : 'Add'} ${code} ${saved ? 'from' : 'to'} favorites`}
    accessibilityState={{ disabled: !ready, selected: saved }}
    disabled={!ready}
    hitSlop={4}
    onPress={() => toggle(code)}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
    <Text style={[styles.heart, saved && styles.saved]} accessibilityElementsHidden>{saved ? '♥' : '♡'}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { backgroundColor: colors.searchSurface },
  heart: { color: colors.secondaryText, fontSize: 31, lineHeight: 38 },
  saved: { color: colors.favorite },
});
