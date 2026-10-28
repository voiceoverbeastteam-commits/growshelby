import { useState, useEffect, useRef } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType, AndroidVisibility, AndroidStyle } from '@notifee/react-native';
import { useRouter } from 'expo-router'; 

// 🚀 FIX 1: ফোরগ্রাউন্ডে (অ্যাপ ওপেন থাকা অবস্থায়) পপআপ অ্যালাও করা হলো!
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // 🟢 এটা আগে false ছিল, তাই পপআপ হতো না!
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

  const handleNotificationTap = async (data) => {
    if (data && (data.guideId || data.channelId)) {
      const targetId = data.guideId || data.channelId;
      try {
        const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'import_guide', code: targetId })
        });
        const result = await response.json();

        if (result.success && result.guide) {
          await AsyncStorage.setItem('@temp_community_data', JSON.stringify({ ...result.guide, isFromExplore: true }));
          router.push('/community');
        }
      } catch (error) {
        console.log("Error opening notification guide:", error);
      }
    }
  };

  useEffect(() => {
    checkAndRequestPermission();

    // অ্যাপ কিলড অবস্থা থেকে ওপেন করলে
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification && initialNotification.notification.data) {
        const data = initialNotification.notification.data;
        setTimeout(() => handleNotificationTap(data), 1000); 
      }
    });

    // 🚀 অ্যাপ ওপেন থাকা অবস্থায় Notifee দিয়ে হাই-প্রায়োরিটি হেডস-আপ পপআপ
    notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      const payload = notification.request.trigger.remoteMessage?.data || notification.request.content.data;
      
      if (payload) {
        // নতুন মেসেজ এলে লাইভ চ্যাটে সিগন্যাল পাঠানো
        if (payload.guideId) {
          DeviceEventEmitter.emit('new_unread_message', payload.guideId);
        }

        // 🚀 চ্যানেলটি সাথে সাথে তৈরি করে নেওয়া
        const channelId = await notifee.createChannel({
          id: NEW_CHANNEL_ID,
          name: 'Squad VIP Alerts',
          vibration: true,
          vibrationPattern: [300, 500],
          importance: AndroidImportance.HIGH, // 🟢 100% Guaranteed Popup
          visibility: AndroidVisibility.PUBLIC,
          sound: 'default',
        });

        // 🚀 Notifee দিয়ে সরাসরি পপআপ (ডাটা পেইলড থেকে)
        await notifee.displayNotification({
          title: payload.title || payload.userName || 'স্টাডি স্কোয়াড',
          body: payload.body || payload.text || 'কমিউনিটিতে নতুন আপডেট এসেছে!',
          data: payload,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            largeIcon: payload.senderAvatar || payload.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            circularLargeIcon: true, 
            pressAction: {
              id: 'default',
              launchActivity: 'default', // ক্লিক করলে সরাসরি অ্যাপ খুলবে
            },
            style: {
               type: AndroidStyle.BIGTEXT,
               text: payload.body || payload.text || 'কমিউনিটিতে নতুন আপডেট এসেছে!'
            }
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
          'x-api-key': 'Growshelby_MVP_Secret_2026' 
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