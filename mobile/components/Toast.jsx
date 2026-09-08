import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useShop } from '../context/ShopContext';
import { Colors } from '../constants/colors';

const TOAST_COLORS = {
  success: { bg: Colors.emerald600, text: '#ffffff', icon: '✓' },
  error:   { bg: Colors.rose500,    text: '#ffffff', icon: '✕' },
  warning: { bg: Colors.amber400,   text: Colors.slate900, icon: '⚠' },
  info:    { bg: Colors.slate700,   text: '#ffffff', icon: 'ℹ' },
};

export default function Toast() {
  const { toast } = useShop();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [toast]);

  if (!toast) return null;

  const config = TOAST_COLORS[toast.type] || TOAST_COLORS.success;

  return (
    <Animated.View style={[s.container, { backgroundColor: config.bg, transform: [{ translateY }], opacity }]}>
      <Text style={[s.icon, { color: config.text }]}>{config.icon}</Text>
      <Text style={[s.message, { color: config.text }]} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    zIndex: 9999,
  },
  icon: { fontSize: 16, fontWeight: '900' },
  message: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
});
