import React, { useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/context/auth';
import { auth } from '../../config/firebase'; 
import Colors from '../../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import CustomButton from '@/components/CustomButton';
import { useAppTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    sectionTitle: "Profile & Progress",
    items: [
      { id: "stats", title: "Global Statistics", icon: "bar-chart-outline", targetRoute: "/statistics" },
    ],
  },
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
  const [imgUri, setImgUri] = React.useState(user?.photoURL);
  const [displayName, setDisplayName] = React.useState(user?.displayName);

  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  useFocusEffect(
    useCallback(() => {
      const refreshUserCache = async () => {
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
            setImgUri(auth.currentUser.photoURL);
            setDisplayName(auth.currentUser.displayName);
          } catch (err) {
            console.error("Failed to sync account screen tokens:", err);
          }
        }
      };
      refreshUserCache();
    }, [])
  );

  const handleSettingPress = (settingTitle: string, settingRoute: string) => {
    router.push({
      pathname: settingRoute as any,
      params: { title: settingTitle }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out user account session:", error);
    }
  };

  return (
    <SafeAreaView style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      <ScrollView style={defaultStyles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={[defaultStyles.headerTitle, { color: currentColors.title }]}>My Account</Text>
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F1F5F9' }]} 
          onPress={() => router.push({ 
            pathname: '/profile-editor', 
            params: { mode: 'edit' } 
          })}
        >
          {imgUri ? (
            <Image 
              source={{ uri: imgUri }} 
              style={[defaultStyles.avatarMedium, defaultStyles.avatarBordered]} 
            />
          ) : (
            <View style={[
              defaultStyles.avatarMedium, 
              defaultStyles.avatarBordered, 
              defaultStyles.avatarPlaceholder, 
              { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E2E8F0' }
            ]}>
              <MaterialCommunityIcons name="account" size={24} color="#94A3B8" />
            </View>
          )}
          <View>
            <Text style={[styles.usernameLabel, { color: currentColors.text }]}>{displayName || 'Guest User'}</Text>
            <Text style={styles.verifiedSubtext}>View & Edit Details</Text>
          </View>
          <View style={{ flex: 1 }} />
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color="#94A3B8" 
            style={{ marginRight: 4 }}
          />
        </TouchableOpacity>

        {/* Loop through the sections array */}
        {SETTINGS_SECTIONS.map((section) => (
          <React.Fragment key={section.sectionTitle}>
            
            <Text style={[styles.sectionHeaderTitle, { color: '#94A3B8' }]}>
              {section.sectionTitle}
            </Text>

            {section.items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.sectionCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
                onPress={() => handleSettingPress(item.title, item.targetRoute)}
                activeOpacity={0.7}
              >
                <View style={styles.infoContainer}>
                  <Text style={[styles.sectionName, { color: currentColors.text }]}>
                    {item.title}
                  </Text>
                </View>
                
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color="#94A3B8" 
                  style={{ marginRight: 4 }}
                />
              </TouchableOpacity>
            ))}
            
          </React.Fragment>
        ))}

        <View style={{ marginTop: 24 }}>
          <CustomButton text="Log Out Account" variant="danger" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    gap: 16
  },
  usernameLabel: {
    fontSize: 18,
    fontWeight: '700'
  },
  verifiedSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2
  },
  sectionCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, 
  },
  infoContainer: {
    flex: 1, 
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
});