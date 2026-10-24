import { useState, useEffect, useRef } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidStyle, EventType, AndroidImportance } from '@notifee/react-native';
import { useRouter } from 'expo-router'; // 🚀 রাউটার ইমপোর্ট করা হলো

// 🚀 Expo এর ডিফল্ট নোটিফিকেশন পপআপ বন্ধ করা হলো, কারণ এখন Notifee নোটিফিকেশন দেখাবে
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, 
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function PushNotification({ onNotificationClick }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const notificationListener = useRef();
  const router = useRouter(); // 🚀 রাউটার ইনিশিয়ালাইজ

  // 🚀 ম্যাজিক ফাংশন: নোটিফিকেশনে ক্লিক করলে সরাসরি বই পেজ (Community.js) ওপেন করবে
  const handleNotificationTap = async (data) => {
    if (data && data.guideId) {
      try {
        // ১. এপিআই কল করে ওই নির্দিষ্ট বইয়ের সব ডেটা নিয়ে আসা
        const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'import_guide', code: data.guideId })
        });
        const result = await response.json();

        if (result.success && result.guide) {
          // ২. ডেটাটা লোকাল স্টোরেজে সেভ করে সরাসরি community.js স্ক্রিনে পাঠানো
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

    // 🚀 ১. অ্যাপ পুরোপুরি বন্ধ (Killed State) থাকা অবস্থায় ক্লিক করলে হ্যান্ডেল করবে
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        const data = initialNotification.notification.data;
        setTimeout(() => handleNotificationTap(data), 1000); // অ্যাপ লোড হওয়ার জন্য একটু সময় দিলাম
      }
    });

    // 🚀 ২. যখন ব্যাকগ্রাউন্ড বা ফোরগ্রাউন্ডে নোটিফিকেশন আসবে, Notifee সেটা ক্যাচ করে সুন্দরভাবে দেখাবে
   notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      const { title, body, data } = notification.request.content;

      // 🚀 আনরিড মেসেজের সিগন্যাল পাঠানো হচ্ছে
      if (data && data.guideId) {
        DeviceEventEmitter.emit('new_unread_message', data.guideId);
      }

  // Notifee এর জন্য একটি চ্যানেল তৈরি করা (Android এ বাধ্যতামূলক)
      const channelId = await notifee.createChannel({
        id: 'smart_squad_alert', // 🚀 একদম নতুন আইডি দিলাম
        name: 'Study Squad Alerts',
        vibration: true,
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

    // 🚀 Notifee দিয়ে প্রফেশনাল নোটিফিকেশন দেখানো হচ্ছে (ডুপ্লিকেট ফিক্সড)
      await notifee.displayNotification({
        id: notification.request.identifier, // 🚀 ম্যাজিক ফিক্স: এক্সপোর অরিজিনাল আইডিটা সেট করা হলো
        title: title,
        body: body,
        data: data,
        android: {
          channelId,
          largeIcon: data?.senderAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // ইউজারের প্রোফাইল পিকচার
          circularLargeIcon: true, // মেসেঞ্জারের মতো ছবি গোল হবে
          pressAction: {
            id: 'default',
          },
        },
      });
    });

  // 🚀 ৩. অ্যাপ ব্যাকগ্রাউন্ড বা ফোরগ্রাউন্ডে থাকা অবস্থায় ক্লিক করলে হ্যান্ডেল করবে
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification.data;
        handleNotificationTap(data); // 🚀 নতুন ম্যাজিক রাউটার ফাংশন কল
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
    } else {
      console.log('❌ User denied push notifications.');
    }
  };

  const generateAndSendToken = async () => {
    try {
      if (Platform.OS === 'android') {
       // 🚀 এক্সপোকেও বলে দিলাম যে 'smart_squad_alert' নামে একটি হাই-প্রায়োরিটি চ্যানেল আছে
        await Notifications.setNotificationChannelAsync('smart_squad_alert', {
          name: 'Study Squad Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.log('⚠️ EAS Project ID not found. Run "eas init" in your terminal.');
        return;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data;
      
      setExpoPushToken(token);
      // 🚀 ইউজারের ইমেইলটি স্টোরেজ থেকে নিয়ে টোকেনের সাথে সার্ভারে পাঠানো হচ্ছে
      const userEmail = await AsyncStorage.getItem('@current_user_id');
      sendTokenToBackend(token, userEmail);
      
    } catch (e) {
      console.log('❌ Token generation error:', e);
    }
  };

 const sendTokenToBackend = async (token, userEmail) => {
    if(!userEmail || userEmail === 'guest') return; // 🚀 গেস্ট হলে টোকেন সেভ করবে না
    try {
      // 🚀 Endpoint Fixed
      const SERVER_URL = 'https://growshelby-api.vercel.app/api/save_token'; 

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': 'Growshelby_MVP_Secret_2026' // 🚀 সিকিউরিটির জন্য API Key অ্যাড করা হলো
        },
        // 🚀 টোকেনের সাথে ইউজারের ইমেইলও পাঠানো হচ্ছে
        body: JSON.stringify({ action: 'save_push_token', token: token, email: userEmail }),
      });
      
      const resultText = await response.text();
      
      if (response.ok) {
        console.log('✅ Token sent to database successfully:', resultText);
      } else {
        console.log('❌ Server returned an error status:', resultText);
      }
    } catch (error) {
      console.log('⚠️ Error saving token:', error);
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
            নতুন ডেইলি চ্যালেঞ্জ, রিভিশন রিমাইন্ডার এবং এক্সাম আপডেটের নোটিফিকেশন পেতে 'এলাও' বাটনে ক্লিক করুন।
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