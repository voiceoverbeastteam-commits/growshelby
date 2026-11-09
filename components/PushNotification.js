import { useState, useEffect, useRef } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, DeviceEventEmitter, AppState } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType, AndroidVisibility, AndroidStyle } from '@notifee/react-native';
import { useRouter, useRootNavigationState } from 'expo-router';



// 🚀 FIX 2: Expo-র ডিফল্ট পপআপ বন্ধ করা হলো যাতে ডাবল নোটিফিকেশন না আসে
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false, 
    shouldSetBadge: false,
  }),
});

export const NEW_CHANNEL_ID = 'study_squad_heads_up_v1';

export default function PushNotification({ onNotificationClick }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef();

  // 🚀 100% Guaranteed Routing - এর জন্য স্টেট
  const [isAppReady, setIsAppReady] = useState(false);
  const [pendingInitialData, setPendingInitialData] = useState(null);
  const hasHandledInitial = useRef(false);

 const handleNotificationTap = (rawData) => {
    if (rawData) {
      DeviceEventEmitter.emit('HANDLE_NOTIFICATION_ROUTING', rawData);
    }
  };

  // 🚀 FIX: Use Expo's hook to catch Killed-State notifications properly
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef(null);

  useEffect(() => {
    const readySub = DeviceEventEmitter.addListener('APP_IS_READY_FOR_NAVIGATION', () => {
      setIsAppReady(true);
    });
    return () => readySub.remove();
  }, []);

  useEffect(() => {
    if (!lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    
    // Prevent handling the same notification twice
    if (handledId.current === id) return;
    handledId.current = id;
    
    const data = lastResponse.notification.request.content.data || 
                 lastResponse.notification.request.trigger?.remoteMessage?.data;
                 
    if (data) {
      setPendingInitialData(data);
    }
  }, [lastResponse]);

 // 🚀 ২. যখন অ্যাপ রেডি এবং ডেটা হাতে থাকবে - ঠিক তখনই রিডাইরেক্ট করবে (No Race Condition)
  useEffect(() => {
    if (isAppReady && pendingInitialData) {
      handleNotificationTap(pendingInitialData);
      setPendingInitialData(null); 
    }
  }, [isAppReady, pendingInitialData]);

  // 🚀 ৩. বাকি সব ইভেন্ট লিসেনার
  useEffect(() => {
    checkAndRequestPermission();

    const loginSyncSub = DeviceEventEmitter.addListener('USER_LOGGED_IN_SYNC_TOKEN', () => {
      checkAndRequestPermission();
    });

   

   notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      
      // 🚀 FIX: অ্যাপ ব্যাকগ্রাউন্ডে বা লক অবস্থায় থাকলে Notifee-কে দ্বিতীয় নোটিফিকেশন বানাতে বাধা দেওয়া হচ্ছে
      if (AppState.currentState !== 'active') {
        return; 
      }

      // 🚀 Optional Chaining দিয়ে ক্র্যাশ ফিক্স করা হলো
      const rawPayload = notification.request.trigger?.remoteMessage?.data || notification.request.content?.data;
      
      if (rawPayload) {
        if (rawPayload.guideId) {
          DeviceEventEmitter.emit('new_unread_message', rawPayload.guideId);
        }

        let finalTitle = rawPayload.title || rawPayload.userName || 'স্টাডি স্কোয়াড';
        let finalBody = rawPayload.body || rawPayload.text || 'কমিউনিটিতে নতুন আপডেট এসেছে!';
        let finalAvatar = rawPayload.senderAvatar || rawPayload.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        let finalData = rawPayload;

    if (rawPayload.body && typeof rawPayload.body === 'string' && rawPayload.body.startsWith('{')) {
          try {
            const parsed = JSON.parse(rawPayload.body);
            finalTitle = parsed.title || finalTitle;
            finalBody = parsed.body || parsed.text || 'কমিউনিটিতে নতুন আপডেট এসেছে!';
            finalAvatar = parsed.senderAvatar || parsed.userAvatar || finalAvatar;
            finalData = { ...rawPayload, ...parsed };
          } catch (e) {}
        }

        // 🚀 ম্যাজিক ফিক্স: নোটিফিকেশন মেমোরিতে সেভ করা হচ্ছে
        try {
          const existingNotifs = await AsyncStorage.getItem('@my_notifications');
          const parsedNotifs = existingNotifs ? JSON.parse(existingNotifs) : [];
          const newNotifItem = {
            id: Date.now().toString(),
            title: finalTitle,
            body: finalBody,
            avatar: finalAvatar,
            data: finalData,
            time: new Date().toISOString(),
            isRead: false
          };
          // সর্বোচ্চ ৫০টি সেভ রাখবে, যাতে অ্যাপ স্লো না হয়
          const updatedNotifs = [newNotifItem, ...parsedNotifs].slice(0, 50);
          await AsyncStorage.setItem('@my_notifications', JSON.stringify(updatedNotifs));
          
          // টপবারের লাল বাতি জ্বালানোর সিগন্যাল
          DeviceEventEmitter.emit('NEW_NOTIFICATION_RECEIVED');
        } catch(e) { console.log("Notif Save Error", e); }

        const channelId = await notifee.createChannel({
          id: NEW_CHANNEL_ID,
          name: 'Squad VIP Alerts',
          vibration: true,
          vibrationPattern: [300, 500],
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          sound: 'default',
        });

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
    });

  const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification.data;
        DeviceEventEmitter.emit('HANDLE_NOTIFICATION_ROUTING', data);
        if (data && onNotificationClick) {
          onNotificationClick(data);
        }
      }
    });

   return () => {
      loginSyncSub.remove();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      unsubscribe();
    };
  }, []);

 const checkAndRequestPermission = async () => {
    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for Push Notifications');
      return;
    }

  // 🚀 Notifee চ্যানেল হ্যান্ডেল করছে, তাই Expo-এর ডুপ্লিকেট চ্যানেল রিমুভ করা হলো

    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      generateAndSendToken();
    } else if (canAskAgain) {
      setIsModalVisible(true);
    }
  };

  const handleAllowClick = async () => {
    setIsModalVisible(false); 
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status === 'granted') {
      generateAndSendToken();
    }
  };

 const generateAndSendToken = async () => {
    try {
      console.log('⏳ Token generation shuru hocche...');

    // 🚀 Notifee চ্যানেল হ্যান্ডেল করছে, তাই Expo-এর ডুপ্লিকেট চ্যানেল রিমুভ করা হলো

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      console.log('🔍 Project ID Pawa Geche:', projectId);

      if (!projectId) {
        console.log('❌ Error: Project ID missing! app.json check korun.');
        return;
      }

      console.log('📡 Expo theke token anar chesta cholche...');
      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenResponse.data;
      
    console.log('✅ EXPO PUSH TOKEN:', token); // Ei line ta token print korbe
      
      setExpoPushToken(token);
      await AsyncStorage.setItem('@device_push_token', token); // 🚀 ডিভাইসের টোকেন লোকালি সেভ করা হলো
      const userEmail = await AsyncStorage.getItem('@current_user_id');
      sendTokenToBackend(token, userEmail);
      
    } catch (e) {
      console.log('❌ Token generation error (catch block):', e);
    }
  };
 const sendTokenToBackend = async (token, userEmail) => {
    if(!userEmail || userEmail === 'guest') {
      console.log('🛑 [FRONTEND DEBUG]: No Email/Guest. Token not sent.');
      return; 
    }
    
    console.log(`🟢 [FRONTEND DEBUG]: Sending Token to DB...`);
    console.log(`🟢 [FRONTEND DEBUG]: -> Email: ${userEmail}`);
    console.log(`🟢 [FRONTEND DEBUG]: -> Token: ${token}`);

    try {
      const SERVER_URL = 'https://growshelby-api.vercel.app/api/update_coins';
      const res = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY 
        },
        body: JSON.stringify({ action: 'save_push_token', token: token, email: userEmail }),
      });
      const data = await res.json();
      console.log(`🟢 [FRONTEND DEBUG]: Server Response:`, data);
    } catch (error) {
      console.log(`🔴 [FRONTEND DEBUG ERROR]:`, error);
    }
  };

  return (
    <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
      <View className="flex-1 bg-black/60 justify-center px-4">
        <View className="bg-white w-full rounded-[24px] p-6 border-b-4 border-[#E5E5E5] items-center">
          
          <View className="bg-[#E5F5FF] w-16 h-16 rounded-full items-center justify-center mb-4">
            <FontAwesome5 name="bell" size={28} color="#1CB0F6" solid />
          </View>

          <Text className="text-xl mb-2 text-[#3C3C3C] text-center" style={{ fontFamily: 'BanglaBold' }}>নোটিফিকেশন চালু করুন</Text>
          <Text className="text-[15px] mb-6 text-[#777777] text-center" style={{ fontFamily: 'BanglaRegular', lineHeight: 22 }}>
            কমিউনিটি মেম্বারদের মেসেজ এবং চ্যালেঞ্জের আপডেট সবার আগে পেতে 'এলাও' বাটনে ক্লিক করুন।
          </Text>
          
          <View className="flex-row justify-between space-x-3 w-full">
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsModalVisible(false)} className="flex-1 mx-1">
              <View style={{ backgroundColor: '#E5E5E5', borderRadius: 16, paddingBottom: 6 }}>
                <View style={{ backgroundColor: '#F0F0F0', borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                  <Text className="text-[#777777] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>পরে</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={handleAllowClick} className="flex-1 mx-1">
              <View style={{ backgroundColor: '#1899D6', borderRadius: 16, paddingBottom: 6 }}>
                <View style={{ backgroundColor: '#1CB0F6', borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                  <Text className="text-white text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>এলাও করুন</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}