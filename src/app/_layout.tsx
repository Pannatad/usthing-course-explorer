import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Course Explorer' }} />
      <Stack.Screen name="course/[termCode]/[courseCode]" options={{ title: 'Course' }} />
    </Stack>
  );
}
