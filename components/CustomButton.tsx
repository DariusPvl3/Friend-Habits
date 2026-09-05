import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import Colors from '../constants/Colors';
import { useAppTheme } from '@/context/ThemeContext';

interface CustomButtonProps {
  text: string;
  onPress: (event?: GestureResponderEvent) => void;
  variant?: 'tint' | 'success' | 'danger' | 'neutral' | 'outline';
  style?: StyleProp<ViewStyle>;
  size?: 'small' | 'standard';
  disabled?: boolean;
}

export default function CustomButton({
  text,
  onPress,
  variant = 'tint',
  style,
  size = 'standard',
  disabled = false,
}: CustomButtonProps) {
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];
  const lastPressTime = useRef(0);

  const handlePress = (e: GestureResponderEvent) => {
    const now = Date.now();
    if (now - lastPressTime.current < 750) {
      return;
    }
    lastPressTime.current = now;
    if (onPress && !disabled) {
      onPress(e);
    }
  };

  // Dynamic Variant Styles Mapping Matrix
  const variantStyles = {
    tint:    { backgroundColor: currentColors.tint, borderColor: 'transparent' },
    success: { backgroundColor: '#34D399', borderColor: 'transparent' },
    danger:  { backgroundColor: '#EF4444', borderColor: 'transparent' },
    neutral: { backgroundColor: '#64748B', borderColor: 'transparent' },
    outline: { backgroundColor: 'transparent', borderColor: '#94A3B8', borderWidth: 1 },
  };

  // Dynamic Text Colors Mapping Matrix
  const textColors = {
    tint:    '#FFFFFF',
    success: '#FFFFFF',
    danger:  '#FFFFFF',
    neutral: '#FFFFFF',
    outline: colorScheme === 'dark' ? '#94A3B8' : '#475569',
  };

  // Dynamic Size Scales Mapping Matrix
  const sizeStyles = {
    standard: { height: 52, borderRadius: 14, width: '100%', paddingHorizontal: 16 },
    small:    { height: 36, borderRadius: 12, paddingHorizontal: 16 },
  };

  const textSizeStyles = {
    standard: { fontSize: 16, fontWeight: 'bold' as const },
    small:    { fontSize: 14, fontWeight: '700' as const },
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.baseButton,
        sizeStyles[size],
        variantStyles[variant],
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[textSizeStyles[size], { color: textColors[variant] }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});