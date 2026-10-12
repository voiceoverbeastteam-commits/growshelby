import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Bottombar from '../components/Bottombar';

export default function StudyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="items-center px-6 py-4 mt-8">
        <Text className="text-2xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>
          বই ও স্টাডি
        </Text>
      </View>

      {/* Content Area */}
      <View className="flex-1 items-center justify-center px-8 pb-20">
        {/* আইকন (গ্যাপ বাড়ানো হয়েছে: mb-12) */}
        <View className="w-36 h-36 bg-[#58CC02]/10 rounded-full items-center justify-center mb-12 border-4 border-[#58CC02]/20">
          <FontAwesome5 name="book-reader" size={60} color="#58CC02" solid />
        </View>
        
        {/* হেডিং টেক্সট (সম্পূর্ণ ভিজিবল করার জন্য ক্লিপিং ফিক্স করা হয়েছে) */}
        <Text 
          className="text-3xl text-[#3C3C3C] text-center mb-4" 
          style={{ 
            fontFamily: 'BanglaBold',
            lineHeight: 45,
            paddingTop: 10,
            includeFontPadding: false
          }}
          adjustsFontSizeToFit
          numberOfLines={2}
        >
          পড়াশোনার নতুন জগৎ!
        </Text>
        
        <Text className="text-[16px] text-[#7B92A5] text-center leading-7" style={{ fontFamily: 'BanglaRegular' }}>
          আপাতত তোমার তৈরি করা নোটবুকগুলো পড়তে থাকো। <Text style={{ fontFamily: 'BanglaBold', color: '#58CC02' }}>GrowShelby</Text> টিম খুব দ্রুতই তোমাদের জন্য চমৎকার সব বইয়ের কালেকশন নিয়ে আসছে!
        </Text>
      </View>

      {/* গ্লোবাল বটম বার */}
      <Bottombar />
    </SafeAreaView>
  );
}