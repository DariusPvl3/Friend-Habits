import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentColors.tint,
        tabBarInactiveTintColor: currentColors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: currentColors.cardBackground, 
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false, 
      }}  
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'home' : 'home-outline'} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'checkbox-marked-circle' : 'checkbox-marked-circle-outline'} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'account-group' : 'account-group-outline'} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'account-circle' : 'account-circle-outline'} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
