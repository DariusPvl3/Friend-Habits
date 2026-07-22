import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import CustomButton from '@/components/CustomButton';

export default function ThemeSettingsScreen() {
  const { theme, toggleTheme } = useAppTheme();
  const currentColors = Colors[theme];

  return (
    <SafeAreaView style={[defaultStyles.container, { backgroundColor: currentColors.background }]}>
      <View style={defaultStyles.content}>
        <Text style={[defaultStyles.title, { color: currentColors.text }]}>Theme Settings</Text>
        <Text style={defaultStyles.subtitle}>
          Current Mode: <Text style={{ fontWeight: 'bold', color: currentColors.tint }}>{theme.toUpperCase()}</Text>
        </Text>

        <View style={defaultStyles.card}>
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