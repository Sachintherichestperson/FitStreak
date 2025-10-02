import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch('http://192.168.29.104:3000/validate-token', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        await AsyncStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkAuthState();

    const interval = setInterval(checkAuthState, 10000); // Changed to 10 seconds (more reasonable)
    return () => clearInterval(interval);
  }, []);

  if (!loaded || isLoggedIn === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        screenOptions={{ headerShown: false }} 
        initialRouteName={isLoggedIn ? '(tabs)' : 'Register'}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="Profile" />
        <Stack.Screen name="Scanner" />
        <Stack.Screen name="Notification" />
        <Stack.Screen name="Register" />
        <Stack.Screen name="Cart" />
        <Stack.Screen name="Challenge-detail" />
        <Stack.Screen name="Workout" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}