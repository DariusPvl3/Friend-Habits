import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeToIncomingRequests, subscribeToFriends, respondToRequest } from '@/services/friendshipService';
import { auth } from '@/config/firebase';
import CustomButton from '@/components/CustomButton';

interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  dailyProgress: number; 
}

export default function FriendsScreen() {
  const router = useRouter();

  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(true);

  useEffect(() => {
    const currentUID = auth.currentUser?.uid;
    if (!currentUID) return;

    const unsubscribeRequests = subscribeToIncomingRequests(currentUID, (data) => {
      setIncomingRequests(data);
    });

    const unsubscribeFriends = subscribeToFriends(currentUID, (data) => {
      setFriends(data);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
    };
  }, []);

  const handleFriendPress = (friendName: string, progress: number, avatar: string) => {
    router.push({
      pathname: '/friend-profile',
      params: { 
        name: friendName, 
        progress: Math.round(progress * 100),
        avatarUrl: avatar
      }
    });
  };

  const handleAccept = async (userId: string, friendshipId: string) => {
    setIncomingRequests(prev => prev.filter(req => req.id !== userId));
    
    await respondToRequest(friendshipId, true);
    console.log(`Accepted request from: ${userId}`);
  };

  const handleDecline = async (userId: string, friendshipId: string) => {
    setIncomingRequests(prev => prev.filter(req => req.id !== userId));

    await respondToRequest(friendshipId, false);
    console.log(`Declined request from: ${userId}`);
  };

  return (
    <SafeAreaView style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      <ScrollView style={defaultStyles.container}>
        <View style={[defaultStyles.headerRow]}>
          <Text style={[defaultStyles.headerTitle, { color: currentColors.title, marginBottom: 0 }]}>My Friends</Text>
          <CustomButton text="Add Friend +" size="small" onPress={() => router.push('/add-friend')} />
        </View>

        {/* --- INCOMING REQUESTS SECTION --- */}
        {incomingRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <TouchableOpacity 
              style={styles.requestHeaderRow} 
              onPress={() => setIsRequestsExpanded(prev => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                Friend Requests ({incomingRequests.length})
              </Text>
              <MaterialCommunityIcons 
                name={isRequestsExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color='#94A3B8'
              />
            </TouchableOpacity>
            {isRequestsExpanded && (
              incomingRequests.map((req) => (
                <View 
                  key={req.id} 
                  style={[
                    defaultStyles.friendCard, 
                    { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }
                  ]}
                >
                  {/* Left: Avatar */}
                  {req.avatarUrl ? (
                    <Image 
                      source={{ uri: req.avatarUrl }} 
                      style={[defaultStyles.avatarMedium, { marginRight: 16 }]} 
                    />
                  ) : (
                    <View style={[
                      defaultStyles.avatarMedium, 
                      defaultStyles.avatarPlaceholder, 
                      { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0', marginRight: 16 }
                    ]}>
                      <MaterialCommunityIcons name="account" size={24} color="#94A3B8" />
                    </View>
                  )}

                  {/* Center: Name via infoContainer */}
                  <View style={defaultStyles.infoContainer}>
                    <Text style={[defaultStyles.friendName, { color: currentColors.text, marginBottom: 0 }]}>
                      {req.name}
                    </Text>
                  </View>

                  {/* Right: Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.button, styles.declineButton]} 
                      onPress={() => handleDecline(req.id, req.friendshipId)}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.button, styles.acceptButton]} 
                      onPress={() => handleAccept(req.id, req.friendshipId)}
                    >
                      <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        
        {/* --- FRIENDS LIST --- */}
        {friends.length === 0 ? (
          <View style={defaultStyles.centerContainer}>
            <Text style={{ color: '#94A3B8' }}>No friends found. What are you waiting for?</Text>
          </View>
        ) : (
          friends.map((friend) => (
            <TouchableOpacity 
              key={friend.id} 
              style={[defaultStyles.friendCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
              onPress={() => handleFriendPress(friend.name, friend.dailyProgress, friend.avatarUrl)}
              activeOpacity={0.7}
            >
              {friend.avatarUrl ? (
                <Image 
                  source={{ uri: friend.avatarUrl }} 
                  style={[defaultStyles.avatarMedium, { marginRight: 16 }]} 
                />
              ) : (
                <View style={[
                  defaultStyles.avatarMedium, 
                  defaultStyles.avatarPlaceholder, 
                  { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0', marginRight: 16 }
                ]}>
                  <MaterialCommunityIcons name="account" size={24} color="#94A3B8" />
                </View>
              )}

              <View style={defaultStyles.infoContainer}>
                  <Text style={[defaultStyles.friendName, { color: currentColors.text }]}>{friend.name}</Text>
                  <Text style={styles.progressSubtext}>
                  {friend.dailyProgress === 1 
                      ? 'All habits completed!' 
                      : `Completed ${Math.round(friend.dailyProgress * 100)}% of today's goals`}
                  </Text>
              </View>

              <View style={[styles.badge, { backgroundColor: friend.dailyProgress === 1 ? currentColors.tint : currentColors.badge }]}>
              <Text style={[
                  styles.badgeText, 
                  { color: friend.dailyProgress === 1 ? '#FFFFFF' : currentColors.text }
              ]}>
                  {Math.round(friend.dailyProgress * 100)}%
              </Text>
              </View>
            </TouchableOpacity>
          )
        )
      )}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Reused in Friends List ---
  progressSubtext: {
    fontSize: 14,
    color: '#94A3B8', 
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

  // --- Specific to Incoming Requests ---
  requestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444', 
  },
  acceptButton: {
    backgroundColor: '#3B82F6', 
  },
});