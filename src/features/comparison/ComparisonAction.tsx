import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';

type Props = { label: string; accessibilityLabel?: string; onPress: () => void };

/** A text button used throughout the comparison screens. */
export function ComparisonAction({ label, accessibilityLabel = label, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [comparisonStyles.action, pressed && comparisonStyles.pressed]}>
      <Text style={comparisonStyles.actionText}>{label}</Text>
    </Pressable>
  );
}

/** Text and action styles shared by the coordinator, chooser, and details. */
export const comparisonStyles = StyleSheet.create({
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  code: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  action: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  actionText: { color: colors.accent, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  pressed: { opacity: 0.65 },
});
