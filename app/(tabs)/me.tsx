import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

// Account tab
interface SettingItem {
  id: string;
  title: string;
  icon: string; 
  targetRoute: string; // The file name it should navigate to
}

interface SettingSection {
  sectionTitle: string;
  items: SettingItem[];
}

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    sectionTitle: "Profile & Progress",
    items: [
      { id: "details", title: "My Details", icon: "person-outline", targetRoute: "/profile-details" },
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

  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // This function handles what happens when an option is clicked
  const handleSettingPress = (settingTitle: string, settingRoute: string) => {
    router.push({
      pathname: settingRoute as any,
      params: { title: settingTitle }
    });
  };

  return (
    // ScrollView allows the user to scroll vertically if the list gets long
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <Tabs.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.container}>
        <Text style={[styles.headerTitle, { color: currentColors.title }]}>My Account</Text>
        
        {/* Loop through the sections array */}
        {SETTINGS_SECTIONS.map((section) => (
          // We wrap each section bundle in a fragment key box to keep React happy
          <React.Fragment key={section.sectionTitle}>
            
            {/* 1. Render the clean Section Header Title String */}
            <Text style={[styles.sectionHeaderTitle, { color: '#94A3B8' }]}>
              {section.sectionTitle}
            </Text>

            {/* 2. Direct, unbraced inner loop to map items within this section */}
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
                
                {/* Right Side: Clean chevron arrow symbol */}
                <Text style={{ color: '#94A3B8', fontSize: 16 }}>➔</Text>
              </TouchableOpacity>
            ))}
            
          </React.Fragment>
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
  sectionCard: {
    flexDirection: 'row', // Aligns items horizontally
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
  sectionName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});