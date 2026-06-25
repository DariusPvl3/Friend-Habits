import React from 'react';
import { StyleSheet, Text, View, Image, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

export default function HabitDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // hook that grabs the parameters sent through the nav link
  const { title, category, streak } = useLocalSearchParams<{ 
    title: string; 
    category: string; 
    streak: string;
  }>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: title,
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background }
        }} 
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: currentColors.text }]}>{title}</Text>
        <Text style={styles.subtext}>Category: {category}</Text>
        <Text style={styles.subtext}>Current Streak: {streak}</Text>
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