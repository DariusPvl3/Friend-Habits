import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { Habit } from '@/types';
import CustomButton from '@/components/CustomButton';
import { removeFriend } from '@/services/friendshipService';
import HabitCard from '@/components/HabitCard';

export default function UserProfileScreen() {
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const { id, name, avatarUrl, friendStatus } = useLocalSearchParams();
  const displayName = name as string;
  const displayAvatar = avatarUrl as string;
  const currentStatus = friendStatus as string;

  const [userHabits, setUserHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if(!id) return;

    const q = query(collection(db, 'habits'), where('userId', '==', id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedHabits = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          category: data.category,
          streak: data.streak,
          frequency: data.frequency,
          history: data.history,
          visibility: data.visibility || 'Private',
        }
      }) as Habit[];

      const visibleHabits = fetchedHabits.filter(habit => {
        if (currentStatus === 'friends'){
          return habit.visibility === 'Public' || habit.visibility === 'Friends';
        } else {
          return habit.visibility === 'Public';
        }
      });

      setUserHabits(visibleHabits);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, currentStatus]);

  return (
    <SafeAreaView style={[defaultStyles.container, { backgroundColor: currentColors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: `${name}'s Stats`,
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background }
        }} 
      />

      <View style={defaultStyles.content}>
        <View style={defaultStyles.avatarWrapper}>
          {displayAvatar ? (
            <Image 
                source={{ uri: displayAvatar }} 
                style={[defaultStyles.avatarLarge, defaultStyles.avatarBordered]} 
              />
            ) : (
              <View style={[defaultStyles.avatarLarge, defaultStyles.avatarBordered, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="account" size={50} color="#94A3B8" />
              </View>
            )}
        </View>
          
        {/* Display their name underneath */}
        <Text style={[defaultStyles.title, { color: currentColors.text, textAlign: 'center' }]}>
          {displayName}
        </Text>


        {/* --- HABITS SECTION --- */}
        <View style={{ marginTop: 32 }}>
          <Text style={[defaultStyles.label, { color: currentColors.text, marginBottom: 16 }]}>
            {currentStatus === 'friends' ? "Shared Habits" : "Public Habits"}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={currentColors.tint} style={{ marginTop: 24 }} />
          ) : userHabits.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', textAlign: 'center' }}>
                {displayName} doesn't have any visible habits right now.
              </Text>
            </View>
          ) : (
            userHabits.map(habit => (
              <HabitCard
                key={habit.id}
                title={habit.title}
                category={habit.category}
                streak={habit.streak}
                todayStatus={habit.history ? habit.history[todayStr] : undefined}
                isReadOnly={true}
              />
            ))
          )}
        </View>
      </View>

      {currentStatus === 'friends' && (
        <View style={{ padding: 24, marginTop: 'auto' }}>
          <CustomButton 
            text="Remove Friend" 
            variant="danger" 
            onPress={async () => {
               await removeFriend(auth.currentUser?.uid as string, id as string);
               router.back();
            }} 
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtext: {
    fontSize: 16,
    color: '#94A3B8',
  },
});