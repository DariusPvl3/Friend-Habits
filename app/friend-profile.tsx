import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../constants/Colors';

export default function FriendProfileScreen() {
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  // hook that grabs the parameters sent through the nav link
  const { name, progress, avatarUrl } = useLocalSearchParams<{ 
    name: string; 
    progress: string; 
    avatarUrl: string 
  }>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: `${name}'s Stats`,
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background }
        }} 
      />

      <View style={styles.content}>
        {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />}
        <Text style={[styles.title, { color: currentColors.text }]}>{name}</Text>
        <Text style={styles.subtext}>Daily Completion: {progress}%</Text>
        
        {/* later additions */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50, // Perfect circle for a profile header
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#94A3B8',
  },
});