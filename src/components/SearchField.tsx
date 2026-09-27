import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
};

export function SearchField({ value, onChangeText }: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.icon} accessible={false}>
        <View style={styles.iconRing} />
        <View style={styles.iconHandle} />
      </View>
      <TextInput
        accessibilityLabel="Search by course code or title"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        placeholder="Search courses"
        placeholderTextColor={colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
      {!!value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          style={styles.clear}>
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 56, backgroundColor: colors.searchSurface, borderRadius: 12, paddingLeft: 18, paddingRight: 8 },
  icon: { width: 26, height: 26, marginRight: 10 },
  iconRing: { width: 17, height: 17, borderWidth: 2, borderColor: colors.accent, borderRadius: 10 },
  iconHandle: { position: 'absolute', width: 11, height: 2, backgroundColor: colors.accent, top: 18, left: 13, transform: [{ rotate: '45deg' }] },
  input: { flex: 1, minHeight: 52, color: colors.text, fontSize: 16 },
  clear: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.secondaryText, fontSize: 26, lineHeight: 28 },
});
