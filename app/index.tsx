import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function index() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('Token');
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/Register');
      }
    };
    checkAuth();
  }, []);

  return null;
}
