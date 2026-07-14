import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';

import { auth, db } from '../../config/firebase'; 
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import CustomButton from '@/components/CustomButton';
import HabitCard from '@/components/HabitCard';
import CustomModal from '@/components/CustomModal';

interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number; 
  frequency: number;
  history: Record<string, 'completed' | 'skipped' | 'failed'>;
}

interface HabitModalButton {
  text: string;
  variant?: 'tint' | 'success' | 'danger' | 'neutral' | 'outline';
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}

export default function HabitsScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const currentUser = auth.currentUser;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Setup a continuous live stream listener to Firestore
  useFocusEffect(
    useCallback(() => {
      const habitsCollection = collection(db, 'habits');
      const q = query(
        habitsCollection, 
        where('userId', '==', currentUser?.uid || 'unknown')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedHabits: Habit[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedHabits.push({
            id: doc.id,
            title: data.title || 'Untitled',
            category: data.category || 'General',
            streak: Number(data.streak) || 0,
            frequency: Number(data.frequency) || 7,
            history: data.history || {},
          });
        });

        setHabits(loadedHabits);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error("Live streaming habits failed: ", error);
        setLoading(false);
        setRefreshing(false);
      });

      return () => unsubscribe();
    }, [])
  );
  

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {setRefreshing(false)}, 1000);
  }, []);

  const handleHabitPress = (habitId: string, habitTitle: string, habitCategory: string, habitStreak: number) => {
    router.push({
      pathname: '/habit-detail',
      params: { id: habitId, title: habitTitle, category: habitCategory, streak: String(habitStreak) }
    });
  };

  const calculateStreakFromHistory = (history: Record<string, 'completed' | 'skipped' | 'failed'>) => {
    let count = 0;
    let checkDate = new Date();
    
    const todayStr = checkDate.toISOString().split('T')[0];
    const todayStatus = history[todayStr];

    if(todayStatus !== 'completed' && todayStatus !== 'skipped'){
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const status = history[dateStr];

      if (status === 'completed') {
        count += 1;
      } else if (status === 'skipped') {
        // Skips don't break the streak
      } else {
        // If status is 'failed' or 'undefined' (not logged in app), streak breaks here
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return count;
  };

  const handleStatusSelect = async (status: 'completed' | 'skipped' | 'failed') => {
    if(!activeHabit) return;

    const todayStreak = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'habits', activeHabit.id);

    const updatedHistory = {
      ...activeHabit.history,
      [todayStreak]: status
    };

    const nextStreak = calculateStreakFromHistory(updatedHistory);

    try {
      await updateDoc(docRef, {
        [`history.${todayStreak}`]: status,
        streak: nextStreak
      });

      setModalVisible(false);
      setActiveHabit(null);
    } catch (error) {
      console.error("Failed writing status patch payload", error);
    }
  };

  const getWeeklySkipInfo = () => {
    if (!activeHabit) return { canSkip: false, remainingSkips: 0 };
    
    const maxSkipsAllowed = 7 - activeHabit.frequency;
    if (maxSkipsAllowed <= 0) return { canSkip: false, remainingSkips: 0 };

    const today = new Date();
    const currentDayOfWeek = today.getDay(); 
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    
    const weeklyDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weeklyDates.push(day.toISOString().split('T')[0]);
    }

    const skipsThisWeek = weeklyDates.reduce((count, dateStr) => {
      return activeHabit.history[dateStr] === 'skipped' ? count + 1 : count;
    }, 0);

    const remainingSkips = maxSkipsAllowed - skipsThisWeek;
    return {
      canSkip: remainingSkips > 0,
      remainingSkips: Math.max(0, remainingSkips)
    };
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
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={currentColors.tint} 
              colors={[currentColors.tint]} 
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: currentColors.title, marginBottom: 0 }]}>My Habits</Text>
            <CustomButton text="New +" size="small" onPress={() => router.push('/add-habit')} />
          </View>
          
          {habits.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ color: '#94A3B8' }}>No habits found. Create one to get started!</Text>
            </View>
          ) : (
            habits.map((habit) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayStatus = habit.history[todayStr];

              return (
                <HabitCard
                  key={habit.id}
                  title={habit.title}
                  category={habit.category}
                  streak={habit.streak}
                  todayStatus={todayStatus}
                  onCardPress={() => handleHabitPress(habit.id, habit.title, habit.category, habit.streak)}
                  onCheckInPress={() => { setActiveHabit(habit); setModalVisible(true); }}
                />
              );
            })
          )}
        </ScrollView>
      )}
      {activeHabit && (() => {
        const { canSkip, remainingSkips } = getWeeklySkipInfo();
        const isLowFrequency = activeHabit.frequency < 7;

        const targetTodayStr = new Date().toISOString().split('T')[0];
        const isTodayAlreadySkipped = activeHabit.history[targetTodayStr] === 'skipped';
        const isMissedButtonLocked = isLowFrequency && (remainingSkips > 0 || isTodayAlreadySkipped);

        const modalButtons: HabitModalButton[] = [
          { text: 'Mark Done', variant: 'tint', onPress: () => handleStatusSelect('completed') }
        ];

        if (isLowFrequency) {
          modalButtons.push({
            text: canSkip ? `Skip Day (${remainingSkips} left)` : 'No Skips Remaining',
            variant: canSkip ? 'neutral' : 'outline',
            disabled: !canSkip,
            onPress: () => handleStatusSelect('skipped')
          });
        }

        modalButtons.push({
          text: isMissedButtonLocked ? '🔒 Use Your Skips First' : 'Missed / Not Done',
          variant: isMissedButtonLocked ? 'neutral' : 'danger',
          disabled: isMissedButtonLocked,
          onPress: () => handleStatusSelect('failed')
        });

        modalButtons.push({
          text: 'Cancel',
          variant: 'outline',
          onPress: () => { setModalVisible(false); setActiveHabit(null); }
        });

        return (
          <CustomModal
            visible={modalVisible}
            title={`Check In: ${activeHabit.title}`}
            onClose={() => { setModalVisible(false); setActiveHabit(null); }}
            buttons={modalButtons}
          />
        );
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
});