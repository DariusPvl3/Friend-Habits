import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FriendProfileScreen() {
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  // hook that grabs the parameters sent through the nav link
  const { name, progress, avatarUrl } = useLocalSearchParams<{ 
    name: string; 
    progress: string; 
    avatarUrl: string 
  }>();

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
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={[defaultStyles.avatarLarge, defaultStyles.avatarBordered]} 
            />
          ) : (
            <View style={[
              defaultStyles.avatarLarge, 
              defaultStyles.avatarBordered, 
              defaultStyles.avatarPlaceholder, 
              { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E2E8F0' }
            ]}>
              <MaterialCommunityIcons name="account" size={50} color="#94A3B8" />
            </View>
          )}
        </View>

        <Text style={[defaultStyles.title, { color: currentColors.text, textAlign: 'center' }]}>{name}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtext: {
    fontSize: 16,
    color: '#94A3B8',
  },
});