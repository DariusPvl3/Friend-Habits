import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

import { auth, db } from '../../config/firebase'; 
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useAppTheme } from '@/context/ThemeContext';

interface HomeHabit {
  id: string;
  title: string;
  category: string;
  streak: number; 
  frequency: number;
  history: Record<string, 'completed' | 'skipped' | 'failed'>;
}

// 1. Added minimal Friend definition for the dashboard preview pulse
interface HomeFriend {
  id: string;
  name: string;
  avatarUrl: string;
  progress: number; // e.g., 0.0 to 1.0 (0% to 100%)
}

const FAKE_FRIENDS: HomeFriend[] = [
  { id: '1', name: 'Alexandru', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', progress: 0.1 },  // 100% Done
  { id: '2', name: 'Elena', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', progress: 1.0 }, // 66% Done
  { id: '3', name: 'Mihai', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', progress: 0.6 }, // 25% Done
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const currentUser = auth.currentUser;

  const [habits, setHabits] = useState<HomeHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.history[todayStr] === 'completed').length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const remainingHabits = habits.filter(h => h.history[todayStr] === undefined);

  useFocusEffect(
    useCallback(() => {
    const habitsCollection = collection(db, 'habits');
      const q = query(
        habitsCollection, 
        where('userId', '==', currentUser?.uid || 'unknown')
      );
        
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedHabits: HomeHabit[] = [];
          
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

  const getRingColor = (progress: number, tintColor: string) => {
    if (progress === 1) return tintColor; // Full Emerald Green for completion!
    if (progress >= 0.5) return '#F59E0B'; // Vibrant Amber/Orange for passing half
    if (progress > 0) return '#94A3B8';
    return '#F30612';
  };

  const calculateStreakFromHistory = (history: Record<string, 'completed' | 'skipped' | 'failed'>) => {
    let count = 0;
    let checkDate = new Date();
    
    // Start checking backward from yesterday
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const status = history[dateStr];

      if (status === 'completed') {
        count += 1;
      } else if (status === 'skipped') {
        // Skips pass through safely without breaking the streak loop
      } else {
        break; // Streak was officially broken here
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return count;
  };

  const handleQuickCheckIn = async (habitId: string, currentHistory: Record<string, 'completed' | 'skipped' | 'failed'>) => {
    try {
      const docRef = doc(db, 'habits', habitId);
      
      // Calculate what the streak should be based on yesterday backwards, plus today's click!
      const baselineStreak = calculateStreakFromHistory(currentHistory);
      const nextStreak = baselineStreak + 1;

      // Optimistically push the update to Firestore
      await updateDoc(docRef, {
        [`history.${todayStr}`]: 'completed',
        streak: nextStreak
      });
    } catch (error) {
      console.error("Failed to execute quick home check-in:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Section 1: Greeting */}
        <View style={styles.headerSection}>
          <Text style={styles.dateSubtext}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </Text>
          <Text style={[styles.greetingTitle, { color: currentColors.text }]}>Hello, {currentUser?.displayName || 'User'}! 👋</Text>
        </View>

        {/* Section 2: Overall Daily Progress */}
        <View style={[styles.progressCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressTitle, { color: currentColors.text }]}>Today's Progress</Text>
            <Text style={[styles.progressPercent, { color: currentColors.tint }]}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%`, backgroundColor: currentColors.tint }]} />
          </View>
          <Text style={styles.progressSummary}>
            {completedHabits} of {totalHabits} habits locked in. Keep going!
          </Text>
        </View>

        {/* NEW Section 3: Friends Activity Carousel */}
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Friends Progress</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.friendsCarousel}
          contentContainerStyle={styles.friendsCarouselContent}
        >
          {FAKE_FRIENDS.map((friend) => {
          // Calculate the color for this specific friend dynamically
          const ringColor = getRingColor(friend.progress, currentColors.tint);

          return (
            <TouchableOpacity 
              key={friend.id} 
              style={styles.friendAvatarWrapper}
              onPress={() => router.push('/friends')}
            >
              {/* The Ring Box changes color dynamically based on their tier */}
              <View style={[styles.avatarRing, { borderColor: ringColor }]}>
                <Image source={{ uri: friend.avatarUrl }} style={styles.carouselAvatar} />
                
                {/* Tiny absolute badge dot showing the percentage over the profile photo */}
                <View style={[styles.miniPercentageBadge, { backgroundColor: ringColor }]}>
                  <Text style={styles.miniBadgeText}>{Math.round(friend.progress * 100)}%</Text>
                </View>
              </View>
              
              <Text style={[styles.carouselFriendName, { color: currentColors.text }]} numberOfLines={1}>
                {friend.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        </ScrollView>

        {/* Section 4: Left For Today */}
        <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Left For Today</Text>
        
        {remainingHabits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🎉 Incredible job! You've crushed all your habits for today.</Text>
          </View>
        ) : (
          remainingHabits.map((habit) => (
              <TouchableOpacity 
                key={habit.id}
                style={[styles.habitCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
                activeOpacity={0.8}
                onPress={() => handleQuickCheckIn(habit.id, habit.history)}
              >
                <View style={[styles.checkboxCircle, { borderColor: currentColors.tint }]} />
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitTitle, { color: currentColors.text }]}>{habit.title}</Text>
                  <Text style={styles.habitCategory}>{habit.category}</Text>
                </View>
                <Text style={styles.streakText}>🔥 {habit.streak}</Text>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  headerSection: { marginBottom: 24 },
  dateSubtext: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
  greetingTitle: { fontSize: 28, fontWeight: 'bold' },
  progressCard: { padding: 20, borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 18, fontWeight: '600' },
  progressPercent: { fontSize: 22, fontWeight: 'bold' },
  progressBarTrack: { height: 10, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 5, marginBottom: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressSummary: { fontSize: 14, color: '#94A3B8' },
  
  // Carousel Specific Elements
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  friendsCarousel: { marginBottom: 24, flexDirection: 'row' },
  friendsCarouselContent: { paddingRight: 32 }, // Gives breathing space when scrolling past the last element
  friendAvatarWrapper: { alignItems: 'center', marginRight: 20, width: 65 },
  carouselFriendName: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  avatarRing: {
    padding: 2, 
    borderWidth: 3, // Thicker border profile to show off the colors!
    borderRadius: 30, 
    width: 58, 
    height: 58, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6,
    position: 'relative', // Allows us to pin the tiny badge relative to this circle
  },
  carouselAvatar: { 
    width: 46, 
    height: 46, 
    borderRadius: 23 
  },
  miniPercentageBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 4,
    height: 16,
    minWidth: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF', // White outline separating it cleanly from the background
  },
  miniBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },

  emptyContainer: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  habitCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  checkboxCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, marginRight: 16 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  habitCategory: { fontSize: 14, color: '#94A3B8' },
  streakText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' }
});