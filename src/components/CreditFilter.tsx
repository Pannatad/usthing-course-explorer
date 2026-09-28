import { StyleSheet, Text, View } from 'react-native';
import { OptionPicker } from './OptionPicker';
import type { CreditFilter as CreditCondition } from '@/data/search';
import { colors } from '@/theme';

type Props = { comparison: CreditCondition['comparison']; value: string; values: number[]; onComparisonChange: (value: CreditCondition['comparison']) => void; onValueChange: (value: string) => void };
export function CreditFilter({ comparison, value, values, onComparisonChange, onValueChange }: Props) {
  return <View style={styles.group}>
    <View style={styles.row}>
      <OptionPicker label="Credit comparison" value={comparison} options={[{ value: 'exact', label: 'Exactly' }, { value: 'greater', label: 'Greater than' }, {value: 'lower', label: 'Lower than'}]} onChange={next => onComparisonChange(next as CreditCondition['comparison'])} />
      <OptionPicker label="Credits" value={value} options={[{ value: '', label: 'Any credits' }, ...values.map(amount => ({ value: String(amount), label: `${amount} ${amount === 1 ? 'credit' : 'credits'}` }))]} onChange={onValueChange} />
    </View>
    {!!value && <Text style={styles.hint}>Variable-credit courses match when their range includes a qualifying amount.</Text>}
  </View>;
}
const styles = StyleSheet.create({ group: { gap: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, hint: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 } });
