import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ExpoPushToken = string | null;

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,    
    shouldPlaySound: false,   
    shouldSetBadge: false,
    shouldShowBanner: true,  
    shouldShowList: true, 
  }),
});

export async function registerForPushNotificationsAsync(): Promise<ExpoPushToken> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (existing.status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notifications permission not granted.');
      return null;
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync();
    const token = tokenResult.data;
    console.log('Expo Push Token:', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('registerForPushNotificationsAsync error', error);
    return null;
  }
}
