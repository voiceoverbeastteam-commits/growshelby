import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, Animated } from 'react-native';
import Bottombar from '../components/Bottombar';
import Books from '../components/Books';

export default function StudyScreen() {
  const [isBookActive, setIsBookActive] = useState(false);
  
  // 🚀 স্ক্রল এনিমেশনের জন্য
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    if (currentScrollY <= 0) {
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else if (currentScrollY > lastScrollY.current + 8) {
      Animated.timing(translateY, { toValue: 150, duration: 250, useNativeDriver: true }).start();
    } else if (currentScrollY < lastScrollY.current - 8) {
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    lastScrollY.current = currentScrollY;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar (বইয়ের ভেতরে ঢুকলে এটা হাইড হয়ে যাবে) */}
      {!isBookActive && (
        <View className="items-center px-6 py-4 mt-8 border-b border-[#E5E5E5]">
          <Text className="text-[22px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>
          শেলবি লাইব্রেরি
          </Text>
        </View>
      )}

      {/* 🚀 Books কম্পোনেন্টে onScroll প্রপ পাস করা হলো */}
      <Books onActiveStateChange={setIsBookActive} onScroll={handleScroll} />

      {/* গ্লোবাল বটম বার */}
      {!isBookActive && <Bottombar translateY={translateY} />}
    </SafeAreaView>
  );
}