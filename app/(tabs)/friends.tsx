import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

// Friends tab
interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  dailyProgress: number; // 0.75 means 75% done with their habits today
}

// Fake Data before hooking up Firebase
const FAKE_FRIENDS: Friend[] = [
  { id: '1', name: 'Alexandru', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', dailyProgress: 0.05},
  { id: '2', name: 'Elena', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', dailyProgress: 1.00 },
  { id: '3', name: 'Mihai', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', dailyProgress: 0.40 },
];

export default function FriendsScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // This function handles what happens when a friend is clicked
  const handleFriendPress = (friendName: string, progress: number, avatar: string) => {
    // Use router.push to navigate and pass data via pathname query object
    router.push({
      pathname: '/friend-profile',
      params: { 
        name: friendName, 
        progress: Math.round(progress * 100),
        avatarUrl: avatar
      }
    });
  };

  return (
    // ScrollView allows the user to scroll vertically if the list gets long
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.container}>
        <Text style={[styles.headerTitle, { color: currentColors.title }]}>My Friends</Text>
        
        {/* Loop through the array and render custom card layout */}
        {FAKE_FRIENDS.map((friend) => (
            <TouchableOpacity 
            key={friend.id} 
            style={[styles.friendCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
            onPress={() => handleFriendPress(friend.name, friend.dailyProgress, friend.avatarUrl)}
            activeOpacity={0.7}
            >
            {/* Left Side: Avatar Image */}
            <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />

            {/* Center: Friend Info Text */}
            <View style={styles.infoContainer}>
                <Text style={[styles.friendName, { color: currentColors.text }]}>{friend.name}</Text>
                <Text style={styles.progressSubtext}>
                {friend.dailyProgress === 1 
                    ? 'All habits completed!' 
                    : `Completed ${Math.round(friend.dailyProgress * 100)}% of today's goals`}
                </Text>
            </View>

            {/* Right Side: A Visual Progress Badge */}
            <View style={[styles.badge, { backgroundColor: friend.dailyProgress === 1 ? currentColors.tint : currentColors.badge }]}>
            <Text style={[
                styles.badgeText, 
                { 
                // White text on green accent, dark slate gray text on light gray badge
                color: friend.dailyProgress === 1 ? '#FFFFFF' : currentColors.text
                }
            ]}>
                {Math.round(friend.dailyProgress * 100)}%
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
  friendCard: {
    flexDirection: 'row', // Aligns items horizontally (Image -> Text -> Badge)
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25, // Making it half the width/height ensures a perfect circle
    marginRight: 16,
  },
  infoContainer: {
    flex: 1, // Takes up all remaining available horizontal space
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#94A3B8', // Muted slate color for descriptions
  },
  badge: {
    width: 50,
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