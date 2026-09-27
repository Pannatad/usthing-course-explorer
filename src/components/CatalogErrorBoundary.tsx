import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export function CatalogErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unable to load the catalogue</Text>
      <Text style={styles.body}>The bundled course data could not be read. Try again, or reopen the app.</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
        <Text style={styles.action}>Try again</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  body: { color: colors.secondaryText, fontSize: 16, lineHeight: 24 },
  button: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, backgroundColor: colors.courseSurface, borderRadius: 8 },
  action: { color: colors.accent, fontWeight: '700' },
});
