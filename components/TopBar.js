import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, SafeAreaView, Platform, StatusBar, Animated, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TopBar({ refreshTrigger }) {
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);

  // 🚀 আনরিড নোটিফিকেশন চেক করার লজিক
  useEffect(() => {
    const checkUnread = async () => {
      try {
        const existingNotifs = await AsyncStorage.getItem('@my_notifications');
        if (existingNotifs) {
          const parsed = JSON.parse(existingNotifs);
          const unreadExists = parsed.some(n => !n.isRead);
          setHasUnread(unreadExists);
        }
      } catch (e) {}
    };
    checkUnread();

    const sub = DeviceEventEmitter.addListener('NEW_NOTIFICATION_RECEIVED', () => setHasUnread(true));
    return () => sub.remove();
  }, [refreshTrigger]);

  return (
    <SafeAreaView className="bg-white">
      <View 
        className="flex-row justify-between items-center px-5 py-3 w-full" 
        style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }}
      >
    {/* Left Action: Search Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => DeviceEventEmitter.emit('open_action_sheet')} className="flex-row items-center justify-center bg-white w-11 h-11 rounded-2xl border-2 border-[#E5E5E5] border-b-[4px] border-b-[#CECECE]">
          <FontAwesome5 name="search" size={18} color="#1CB0F6" solid />
        </TouchableOpacity>
    {/* Center Logo */}
        <View className="items-center justify-center relative w-[110px] h-[36px]">
          {/* 🚀 সার্ভারের বদলে সরাসরি লোকাল assets ফোল্ডার থেকে লোগো লোড করা হচ্ছে */}
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 133, height: 100 }}
            resizeMode="contain"
          />
      </View>

   {/* 🚀 Right Action: Notification Bell */}
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => {
            setHasUnread(false);
            router.push('/notifications'); // 🚀 নতুন পেইজে যাবে
          }} 
          className="flex-row items-center justify-center bg-white w-11 h-11 rounded-2xl border-2 border-[#E5E5E5] border-b-[4px] border-b-[#CECECE] relative"
        >
          <FontAwesome5 name="bell" size={18} color="#FF9600" solid />
          
          {/* লাল বাতি (Unread Badge) */}
          {hasUnread && (
            <View className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-[#FF4B4B] rounded-full border border-white" />
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}