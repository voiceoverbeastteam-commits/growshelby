import { useState, useEffect, useRef } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidStyle, EventType, AndroidImportance } from '@notifee/react-native';
import { useRouter } from 'expo-router'; 

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
  const router = useRouter(); 

  const handleNotificationTap = async (data) => {
    if (data && data.guideId) {
      try {
        const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'import_guide', code: data.guideId })
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

    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        const data = initialNotification.notification.data;
        setTimeout(() => handleNotificationTap(data), 1000); 
      }
    });

    // 🚀 ফোরগ্রাউন্ড (ওপেন থাকা) অবস্থায় ডাটা-অনলি মেসেজ ধরা
    notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.trigger.remoteMessage?.data || notification.request.content.data;

      if (data && data.isSilentPush) {
        if (data.guideId) {
          DeviceEventEmitter.emit('new_unread_message', data.guideId);
        }

        const channelId = await notifee.createChannel({
          id: 'squad_heads_up_final', 
          name: 'Study Squad Alerts',
          vibration: true,
          importance: AndroidImportance.HIGH,
          sound: 'default',
        });

        // 🚀 Notifee দিয়ে ডাটা থেকে টাইটেল ও বডি শো করানো
        await notifee.displayNotification({
          id: notification.request.identifier, 
          title: data.title,
          body: data.body,
          data: data,
          android: {
            channelId,
            largeIcon: data.senderAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            circularLargeIcon: true, 
            pressAction: {
              id: 'default',
            },
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
    } else {
      console.log('❌ User denied push notifications.');
    }
  };

  const generateAndSendToken = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('squad_heads_up_final', {
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

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': 'Growshelby_MVP_Secret_2026' 
        },
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