import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';

export default function SplashScreen({ onFinish, isReady }) {
  const [filledBoxes, setFilledBoxes] = useState(0);

  useEffect(() => {
    // কাস্টম স্প্ল্যাশ রেন্ডার হওয়ার সাথে সাথেই এক্সপোর নেটিভ স্প্ল্যাশ হাইড হয়ে যাবে
    ExpoSplashScreen.hideAsync().catch(() => {});

    // প্রতি ৩০০ মিলি-সেকেন্ডে একটা করে বক্স ভরবে (মোট ১.৫ সেকেন্ড)
    const interval = setInterval(() => {
      setFilledBoxes((prev) => (prev < 5 ? prev + 1 : 5));
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // ৫টা বক্স ভরা হয়ে গেলে এবং ব্যাকগ্রাউন্ডে লগইন/ডেটা চেক হয়ে গেলে অ্যাপে ঢুকবে
    if (filledBoxes >= 5 && isReady) {
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 200); // স্মুথ ট্রানজিশনের জন্য ছোট্ট ডিলে
    }
  }, [filledBoxes, isReady]);

  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: '#FFFFFF', // একদম হোয়াইট ব্যাকগ্রাউন্ড
          zIndex: 99999,
          elevation: 9999,
          alignItems: 'center', 
          justifyContent: 'center'
        }
      ]} 
    >
      {/* অ্যাপের আইকন একদম সেন্টারে */}
      <Image 
        source={require('../assets/BETA (1).png')} 
        className="w-32 h-32 mb-12 rounded-3xl"
        resizeMode="contain"
      />
      
      {/* ৫টি চারকোনা লোডিং বক্স */}
      <View className="flex-row space-x-3">
        {[1, 2, 3, 4, 5].map((boxIndex) => (
          <View 
            key={boxIndex}
            className={`w-5 h-5 rounded-sm ${
              filledBoxes >= boxIndex ? 'bg-[#1CB0F6]' : 'bg-[#E5E5E5]'
            }`}
          />
        ))}
      </View>
    </View>
  );
}