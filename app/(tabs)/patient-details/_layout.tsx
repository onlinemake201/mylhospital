import { Stack } from 'expo-router';

export default function PatientDetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}
