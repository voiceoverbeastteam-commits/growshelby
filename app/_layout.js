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
import { useRouter } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (data && data.notification) {
    
    // 🚀 ম্যাজিক ট্রিক: Expo-এর ডিফল্ট নোটিফিকেশনটি সাথে সাথে রিমুভ করে Notifee-কে জায়গা ছেড়ে দেওয়া
    try {
      const expoNotifId = data.notification?.request?.identifier || data.notification?.messageId;
      if (expoNotifId) {
        await Notifications.dismissNotificationAsync(expoNotifId);
      }
    } catch (e) {
      console.log("Expo Notification Clear Error:", e);
    }

    const rawPayload = data.notification.data || data.notification.request?.content?.data;
    
    if (rawPayload) {
      // 🚀 ম্যাজিক পার্সার: Android/Expo বাগ ফিক্স (JSON String ব্রেকডাউন)
      let finalTitle = rawPayload.title || rawPayload.userName || 'স্টাডি স্কোয়াড';
      let finalBody = rawPayload.body || rawPayload.text || 'কমিউনিটিতে নতুন মেসেজ এসেছে!';
      let finalAvatar = rawPayload.senderAvatar || rawPayload.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
      let finalData = rawPayload;

      // Expo ভুল করে পুরো ডেটাটাকে JSON String হিসেবে 'body' তে ঢুকিয়ে দিলে, সেটা ডিকোড করবো
      if (rawPayload.body && typeof rawPayload.body === 'string' && rawPayload.body.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawPayload.body);
          finalTitle = parsed.title || finalTitle;
          finalBody = parsed.body || parsed.text || 'কমিউনিটিতে নতুন মেসেজ এসেছে!';
          finalAvatar = parsed.senderAvatar || parsed.userAvatar || finalAvatar;
          finalData = { ...rawPayload, ...parsed };
        } catch (e) {}
      }

      const channelId = await notifee.createChannel({
        id: NEW_CHANNEL_ID,
        name: 'Squad VIP Alerts',
        vibration: true,
        vibrationPattern: [300, 500],
        importance: AndroidImportance.HIGH, // 🟢 Force Heads-up Display
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
      });

      // 🚀 Notifee দিয়ে ফ্রেশ ও ক্লিন পপআপ
      await notifee.displayNotification({
        title: finalTitle,
        body: finalBody,
        data: finalData,
        android: {
          channelId,
          importance: AndroidImportance.HIGH, 
          largeIcon: finalAvatar,
          circularLargeIcon: true,
          pressAction: { id: 'default', launchActivity: 'default' },
          style: { type: AndroidStyle.BIGTEXT, text: finalBody }
        },
      });
    }
  }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

// 🚀 Notifee Background Event Handler (ম্যান্ডেটরি, না হলে অ্যাপ ক্র্যাশ বা ওয়ার্নিং দেয়)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // type 1 মানে ব্যবহারকারী নোটিফিকেশনে ক্লিক করেছে
  if (type === 1) {
    const rawData = detail.notification?.data || { error: 'no_data_found' };
    
    // ডিবাগিং ট্র্যাকার সেভ করা হচ্ছে
    await AsyncStorage.setItem('@debug_bg_click', 'YES - Clicked!');
    await AsyncStorage.setItem('@debug_bg_data', JSON.stringify(rawData));
    
    // আসল রিডাইরেক্ট ডেটা
    if (detail.notification?.data) {
      await AsyncStorage.setItem('@killed_app_notification', JSON.stringify(detail.notification.data));
    }
  }
});

ExpoSplashScreen.preventAutoHideAsync();

export default function Layout() {
  const router = useRouter();

  // 🚀 মেইন নেভিগেশন লজিক (টেলিগ্রাম স্টাইল রুট ইন্টারসেপশন)
  const executeNotificationRouting = async (rawData) => {
    if (!rawData) return;
    let data = { ...rawData };
    
    if (data.body && typeof data.body === 'string' && data.body.startsWith('{')) {
      try { data = { ...data, ...JSON.parse(data.body) }; } catch (e) {}
    }

    if (data.type === 'friend_request' || data.type === 'friend_request_accepted') {
      await AsyncStorage.setItem('@pending_profile_action', data.type);
      router.replace('/profile');
      return;
    }

    if (data.guideId || data.channelId) {
      const targetId = data.guideId || data.channelId;
      try {
        let response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'import_guide', code: targetId })
        });
        let result = await response.json();

        if (result.success && result.guide) {
          await AsyncStorage.setItem('@temp_reader_guide', JSON.stringify(result.guide));
          router.replace('/reader');
          if (data.title && (data.title.includes('নতুন নোটিস') || data.title.includes('রিপ্লাই'))) {
            setTimeout(() => DeviceEventEmitter.emit('open_discussion_modal'), 800);
          }
          return;
        }

        response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'import_community', code: targetId })
        });
        result = await response.json();

        if (result.success && result.community) {
          await AsyncStorage.setItem('@temp_community_data', JSON.stringify({ ...result.community, isFromExplore: true }));
          router.replace('/community');
          if (data.title && (data.title.includes('নতুন নোটিস') || data.title.includes('রিপ্লাই'))) {
            setTimeout(() => DeviceEventEmitter.emit('open_discussion_modal'), 800);
          }
        }
      } catch (error) {
        console.log("Error opening notification guide/community:", error);
      }
    }
  };

  // 🚀 ইনিশিয়াল চেক (কোল্ড বুট)
  useEffect(() => {
    const handleColdBoot = async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification && initialNotification.notification.data) {
        await executeNotificationRouting(initialNotification.notification.data);
      }
      // 🚀 নেভিগেশন শেষ হলে বা নোটিফিকেশন না থাকলে স্প্ল্যাশ হাইড করবে
      ExpoSplashScreen.hideAsync().catch(() => {});
    };

    handleColdBoot();

    // 🚀 ফোরগ্রাউন্ডে থাকা অবস্থায় নোটিফিকেশনে ক্লিক করলে রাউটিং করবে
    const routingSub = DeviceEventEmitter.addListener('HANDLE_NOTIFICATION_ROUTING', executeNotificationRouting);
    return () => routingSub.remove();
  }, []);

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