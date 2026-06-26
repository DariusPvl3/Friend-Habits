import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

interface CustomButtonProps {
  text: string;
  onPress: () => void;
  variant?: 'tint' | 'success' | 'danger' | 'neutral' | 'outline';
  size?: 'small' | 'standard';
  disabled?: boolean;
}

export default function CustomButton({ 
  text, 
  onPress, 
  variant = 'tint', 
  size = 'standard', 
  disabled = false 
}: CustomButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // Dynamic Variant Styles Mapping Matrix
  const variantStyles = {
    tint:    { backgroundColor: currentColors.tint, borderColor: 'transparent' },
    success: { backgroundColor: '#34D399', borderColor: 'transparent' },
    danger:  { backgroundColor: '#EF4444', borderColor: 'transparent' },
    neutral: { backgroundColor: '#64748B', borderColor: 'transparent' },
    outline: { backgroundColor: 'transparent', borderColor: '#94A3B8', borderWidth: 1 }
  };

  // Dynamic Text Colors Mapping Matrix
  const textColors = {
    tint:    '#FFFFFF',
    success: '#FFFFFF',
    danger:  '#FFFFFF',
    neutral: '#FFFFFF',
    outline: colorScheme === 'dark' ? '#94A3B8' : '#475569'
  };

  // Dynamic Size Scales Mapping Matrix
  const sizeStyles = {
    standard: { height: 52, borderRadius: 14, width: '100%', paddingHorizontal: 16 },
    small:    { height: 36, borderRadius: 12, paddingHorizontal: 16 }
  };

  const textSizeStyles = {
    standard: { fontSize: 16, fontWeight: 'bold' as const },
    small:    { fontSize: 14, fontWeight: '700' as const }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.baseButton,
        sizeStyles[size],
        variantStyles[variant],
        disabled && { opacity: 0.4 } // Fades button layout out if disabled
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