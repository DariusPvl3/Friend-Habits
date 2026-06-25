import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, useColorScheme, ActivityIndicator, RefreshControl } from 'react-native';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

import { db } from '../../config/firebase'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number; 
}

export default function HabitsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Setup a continuous live stream listener to Firestore
  useFocusEffect(
    useCallback(() => {
      const habitsCollection = collection(db, 'habits');
      const q = query(habitsCollection, where('userId', '==', 'test_user_1'));
      
      // onSnapshot stays open and listens for live cloud updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedHabits: Habit[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedHabits.push({
            id: doc.id,
            title: data.title || 'Untitled',
            category: data.category || 'General',
            streak: Number(data.streak) || 0,
          });
        });

        setHabits(loadedHabits);
        setLoading(false);
        setRefreshing(false); // Stop the pulling spinner if it was triggered
      }, (error) => {
        console.error("Live streaming habits failed: ", error);
        setLoading(false);
        setRefreshing(false);
      });

      // CRITICAL: Clean up the listener when the user leaves the screen 
      // This prevents memory leaks and unnecessary Firebase data charges
      return () => unsubscribe();
    }, [])
  );
  

  // Manual pull-to-refresh action trigger (satisfies mobile gesture habits)
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {setRefreshing(false)}, 1000)
  }, []);

  const handleHabitPress = (habitId: string, habitTitle: string, habitCategory: string, habitStreak: number) => {
    router.push({
      pathname: '/habit-detail',
      params: { id: habitId, title: habitTitle, category: habitCategory, streak: String(habitStreak) }
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentColors.tint} />
          <Text style={{ color: '#94A3B8', marginTop: 12 }}>Loading your habits...</Text>
        </View>
      ) : (
        /* Inject RefreshControl into the ScrollView component container */
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={currentColors.tint} // Color of spinner on iOS
              colors={[currentColors.tint]} // Color of spinner on Android
            />
          }
        >
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: currentColors.title, marginBottom: 0 }]}>My Habits</Text>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: currentColors.tint }]}
              onPress={() => router.push('/add-habit')}
            >
              <Text style={styles.addButtonText}>New +</Text>
            </TouchableOpacity>
          </View>
          
          {habits.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ color: '#94A3B8' }}>No habits found. Create one to get started!</Text>
            </View>
          ) : (
            habits.map((habit) => (
              <TouchableOpacity 
                key={habit.id} 
                style={[styles.habitCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
                onPress={() => handleHabitPress(habit.id, habit.title, habit.category, habit.streak)}
                activeOpacity={0.7}
              >
                <View style={styles.infoContainer}>
                  <Text style={[styles.habitTitle, { color: currentColors.text }]}>{habit.title}</Text>
                  <Text style={styles.habitCategory}>{habit.category}</Text>
                </View>

                <View style={[styles.badge, { backgroundColor: habit.streak >= 3 ? currentColors.streakBg : currentColors.badge }]}>
                  <Text style={[styles.badgeText, { color: habit.streak >= 3 ? '#FF6B35' : currentColors.text }]}>
                    {habit.streak >= 3 ? `🔥 ${habit.streak}` : habit.streak}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  habitCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  infoContainer: { flex: 1 },
  habitTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  habitCategory: { fontSize: 14, color: '#94A3B8' },
  badge: { width: 58, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
});