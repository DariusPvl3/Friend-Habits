import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

interface HabitCardProps {
  title: string;
  category: string;
  streak: number;
  todayStatus: 'completed' | 'skipped' | 'failed' | undefined;
  onCardPress: () => void;
  onCheckInPress: () => void;
}

export default function HabitCard({
  title,
  category,
  streak,
  todayStatus,
  onCardPress,
  onCheckInPress
}: HabitCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  const circleStyles = {
    completed: { backgroundColor: '#34D399', borderColor: '#34D399' },
    skipped:   { backgroundColor: '#64748B', borderColor: '#64748B' },
    failed:    { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    undefined: { backgroundColor: 'transparent', borderColor: currentColors.tint }
  };

  const iconContent = { completed: '✓', skipped: '—', failed: '✕', undefined: '' };

  return (
    <TouchableOpacity 
      style={[styles.habitCard, { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }]}
      onPress={onCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.infoContainer}>
        <Text style={[styles.habitTitle, { color: currentColors.text }]}>{title}</Text>
        <Text style={styles.habitCategory}>{category}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.checkInCircle, circleStyles[todayStatus || 'undefined']]} 
        onPress={onCheckInPress}
        activeOpacity={0.6}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
          {iconContent[todayStatus || 'undefined']}
        </Text>
      </TouchableOpacity>

      <View style={[styles.badge, { backgroundColor: streak >= 3 ? currentColors.streakBg : currentColors.badge }]}>
        <Text style={[styles.badgeText, { color: streak >= 3 ? '#FF6B35' : currentColors.text }]}>
          {streak >= 3 ? `🔥 ${streak}` : streak}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  habitCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  infoContainer: { flex: 1 },
  habitTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  habitCategory: { fontSize: 14, color: '#94A3B8' },
  badge: { width: 58, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  checkInCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
});