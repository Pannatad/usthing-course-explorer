import { StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';

export function CourseLevelBadge({ careerType }: { careerType: string }) {
  if (!careerType) return null;
  const label = careerType === 'UG' ? 'Undergraduate' : careerType === 'PG' ? 'Postgraduate' : careerType;
  return <Text accessibilityLabel={label} style={[styles.badge, careerType === 'UG' && styles.undergraduate, careerType === 'PG' && styles.postgraduate]}>{careerType}</Text>;
}
const styles = StyleSheet.create({
  badge: { color: colors.text, backgroundColor: colors.surface, borderRadius: 7, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: '800' },
  undergraduate: { color: colors.surface, backgroundColor: colors.accent },
  postgraduate: { color: colors.surface, backgroundColor: colors.postgraduateAccent },
});
