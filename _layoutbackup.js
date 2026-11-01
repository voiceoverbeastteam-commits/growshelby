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

import PushNotification, { NEW_CHANNEL_ID } from '../components/PushNotification';
import Autoupdate from '../components/Autoupdate';

import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance, AndroidVisibility, AndroidStyle } from '@notifee/react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// 🚀 FIX 3: অ্যাপ কিলড/ব্যাকগ্রাউন্ড থাকা অবস্থায় 100% গ্যারান্টিড পপআপ
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (data && data.notification) {
    const payload = data.notification.data || data.notification.request?.content?.data;
    
    // 🟢 আগের সেই isSilentPush ভুলের ফাঁদ সরিয়ে দিয়েছি। এখন ডাটা থাকলেই পপআপ হবে!
    if (payload) {
      // Background এ Channel ID তৈরি করে নিচ্ছি যেন কোনো রিস্ক না থাকে
      const channelId = await notifee.createChannel({
        id: NEW_CHANNEL_ID,
        name: 'Squad VIP Alerts',
        vibration: true,
        vibrationPattern: [300, 500],
        importance: AndroidImportance.HIGH, // 🟢 Force Heads-up Display
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
      });

      // 🚀 Notifee দিয়ে হাই প্রায়োরিটি পপআপ
      await notifee.displayNotification({
        title: payload.title || payload.userName || 'স্টাডি স্কোয়াড',
        body: payload.body || payload.text || 'কমিউনিটিতে নতুন মেসেজ এসেছে!',
        data: payload,
        android: {
          channelId,
          importance: AndroidImportance.HIGH, 
          largeIcon: payload.senderAvatar || payload.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          circularLargeIcon: true,
          pressAction: { 
             id: 'default',
             launchActivity: 'default' 
          },
          style: {
             type: AndroidStyle.BIGTEXT,
             text: payload.body || payload.text || 'কমিউনিটিতে নতুন মেসেজ এসেছে!'
          }
        },
      });
    }
  }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

// 🚀 Notifee Background Event Handler (ম্যান্ডেটরি, না হলে অ্যাপ ক্র্যাশ বা ওয়ার্নিং দেয়)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // ব্যবহারকারী নোটিফিকেশনে ক্লিক করলে ডাটা ক্যাশ করে রাখতে পারেন
  // তবে রাউটিং ফ্রন্টএন্ড ওপেন হওয়ার পর getInitialNotification() হ্যান্ডেল করবে।
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