import { useState, useEffect, useRef } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType, AndroidVisibility, AndroidStyle } from '@notifee/react-native';
import { useRouter } from 'expo-router'; 

// 🚀 FIX 1: Expo-র ডিফল্ট পপআপ বন্ধ করা হলো যাতে ডাবল নোটিফিকেশন না আসে এবং Notifee ছবিসহ পপআপ দেখাতে পারে
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, 
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 🚀 FIX 2: একদম নতুন Channel ID (যাতে অ্যান্ড্রয়েড ক্যাশ ক্লিয়ার হয়ে ফোর্স পপআপ হয়)
export const NEW_CHANNEL_ID = 'study_squad_heads_up_v1';

export default function PushNotification({ onNotificationClick }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
const notificationListener = useRef();
  const router = useRouter(); 

  const isAppReady = useRef(false);
  const pendingNotification = useRef(null);

 useEffect(() => {
    const readySub = DeviceEventEmitter.addListener('APP_READY_FOR_NAVIGATION', () => {
      isAppReady.current = true;
    if (pendingNotification.current) {
        handleNotificationTap(pendingNotification.current);
        pendingNotification.current = null;
      }
    });
    return () => readySub.remove();
  }, []);

  const handleNotificationTap = async (rawData) => {
    if (!rawData) return;
    
    let data = { ...rawData };
    
    if (data.body && typeof data.body === 'string' && data.body.startsWith('{')) {
      try {
        const parsed = JSON.parse(data.body);
        data = { ...data, ...parsed };
      } catch (e) {}
    }

    if (data.type === 'friend_request' || data.type === 'friend_request_accepted') {
      await AsyncStorage.setItem('@pending_profile_action', data.type);
      router.navigate('/profile');
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
          router.navigate('/reader');
          
          if (data.title && (data.title.includes('নতুন নোটিস') || data.title.includes('রিপ্লাই'))) {
            setTimeout(() => {
               DeviceEventEmitter.emit('open_discussion_modal');
            }, 800); 
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
          router.navigate('/community');
          
          if (data.title && (data.title.includes('নতুন নোটিস') || data.title.includes('রিপ্লাই'))) {
            setTimeout(() => {
               DeviceEventEmitter.emit('open_discussion_modal');
            }, 800);
          }
        }
      } catch (error) {
        console.log("Error opening notification guide/community:", error);
      }
    }
  };

  useEffect(() => {
    checkAndRequestPermission();

    const processColdBootNotification = (data) => {
      if (isAppReady.current) {
        handleNotificationTap(data);
      } else {
        pendingNotification.current = data; 
      }
    };

    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification && initialNotification.notification.data) {
        processColdBootNotification(initialNotification.notification.data);
      }
    });

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification?.request?.content?.data || response.notification?.request?.trigger?.remoteMessage?.data;
        if (data && Object.keys(data).length > 0) {
          processColdBootNotification(data);
        }
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification?.request?.content?.data || response.notification?.request?.trigger?.remoteMessage?.data;
      if (data && Object.keys(data).length > 0) {
        handleNotificationTap(data);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      const rawPayload = notification.request.trigger.remoteMessage?.data || notification.request.content.data;
      
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
        handleNotificationTap(data); 
        if (data && onNotificationClick) {
          onNotificationClick(data);
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
      unsubscribe();
    };
  }, []);

  const checkAndRequestPermission = async () => {
    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for Push Notifications');
      return;
    }

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
      if (Platform.OS === 'android') {
        // এক্সপোর বিল্ট-ইন চ্যানেলও আপডেট করে দিলাম
        await Notifications.setNotificationChannelAsync(NEW_CHANNEL_ID, {
          name: 'Squad VIP Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1899D6',
          sound: 'default',
        });
      }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) return;

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenResponse.data;
      
      setExpoPushToken(token);
      const userEmail = await AsyncStorage.getItem('@current_user_id');
      sendTokenToBackend(token, userEmail);
      
    } catch (e) {
      console.log('❌ Token generation error:', e);
    }
  };

  const sendTokenToBackend = async (token, userEmail) => {
    if(!userEmail || userEmail === 'guest') return; 
    try {
      const SERVER_URL = 'https://growshelby-api.vercel.app/api/save_token'; 
      await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY 
        },
        body: JSON.stringify({ action: 'save_push_token', token: token, email: userEmail }),
      });
    } catch (error) {}
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