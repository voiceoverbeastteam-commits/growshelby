import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, SafeAreaView, Platform, StatusBar, Animated, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 🚀 লোগোর শিমার ইফেক্ট
const SkeletonLogo = () => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity: shimmerAnim }} className="w-[110px] h-[36px] bg-[#F5F5F5] rounded-lg" />
  );
};

export default function TopBar({ refreshTrigger }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(null); // 🚀 প্লেসহোল্ডার ডিলিট
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = () => {
      fetch('https://growshelby-api.vercel.app/api/get_settings')
        .then(response => response.json())
        .then(data => {
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          } else {
            setIsImageLoading(false); // লোগো না থাকলে শিমার অফ
          }
        })
        .catch(error => {
          console.error("Error fetching logo:", error);
          setIsImageLoading(false);
        });
    };

    fetchLogo();
  }, [refreshTrigger]);

  return (
    <SafeAreaView className="bg-white">
      <View 
        className="flex-row justify-between items-center px-5 py-3 w-full" 
        style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }}
      >
     {/* Left Action: Plus Button (বটমবার থেকে আনা হয়েছে) */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => DeviceEventEmitter.emit('open_action_sheet')} className="flex-row items-center justify-center bg-white w-11 h-11 rounded-2xl border-2 border-[#E5E5E5] border-b-[4px] border-b-[#CECECE]">
          <FontAwesome5 name="plus" size={18} color="#1CB0F6" solid />
        </TouchableOpacity>

      {/* Center Logo */}
        <View className="items-center justify-center relative w-[110px] h-[36px]">
          {/* 🚀 ছবি লোড না হওয়া পর্যন্ত শিমার দেখাবে */}
          {isImageLoading && (
            <View className="absolute z-10">
              <SkeletonLogo />
            </View>
          )}
          
          {logoUrl && (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: 110, height: 36 }}
              resizeMode="contain"
              onLoad={() => setIsImageLoading(false)} // 🚀 ছবি লোড হলে শিমার হাইড হয়ে যাবে
            />
          )}
        </View>

    {/* Right Action: Community Members Counter */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/study')} className="flex-row items-center justify-center bg-white px-4 py-2 rounded-2xl border-2 border-[#E5E5E5] border-b-[4px] border-b-[#CECECE]">
          <FontAwesome5 name="users" size={15} color="#1899D6" solid />
          <Text className="text-[#4B4B4B] ml-2 text-xs pt-0.5" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}