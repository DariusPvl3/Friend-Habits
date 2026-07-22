// app/settings/_layout.tsx
import { Stack } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

export default function SettingsLayout() {
  const { theme } = useAppTheme();
  const currentColors = Colors[theme];

  return (
    <Stack 
      screenOptions={{ 
        headerShown: true, 
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: currentColors.background },
        headerStyle: { backgroundColor: currentColors.background },
        headerTintColor: currentColors.tint,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="profile-editor" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="theme" options={{ title: 'Theme Settings' }} />
      <Stack.Screen name="account" options={{ title: 'Account Settings' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
    </Stack>
  );
}