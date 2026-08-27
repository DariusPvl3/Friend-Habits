import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

interface HabitCardProps {
  title: string;
  category: string;
  streak: number;
  todayStatus?: 'completed' | 'skipped' | 'failed';
  onCardPress?: () => void;
  onCheckInPress?: () => void;
  isReadOnly?: boolean;
}

export default function HabitCard({
  title,
  category,
  streak,
  todayStatus,
  onCardPress,
  onCheckInPress,
  isReadOnly = false
}: HabitCardProps) {
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const circleStyles = {
    completed: { backgroundColor: currentColors.statusCompleted || '#34D399', borderColor: currentColors.statusCompleted || '#34D399' },
    skipped:   { backgroundColor: currentColors.statusSkipped || '#64748B', borderColor: currentColors.statusSkipped || '#64748B' },
    failed:    { backgroundColor: currentColors.statusFailed || '#EF4444', borderColor: currentColors.statusFailed || '#EF4444' },
    undefined: { backgroundColor: 'transparent', borderColor: currentColors.tint }
  };

  const iconContent = { completed: '✓', skipped: '—', failed: '✕', undefined: '' };

  return (
    <TouchableOpacity 
      style={[styles.habitCard, { backgroundColor: currentColors.cardBackground }]}
      onPress={onCardPress}
      activeOpacity={isReadOnly ? 1 : 0.7}
      disabled={isReadOnly || !onCardPress}
    >
      <View style={styles.infoContainer}>
        <Text style={[styles.habitTitle, { color: currentColors.text }]} numberOfLines={1}>
          {title || 'Untitled Habit'}
        </Text>
        <Text style={styles.habitCategory} numberOfLines={1}>
          {category || 'No Category'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.checkInCircle, circleStyles[todayStatus || 'undefined']]} 
        onPress={onCheckInPress}
        activeOpacity={isReadOnly ? 1 : 0.6}
        disabled={isReadOnly || !onCheckInPress}
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
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoContainer: { 
    flex: 1, 
    marginRight: 12
  },
  habitTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  habitCategory: { fontSize: 14, color: '#94A3B8' },
  badge: { width: 58, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  checkInCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
});