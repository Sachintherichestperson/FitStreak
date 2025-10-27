import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const router = useRouter();
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

      const response = await fetch('https://backend-hbwp.onrender.com/validate-token', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        await AsyncStorage.removeItem('Token');
        
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.removeItem('Token');
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkAuthState();

    // If you really want auto-expire checking, keep interval (but 10s is aggressive)
    const interval = setInterval(checkAuthState, 10000);
    return () => clearInterval(interval);
  }, []);


  if (!loaded || isLoggedIn === null) {
    return null; // splash screen could go here
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isLoggedIn ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="Profile" />
          <Stack.Screen name="Scanner" />
          <Stack.Screen name="Notification" />
          <Stack.Screen name="Cart" />
          <Stack.Screen name="Challenge-detail" />
          <Stack.Screen name="Workout" />
          <Stack.Screen name="fitcoin-rewards" />
          <Stack.Screen name="+not-found" />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Register" />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
