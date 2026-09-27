import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme';

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function OptionPicker({ label, value, options, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const matchingOptions = options.filter((option) => option.label.toUpperCase().includes(query.trim().toUpperCase()));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? value}`}
        onPress={() => { setQuery(''); setVisible(true); }}
        style={styles.trigger}>
        <Text style={styles.triggerText} numberOfLines={1}>{selected?.label ?? value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={styles.heading}>
              <Text style={styles.headingText}>Choose {label.toLowerCase()}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close options" onPress={() => setVisible(false)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>
            {options.length > 10 && (
              <TextInput
                accessibilityLabel={`Find ${label.toLowerCase()}`}
                placeholder={`Find ${label.toLowerCase()}`}
                placeholderTextColor={colors.secondaryText}
                value={query}
                onChangeText={setQuery}
                style={styles.search}
              />
            )}
            <FlatList
              data={matchingOptions}
              keyExtractor={(option) => option.value}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.value === value }}
                  onPress={() => { onChange(item.value); setVisible(false); }}
                  style={[styles.option, item.value === value && styles.activeOption]}>
                  <Text style={[styles.optionText, item.value === value && styles.activeText]}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minWidth: 140, gap: 7 },
  label: { color: colors.secondaryText, fontSize: 14, fontWeight: '600' },
  trigger: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderWidth: 1, borderColor: colors.accent, borderRadius: 9, backgroundColor: colors.surface, paddingHorizontal: 12 },
  triggerText: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  chevron: { color: colors.accent, fontSize: 22 },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: '#102F58A8', padding: 20 },
  dialog: { backgroundColor: colors.surface, borderRadius: 16, alignSelf: 'center', width: '100%', maxWidth: 500, maxHeight: '75%', padding: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  headingText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  close: { color: colors.accent, fontSize: 15, fontWeight: '600', padding: 8 },
  search: { minHeight: 44, borderColor: colors.border, borderWidth: 1, borderRadius: 8, color: colors.text, paddingHorizontal: 12, marginBottom: 8 },
  option: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8 },
  activeOption: { backgroundColor: colors.courseSurface },
  optionText: { color: colors.text, fontSize: 15 },
  activeText: { color: colors.accent, fontWeight: '700' },
});
