import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

// Friends tab
interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number; 
}

// Fake Data before hooking up Firebase
const FAKE_HABITS: Habit[] = [
  { id: '1', title: 'Gym', category: 'Sports', streak: 5},
  { id: '2', title: 'Deficit caloric', category: 'Health', streak: 3},
  { id: '3', title: 'Reading', category: 'Free time', streak: 2},
];

export default function HabitsScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // This function handles what happens when a habit is clicked
  const handleHabitPress = (habitTitle: string, habitCategory: string, habitStreak: number) => {
    // Use router.push to navigate and pass data via pathname query object
    router.push({
      pathname: '/habit-detail',
      params: { 
        title: habitTitle, 
        category: habitCategory,
        streak: habitStreak,
      }
    });
  };

  return (
    // ScrollView allows the user to scroll vertically if the list gets long
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.container}>
        <Text style={[styles.headerTitle, { color: currentColors.title }]}>My Habits</Text>
        
        {/* Loop through the array and render custom card layout */}
        {FAKE_HABITS.map((habit) => (
            <TouchableOpacity 
            key={habit.id} 
            style={[styles.habitCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
            onPress={() => handleHabitPress(habit.title, habit.category, habit.streak)}
            activeOpacity={0.7}
            >

            {/* Center: Habit Info Text */}
            <View style={styles.infoContainer}>
                <Text style={[styles.habitTitle, { color: currentColors.text }]}>{habit.title}</Text>
                <Text style={[styles.habitCategory, { color: currentColors.text }]}>{habit.category}</Text>
            </View>

            {/* Right Side: A Visual Progress Badge */}
            <View style={[styles.badge, { backgroundColor: habit.streak >= 3 ? currentColors.streakBg: currentColors.badge}]}>
              <Text style={[styles.badgeText, { color: habit.streak >= 3 ? '#FF6B35' : currentColors.text }]}>
                {habit.streak >= 3 ? `🔥 ${habit.streak}` : habit.streak}
              </Text>
            </View>
            </TouchableOpacity>
        ))}
        </ScrollView>
    </SafeAreaView>
  );
}

// Layout and Styling styles using Flexbox
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  safeArea: {
    flex: 1
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  habitCard: {
    flexDirection: 'row', // Aligns items horizontally (Text -> Badge)
    alignItems: 'center', // Centers elements vertically within the row
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    // Soft shadow for light mode
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // Shadow for Android devices
  },
  infoContainer: {
    flex: 1, // Takes up all remaining available horizontal space
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitCategory: {
    fontSize: 14,
    color: '#94A3B8', // Muted slate color for descriptions
  },
  badge: {
    width: 58,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});