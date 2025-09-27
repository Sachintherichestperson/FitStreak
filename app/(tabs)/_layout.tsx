import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          }}
        />
      <Tabs.Screen
        name="Challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Shop"
        options={{
          title: 'Store',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Badges"
        options={{
          title: 'Badges',
          tabBarIcon: ({ color }) => <FontAwesome name="trophy" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
