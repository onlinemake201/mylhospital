import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text` as const]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#E5E5EA',
  },
  success: {
    backgroundColor: '#D1F4E0',
  },
  warning: {
    backgroundColor: '#FFF4E5',
  },
  danger: {
    backgroundColor: '#FFE5E5',
  },
  info: {
    backgroundColor: '#E5F3FF',
  },
  text: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  defaultText: {
    color: '#3C3C43',
  },
  successText: {
    color: '#34C759',
  },
  warningText: {
    color: '#FF9500',
  },
  dangerText: {
    color: '#FF3B30',
  },
  infoText: {
    color: '#007AFF',
  },
});
