import { useEffect } from 'react';
import { Tabs } from 'expo-router'; 
import { useFonts } from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { HindSiliguri_400Regular, HindSiliguri_700Bold } from '@expo-google-fonts/hind-siliguri';

import { Audio } from 'expo-av';

import PushNotification from '../components/PushNotification';
import Autoupdate from '../components/Autoupdate';

// 🚀 ম্যাজিক ইমপোর্টস (Background Handling)
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance } from '@notifee/react-native';

// 🚀 ১. গ্লোবাল ব্যাকগ্রাউন্ড টাস্ক ডিফাইন (অ্যাপ বন্ধ থাকলেও কাজ করবে)
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (data && data.notification) {
    // ডাটা-অনলি পেলোড এক্সট্র্যাক্ট করা হচ্ছে
    const payload = data.notification.data || data.notification.request?.content?.data;
    
    if (payload && payload.isSilentPush) {
      // Notifee এর নতুন হাই-প্রায়োরিটি চ্যানেল ক্রিয়েট
      const channelId = await notifee.createChannel({
        id: 'squad_heads_up_final',
        name: 'Study Squad Alerts',
        vibration: true,
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      // Notifee দিয়ে পপ-আপ করে দেখানো
      await notifee.displayNotification({
        title: payload.title,
        body: payload.body,
        data: payload,
        android: {
          channelId,
          largeIcon: payload.senderAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          circularLargeIcon: true,
          pressAction: { id: 'default' },
        },
      });
    }
  }
});

// 🚀 ২. টাস্কটিকে এক্সপো-তে রেজিস্টার করা
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

// 🚀 ৩. Notifee এর ম্যান্ডেটরি ব্যাকগ্রাউন্ড ইভেন্ট (ওয়ার্নিং রিমুভ করার জন্য)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // অ্যাপ কিলড থাকা অবস্থায় নোটিফিকেশনে ক্লিক করলে এখানে ফায়ার হবে
});

ExpoSplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({
    ...FontAwesome5.font,
    'BanglaRegular': HindSiliguri_400Regular,
    'BanglaBold': HindSiliguri_700Bold,
    'PoppinsRegular': Poppins_400Regular,
    'PoppinsBold': Poppins_700Bold,
  });

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.log("Audio mode setup error:", e);
      }
    };
    setupAudio();
  }, [loaded, error]);

  if (!loaded) {
    return null;
  }

  return (
    <View className="flex-1 bg-white">
      <Autoupdate />
      <PushNotification />
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Tabs 
        screenOptions={{ 
          headerShown: false, 
          sceneContainerStyle: { backgroundColor: '#FFFFFF' },
          tabBarStyle: { display: 'none' } 
        }} 
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="tournament" />
        <Tabs.Screen name="study" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="reader" options={{ href: null }} />
      </Tabs>
    </View>
  );
}