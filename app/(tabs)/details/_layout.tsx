import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconInactive,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
          ...(Platform.OS === 'ios'
            ? {
                position: 'absolute',
              }
            : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Balance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size ?? 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size ?? 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
