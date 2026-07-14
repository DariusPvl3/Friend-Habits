import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

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
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const circleStyles = {
    completed: { backgroundColor: currentColors.statusCompleted, borderColor: currentColors.statusCompleted },
    skipped:   { backgroundColor: currentColors.statusSkipped, borderColor: currentColors.statusSkipped },
    failed:    { backgroundColor: currentColors.statusFailed, borderColor: currentColors.statusFailed },
    undefined: { backgroundColor: 'transparent', borderColor: currentColors.tint }
  };

  const iconContent = { completed: '✓', skipped: '—', failed: '✕', undefined: '' };

  return (
    <TouchableOpacity 
      style={[styles.habitCard, { backgroundColor: currentColors.cardBackground }]}
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
  habitCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoContainer: { flex: 1 },
  habitTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  habitCategory: { fontSize: 14, color: '#94A3B8' },
  badge: { width: 58, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  checkInCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
});