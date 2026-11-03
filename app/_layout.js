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
import NotificationDebugger, { logBackgroundEvent } from '../components/NotificationDebugger';

import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance, AndroidVisibility, AndroidStyle, EventType } from '@notifee/react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { DeviceEventEmitter, AppState } from 'react-native';
import { useRef } from 'react'; // 🚀 useRef ইমপোর্ট করা হলো
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;

  // 🚀 ফিক্স: Android-এ Killed অবস্থায় data-only payload-এর স্ট্রাকচার ভিন্ন হতে পারে
  const notificationData = data?.notification || data;
  if (notificationData) {
    const rawPayload = notificationData.data || notificationData.request?.content?.data || notificationData.request?.trigger?.remoteMessage?.data;
    
    if (rawPayload) {
      let finalTitle = rawPayload.title || rawPayload.userName || 'স্টাডি স্কোয়াড';
      let finalBody = rawPayload.body || rawPayload.text || 'কমিউনিটিতে নতুন মেসেজ এসেছে!';
      let finalAvatar = rawPayload.senderAvatar || rawPayload.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
      let finalData = rawPayload;

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
        importance: AndroidImportance.HIGH, 
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
      });

      await logBackgroundEvent('3. Triggering Notifee Display', { title: finalTitle });

      await notifee.displayNotification({
        title: finalTitle,
        body: finalBody,
        data: finalData,
      android: {
          channelId,
          importance: AndroidImportance.HIGH,
          smallIcon: 'notification_icon', // 🚀 ছোট আইকন যুক্ত করা হলো
          color: '#1899D6', // 🚀 ব্র্যান্ড কালার
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

// 🚀 ফিক্স: অ্যাপ শুরুতেই একবার চ্যানেল ক্রিয়েট করে নেওয়া (নাহলে নোটিফিকেশন মিস হতে পারে)
notifee.createChannel({ 
  id: NEW_CHANNEL_ID, 
  name: 'Squad VIP Alerts', 
  importance: AndroidImportance.HIGH,
  visibility: AndroidVisibility.PUBLIC, 
  vibration: true, 
  vibrationPattern: [300, 500], 
  sound: 'default' 
}).catch(() => {});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail.notification?.data) {
    await AsyncStorage.setItem('@pending_notification', JSON.stringify(detail.notification.data));
    DeviceEventEmitter.emit('PENDING_NOTIFICATION_READY'); // 🚀 ফিক্স: ইভেন্ট ট্রিগার
  }
});

ExpoSplashScreen.preventAutoHideAsync();

export default function Layout() {
  const router = useRouter();

  // 🚀 ফিক্স: useFonts সবার উপরে নিয়ে আসা হলো
  const [loaded, error] = useFonts({
    ...FontAwesome5.font,
    'BanglaRegular': HindSiliguri_400Regular,
    'BanglaBold': HindSiliguri_700Bold,
    'PoppinsRegular': Poppins_400Regular,
    'PoppinsBold': Poppins_700Bold,
  });

  const rootNav = useRootNavigationState();
  const coldBootDone = useRef(false);
  const lastHandled = useRef({ key: '', at: 0 });

  const executeNotificationRouting = async (rawData) => {
    if (!rawData) return;
    
    // 🚀 dedupe ref দিয়ে চেক করা (variable রেন্ডারে রিসেট হয়ে যায়)
    const key = JSON.stringify(rawData);
    if (lastHandled.current.key === key && Date.now() - lastHandled.current.at < 3000) return;
    lastHandled.current = { key, at: Date.now() };

    let data = { ...rawData };
    if (data.body && typeof data.body === 'string' && data.body.startsWith('{')) {
      try { data = { ...data, ...JSON.parse(data.body) }; } catch (e) {}
    }

    const uniqueParam = { t: String(Date.now()) }; // 🚀 রিফ্রেশ ফোর্স করার জন্য

    if (data.type === 'friend_request' || data.type === 'friend_request_accepted') {
      await AsyncStorage.setItem('@pending_profile_action', data.type);
      router.replace({ pathname: '/profile', params: uniqueParam });
      return;
    }

    if (data.guideId || data.channelId) {
      const targetId = data.guideId || data.channelId;
      
     // 🚀 সার্ভার টাইপ দিয়ে ডিরেক্ট রাউটিং
      if (data.type === 'reader') {
        try {
          let response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
            body: JSON.stringify({ action: 'import_guide', code: targetId })
          });
          let result = await response.json();
          if (result.success && result.guide) {
            // 🚀 FIX 1: বোরিং reader.js পেইজের বদলে আসল community.js-এ পাঠাচ্ছি
            // এবং autoOpenReader=true সিগন্যাল দিয়ে দিচ্ছি
            const guideToOpen = { ...result.guide, isFromExplore: true, autoOpenReader: true };
            await AsyncStorage.setItem('@temp_community_data', JSON.stringify(guideToOpen));
            router.replace({ pathname: '/community', params: uniqueParam });
            
            // 🚀 UI লোড হওয়ার পর SmartReaderEngine ওপেন করার ইভেন্ট ফায়ার করা
            setTimeout(() => {
              DeviceEventEmitter.emit('auto_open_smart_reader', guideToOpen);
            }, 600);
            return;
          }
        } catch (error) { console.log("Reader Open Error:", error); }
      }
      
      // community টাইপ হলে বা reader ফেইল করলে
      try {
        let response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'import_community', code: targetId })
        });
        let result = await response.json();
        if (result.success && result.community) {
          await AsyncStorage.setItem('@temp_community_data', JSON.stringify({ ...result.community, isFromExplore: true }));
          router.replace({ pathname: '/community', params: uniqueParam });
          if (String(data.openDiscussion) === 'true') {
            setTimeout(() => DeviceEventEmitter.emit('open_discussion_modal'), 800);
          }
        }
      } catch (error) { console.log("Community Open Error:", error); }
    }
  };

  const consumePending = async () => {
    const raw = await AsyncStorage.getItem('@pending_notification');
    if (!raw) return;
    await AsyncStorage.removeItem('@pending_notification'); // 🚀 আগে রিমুভ, তারপর রাউটিং
    executeNotificationRouting(JSON.parse(raw));
  };

  // 🚀 লিসেনার শুধুমাত্র একবার রেজিস্টার হবে
  useEffect(() => { 
    const s1 = AppState.addEventListener('change', s => { if (s === 'active') setTimeout(consumePending, 300); });
    const s2 = DeviceEventEmitter.addListener('HANDLE_NOTIFICATION_ROUTING', executeNotificationRouting);
    const s3 = DeviceEventEmitter.addListener('PENDING_NOTIFICATION_READY', consumePending);
    return () => { s1.remove(); s2.remove(); s3.remove(); };
  }, []);

  // 🚀 কোল্ড বুট (ফন্ট + ন্যাভিগেটর রেডি হলে)
  useEffect(() => { 
    if ((!loaded && !error) || !rootNav?.key || coldBootDone.current) return;
    coldBootDone.current = true;
    (async () => {
      try {
        const initial = await notifee.getInitialNotification();
        await consumePending();
        if (initial?.notification?.data) executeNotificationRouting(initial.notification.data);
      } finally { ExpoSplashScreen.hideAsync().catch(() => {}); }
    })();
  }, [loaded, error, rootNav?.key]);

 

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

// 🚀 ফিক্স: ফন্ট লোড ফেইল করলেও অ্যাপ যেন আটকে না থাকে
  if (!loaded && !error) {
    return null;
  }

  return (
    <View className="flex-1 bg-white">
      <NotificationDebugger />
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
        <Tabs.Screen name="community" options={{ href: null }} />
      </Tabs>
    </View>
  );
}