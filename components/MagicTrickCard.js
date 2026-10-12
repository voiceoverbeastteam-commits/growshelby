import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// Android এ LayoutAnimation চালু করার জন্য
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MagicTrickCard({ item }) {
  const [showTrick, setShowTrick] = useState(false);

  const toggleTrick = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowTrick(!showTrick);
  };

  return (
    <View className="bg-white p-5 rounded-3xl border-2 border-[#E5E5E5] mb-4">
      <Text className="text-[17px] text-[#3C3C3C] leading-8 mb-4" style={{ fontFamily: 'BanglaRegular' }}>
        {item?.info}
      </Text>

      {item?.trick && (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleTrick}>
          <View className={`rounded-2xl pb-[4px] ${showTrick ? 'bg-[#D4B300]' : 'bg-[#1899D6]'}`}>
            <View className={`rounded-2xl py-3 px-4 flex-row items-center justify-center ${showTrick ? 'bg-[#FFC800]' : 'bg-[#1CB0F6]'}`}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FFFFFF" />
              <Text className="text-white ml-2 text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                {showTrick ? 'ট্রিক লুকান' : 'ম্যাজিক ট্রিক দেখো'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {showTrick && item?.trick && (
        <View className="mt-4 bg-[#FFC800]/15 p-4 rounded-xl border border-[#FFC800]/30 flex-row">
          <Text className="text-[16px] text-[#B87B00] leading-7" style={{ fontFamily: 'BanglaBold' }}>
            {item?.trick}
          </Text>
        </View>
      )}
    </View>
  );
}