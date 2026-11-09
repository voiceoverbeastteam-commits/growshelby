import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, SafeAreaView, Platform, UIManager, LayoutAnimation, Alert, DeviceEventEmitter } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// অ্যান্ড্রয়েডে এনিমেশন কাজ করার জন্য
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🚀 টাইম ফরম্যাটিং (যেমন: "১০ মিনিট আগে")
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'এইমাত্র';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} দিন আগে`;
  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('@my_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        
        // 🚀 পেইজে ঢোকার সাথে সাথে সব নোটিফিকেশন "Read" মার্ক করে দিবো
        const markedAsRead = parsed.map(n => ({ ...n, isRead: true }));
        await AsyncStorage.setItem('@my_notifications', JSON.stringify(markedAsRead));
        
        // টপবারের লাল বাতি নিভিয়ে দেওয়ার জন্য সিগন্যাল
        DeviceEventEmitter.emit('NEW_NOTIFICATION_RECEIVED'); // TopBar এ লিসেন করা আছে, তবে এটা আসলে লাল বাতি জ্বালায়। তাই আপনি চাইলে আলাদা ইভেন্ট বানাতে পারেন বা ওখান থেকে রিমুভ করতে পারেন। 
      }
    } catch (e) {
      console.log("Error loading notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert("সব ডিলিট", "আপনি কি সব নোটিফিকেশন মুছে ফেলতে চান?", [
      { text: "না", style: "cancel" },
      { 
        text: "হ্যাঁ", 
        style: "destructive", 
        onPress: async () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          await AsyncStorage.removeItem('@my_notifications');
          setNotifications([]);
        }
      }
    ]);
  };

  const handleNotificationClick = (notif) => {
    // 🚀 ইউজারের ক্লিক করা নোটিফিকেশনের ডেটা গ্লোবাল রাউটিংয়ে পাঠানো হচ্ছে
    if (notif.data) {
      DeviceEventEmitter.emit('HANDLE_NOTIFICATION_ROUTING', notif.data);
      // রাউটিং হওয়ার জন্য একটু সময় দিয়ে হোম বা আগের পেইজে ব্যাক করানো
      setTimeout(() => {
        router.back();
      }, 300);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FA]">
      <StatusBar style="dark" backgroundColor="#F7F9FA" />

      {/* 🚀 Top Bar */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-[#E5E5E5] mt-8">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-[#F0F0F0] rounded-full items-center justify-center mr-3">
            <FontAwesome5 name="arrow-left" size={16} color="#777777" />
          </TouchableOpacity>
          <Text className="text-[20px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>নোটিফিকেশন</Text>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications} className="w-10 h-10 bg-[#FFF4E5] rounded-full items-center justify-center border border-[#FFDDAA]">
            <FontAwesome5 name="trash-alt" size={14} color="#FF4B4B" />
          </TouchableOpacity>
        )}
      </View>

      {/* 🚀 Notification List */}
      <ScrollView 
        className="flex-1 px-4 pt-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {!isLoading && notifications.length === 0 ? (
          // 🚀 Empty State
          <View className="items-center justify-center py-20 mt-10">
            <View className="w-24 h-24 bg-[#E5F5FF] rounded-full items-center justify-center mb-5 border-4 border-[#BCE3F5] border-dashed">
              <FontAwesome5 name="bell-slash" size={32} color="#1CB0F6" />
            </View>
            <Text className="text-[18px] text-[#3C3C3C] mb-2" style={{ fontFamily: 'BanglaBold' }}>কোনো নোটিফিকেশন নেই</Text>
            <Text className="text-[14px] text-[#777777] text-center px-6 leading-6" style={{ fontFamily: 'BanglaRegular' }}>
              নতুন কোনো আপডেট বা মেসেজ আসলে এখানে দেখতে পাবেন।
            </Text>
          </View>
        ) : (
          notifications.map((notif, index) => (
            <TouchableOpacity 
              key={notif.id || index}
              activeOpacity={0.8}
              onPress={() => handleNotificationClick(notif)}
              className={`flex-row p-4 mb-3 rounded-[20px] border shadow-sm ${!notif.isRead ? 'bg-[#E5F5FF] border-[#BCE3F5]' : 'bg-white border-[#E5E5E5]'}`}
            >
              {/* Avatar */}
              <View className="w-14 h-14 rounded-full bg-[#F0F0F0] border-2 border-white mr-4 overflow-hidden shadow-sm">
                <Image 
                  source={{ uri: notif.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
                  className="w-full h-full" 
                  resizeMode="cover"
                />
              </View>

              {/* Content */}
              <View className="flex-1 justify-center -mt-1">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className={`text-[16px] flex-1 mr-2 pt-1 ${!notif.isRead ? 'text-[#1073A4]' : 'text-[#3C3C3C]'}`} style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text className="text-[11px] text-[#AFAFAF] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                    {timeAgo(notif.time)}
                  </Text>
                </View>
                <Text className={`text-[13px] leading-5 ${!notif.isRead ? 'text-[#3C3C3C]' : 'text-[#777777]'}`} style={{ fontFamily: !notif.isRead ? 'BanglaBold' : 'BanglaRegular' }} numberOfLines={2}>
                  {notif.body}
                </Text>
              </View>
              
              {/* Unread Dot Indicator */}
              {!notif.isRead && (
                <View className="w-2.5 h-2.5 bg-[#1CB0F6] rounded-full self-center ml-2" />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}