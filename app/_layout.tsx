import { 
  DarkTheme as NavigationDarkTheme, 
  DefaultTheme as NavigationDefaultTheme, 
  ThemeProvider as NavContainer
} from 'expo-router/react-navigation';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import Colors from '@/constants/Colors';
import 'react-native-reanimated';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '../context/auth'; 

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth(); 
  const segments = useSegments(); 
  const router = useRouter();
  
  const { theme } = useAppTheme();
  const currentColors = Colors[theme];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(currentColors.background);
  }, [currentColors.background]);

  useEffect(() => {
    if (loading) return; 

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'profile-editor';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (!user.displayName) {
        if (!inOnboarding) {
          router.replace({ pathname: '/profile-editor', params: {mode: 'create'}});
        }
      } else {
        if (inAuthGroup) {
          router.replace('/(tabs)/home');
        }
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return null;
  }

  const CustomNavigationTheme = {
    ...(theme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
    colors: {
      ...(theme === 'dark' ? NavigationDarkTheme.colors : NavigationDefaultTheme.colors),
      background: currentColors.background,
      card: currentColors.cardBackground || currentColors.background, 
      text: currentColors.text,
    },
  };

  return (
    <NavContainer value={CustomNavigationTheme}>
      <Stack 
        screenOptions={{ 
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: currentColors.background }, 
          headerStyle: { backgroundColor: currentColors.cardBackground || currentColors.background }, 
          headerTintColor: currentColors.text,  
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="profile-editor" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="habit-detail" options={{ headerShown: true }} />
        <Stack.Screen name="habit-editor" options={{ headerShown: true, title: 'Habit Details' }} />
        <Stack.Screen name="add-friend" options={{headerShown: true, title: 'Search by Username'}}/>
      </Stack>
    </NavContainer>
  );
}