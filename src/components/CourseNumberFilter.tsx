import { colors } from '@/theme';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OptionPicker } from './OptionPicker';

type Props = { subject: string; subjects: string[]; number: string; onSubjectChange: (value: string) => void; onNumberChange: (value: string) => void };
export function CourseNumberFilter({ subject, subjects, number, onSubjectChange, onNumberChange }: Props) {
  const invalid = !!number && (!/^\d+$/.test(number) || !Number.isSafeInteger(Number(number)));
  return <View style={styles.group}>
    <View style={styles.row}>
      <OptionPicker label="Subject" value={subject} options={[{ value: 'All', label: 'All subjects' }, ...subjects.map(value => ({ value, label: value }))]} onChange={onSubjectChange} />
      <View style={styles.number}>
        <Text style={styles.label}>Course number</Text>
        <View style={styles.numberInput}>
          <View style={styles.numberPrefix} accessibilityElementsHidden>
            <Text style={styles.numberPrefixText}>#</Text>
          </View>
          <TextInput accessibilityLabel="Course number" inputMode="numeric" placeholder="e.g. 2000" placeholderTextColor={colors.secondaryText} value={number} onChangeText={onNumberChange} style={styles.input} />
        </View>
      </View>
    </View>
    {invalid && <Text accessibilityRole="alert" style={styles.hint}>Enter a whole number, such as 2000.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: 6 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  number: { flex: 1, minWidth: 140, gap: 7 }, label: { color: colors.secondaryText, fontSize: 14, fontWeight: '600' },
  numberInput: { minHeight: 48, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.accent, borderRadius: 9, backgroundColor: colors.surface },
  numberPrefix: { minHeight: 46, minWidth: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.courseSurface, borderRightWidth: 1, borderRightColor: colors.border },
  numberPrefixText: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  input: { minHeight: 46, flex: 1, paddingHorizontal: 12, color: colors.text, fontSize: 14 },
  hint: { color: colors.secondaryText, fontSize: 13 },
});
