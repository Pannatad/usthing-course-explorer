import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: colors.surface,
        headerTitleStyle: { fontSize: 22, fontWeight: '700' },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}>
        <Stack.Screen name="index" options={{ title: 'Course Explorer' }} />
        <Stack.Screen name="course/[termCode]/[courseCode]" options={{ title: 'Course Details' }} />
      </Stack>
    </>
  );
}
