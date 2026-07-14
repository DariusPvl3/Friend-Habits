import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import CustomButton from '@/components/CustomButton';

export default function ThemeSettingsScreen() {
  const { theme, toggleTheme } = useAppTheme();
  const currentColors = Colors[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: currentColors.text }]}>Theme Settings</Text>
        <Text style={styles.subtitle}>
          Current Mode: <Text style={{ fontWeight: 'bold', color: currentColors.tint }}>{theme.toUpperCase()}</Text>
        </Text>

        <View style={styles.card}>
          <Text style={{ color: currentColors.text, marginBottom: 16, fontSize: 16, textAlign: 'center' }}>
            Quickly test live layout contrast parities across your components instantly:
          </Text>
          
          <CustomButton 
            text={theme === 'light' ? "🌙 Switch to Dark Mode" : "☀️ Switch to Light Mode"} 
            variant="tint" 
            onPress={toggleTheme} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94A3B8', marginBottom: 32, textAlign: 'center' },
  card: { padding: 24, borderRadius: 20, backgroundColor: 'rgba(148, 163, 184, 0.08)' }
});