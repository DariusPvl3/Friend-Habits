import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { auth, db } from '@/config/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import { useAppTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import UserStatsCollapsible from '@/components/UserStatsCollapsible';
import { calculateUserStats } from '@/services/statisticsService';
import { Habit } from '@/types';

interface SettingItem {
  id: string;
  title: string;
  icon: string;
  targetRoute: string;
}

interface SettingSection {
  sectionTitle: string;
  items: SettingItem[];
}

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    sectionTitle: "App Preferences",
    items: [
      { id: "notifications", title: "Reminders & Notifications", icon: "notifications-outline", targetRoute: "/settings/notifications" },
      { id: "theme", title: "Theme Preferences", icon: "color-palette-outline", targetRoute: "/settings/theme" },
    ],
  },
  {
    sectionTitle: "Security & Management",
    items: [
      { id: "account", title: "Account Settings", icon: "settings-outline", targetRoute: "/settings/account" },
      { id: "privacy", title: "Privacy & Data", icon: "shield-checkmark-outline", targetRoute: "/settings/privacy" },
    ],
  },
];

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [userHabits, setUserHabits] = useState<Habit[]>([]);
  const [progressHistory, setProgressHistory] = useState<Record<string, number>>({});
  const [accountCreatedAt, setAccountCreatedAt] = useState<Date | null>(null);

  useFocusEffect(
    useCallback(() => {
      const refreshUserCache = async () => {
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
          } catch (err) {
            console.error("Failed to sync account screen tokens:", err);
          }
        }
      };
      refreshUserCache();
    }, [])
  );

  // 1. Fetch user progress history & account age
  useEffect(() => {
    if (!user?.displayName) return;

    const userRef = doc(db, 'usernames', user.displayName);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProgressHistory(data.progressHistory || {});

        if (data.createdAt) {
          const parsedDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          setAccountCreatedAt(parsedDate);
        }
      }
    });

    return () => unsubscribeUser();
  }, [user?.displayName]);

  // 2. Fetch active habits
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubscribeHabits = onSnapshot(q, (snapshot) => {
      const fetchedHabits = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        category: doc.data().category,
        streak: doc.data().streak,
        frequency: doc.data().frequency,
        history: doc.data().history || {},
        visibility: doc.data().visibility || 'Private',
      } as Habit));

      setUserHabits(fetchedHabits);
    });

    return () => unsubscribeHabits();
  }, [user?.uid]);

  // 3. Compute stats
  const calculatedStats = useMemo(() => {
    return calculateUserStats(userHabits, progressHistory, accountCreatedAt);
  }, [userHabits, progressHistory, accountCreatedAt]);

  const handleSettingPress = (settingTitle: string, settingRoute: string) => {
    router.push({ pathname: settingRoute as any, params: { title: settingTitle } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: currentColors.text }]}>Me</Text>

        {/* --- PROFILE CARD --- */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F1F5F9' },
          ]}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/profile-editor', params: { mode: 'edit' } })}
        >
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={[defaultStyles.avatarMedium, defaultStyles.avatarBordered]}
            />
          ) : (
            <View
              style={[
                defaultStyles.avatarMedium,
                defaultStyles.avatarBordered,
                {
                  backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <MaterialCommunityIcons name="account" size={28} color="#94A3B8" />
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={[styles.usernameLabel, { color: currentColors.text }]}>
              {user?.displayName || "Anonymous"}
            </Text>
            <Text style={styles.verifiedSubtext}>{user?.email}</Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
        </TouchableOpacity>

        {/* --- USER STATISTICS --- */}
        <View style={{ width: '100%', marginTop: 12, marginBottom: 8 }}>
          <UserStatsCollapsible
            stats={calculatedStats}
            progressHistory={progressHistory}
            accountCreatedAt={accountCreatedAt}
            currentColors={currentColors}
          />
        </View>

        {/* --- SETTINGS SECTIONS --- */}
        {SETTINGS_SECTIONS.map((section, sectionIdx) => (
          <View key={sectionIdx} style={{ marginTop: 16 }}>
            <Text style={[styles.sectionHeaderTitle, { color: '#94A3B8' }]}>
              {section.sectionTitle}
            </Text>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.sectionCard,
                  { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
                ]}
                activeOpacity={0.7}
                onPress={() => handleSettingPress(item.title, item.targetRoute)}
              >
                <View style={styles.infoContainer}>
                  <Text style={[styles.sectionName, { color: currentColors.text }]}>
                    {item.title}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    gap: 16,
  },
  infoContainer: { flex: 1 },
  usernameLabel: { fontSize: 18, fontWeight: '700' },
  verifiedSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionName: { fontSize: 16, fontWeight: '600' },
});