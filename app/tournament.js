import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Bottombar from '../components/Bottombar';

export default function TournamentScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="items-center px-6 py-4 mt-8">
        <Text className="text-2xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>
          টুর্নামেন্ট
        </Text>
      </View>

      {/* Content Area */}
      <View className="flex-1 items-center justify-center px-8 pb-20">
        {/* আইকন (গ্যাপ বাড়ানো হয়েছে: mb-12) */}
        <View className="w-36 h-36 bg-[#FF9600]/10 rounded-full items-center justify-center mb-12 border-4 border-[#FF9600]/20">
          <FontAwesome5 name="trophy" size={60} color="#FF9600" solid />
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
          দারুণ কিছু আসছে!
        </Text>
        
        <Text className="text-[16px] text-[#7B92A5] text-center leading-7" style={{ fontFamily: 'BanglaRegular' }}>
          আমাদের <Text style={{ fontFamily: 'BanglaBold', color: '#FF9600' }}>GrowShelby</Text> টিম টুর্নামেন্ট সেকশন নিয়ে পুরোদমে কাজ করছে। খুব দ্রুতই তোমরা এখানে বন্ধুদের সাথে প্রতিযোগিতা করে পয়েন্ট জিততে পারবে!
        </Text>
      </View>

      {/* গ্লোবাল বটম বার */}
      <Bottombar />
    </SafeAreaView>
  );
}