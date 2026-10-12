import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PriorityHighlightCard({ item }) {
  // item.priority 'high' হলে ইম্পর্ট্যান্ট থিম, না হলে নরমাল থিম
  const isHighPriority = item?.priority === 'high';

  // ডুওলিঙ্গো স্টাইল কালার ভ্যারিয়েশন
  const bgColor = isHighPriority ? 'bg-[#FFF3E0]' : 'bg-[#F0F8FF]';
  const borderColor = isHighPriority ? 'border-[#FF9600] border-b-[#D47B00]' : 'border-[#1CB0F6] border-b-[#1899D6]';
  const iconColor = isHighPriority ? '#FF9600' : '#1CB0F6';
  const titleColor = isHighPriority ? 'text-[#D47B00]' : 'text-[#1899D6]';
  const iconName = isHighPriority ? 'fire' : 'lightbulb';
  const titleText = isHighPriority ? 'গুরুত্বপূর্ণ তথ্য (মনে রেখো!)' : 'কন্টেক্সট (পড়ে নাও)';

  return (
    <View className={`p-5 rounded-3xl border-2 border-b-[5px] mb-4 ${bgColor} ${borderColor}`}>
      <View className="flex-row items-center mb-4">
        <View className="bg-white p-2.5 rounded-2xl shadow-sm border border-[#E5E5E5] mr-3">
          <FontAwesome5 name={iconName} size={18} color={iconColor} solid />
        </View>
        <Text className={`text-[16px] pt-1 flex-1 ${titleColor}`} style={{ fontFamily: 'BanglaBold' }}>
          {titleText}
        </Text>
      </View>
      <Text className="text-[18px] text-[#3C3C3C] leading-8" style={{ fontFamily: 'BanglaBold' }}>
        {item?.info}
      </Text>
    </View>
  );
}