import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  console.log(finalStatus);

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token!');
    return;
  }

  try {
  const tokenData = await Notifications.getExpoPushTokenAsync();
  console.log('Expo Push Token:', tokenData.data);
  return tokenData.data;
} catch (error) {
  console.error('Error getting Expo Push Token:', error);
}

}
