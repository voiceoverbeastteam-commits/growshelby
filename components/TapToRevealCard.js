import React, { useState } from 'react';
import { View, Text, LayoutAnimation, UIManager, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TapToRevealCard({ item }) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRevealed(true);
  };

  const info = item?.info || "";
  const keyword = item?.keyword || "";

  let beforeText = info;
  let afterText = "";
  let hasKeyword = false;

  if (keyword && info.includes(keyword)) {
    const parts = info.split(keyword);
    beforeText = parts[0];
    afterText = parts.slice(1).join(keyword);
    hasKeyword = true;
  }

  return (
    <View className="bg-[#F0F8FF] p-5 rounded-3xl border-2 border-[#1CB0F6] border-b-[5px] mb-4">
      <View className="flex-row items-center mb-4">
        <FontAwesome5 name="eye-slash" size={16} color="#1899D6" />
        <Text className="text-[15px] ml-2 text-[#1899D6]" style={{ fontFamily: 'BanglaBold' }}>
          লুকানো তথ্যটি ট্যাপ করে দেখো
        </Text>
      </View>

      <Text className="text-[18px] text-[#3C3C3C] leading-9" style={{ fontFamily: 'BanglaRegular' }}>
        {beforeText}
        {hasKeyword && (
          revealed ? (
            <Text className="text-[#58A700] bg-[#58CC02]/15" style={{ fontFamily: 'BanglaBold' }}> {keyword} </Text>
          ) : (
            <Text 
              onPress={handleReveal} 
              className="text-[#777777] bg-[#E5E5E5] px-2 py-1 overflow-hidden" 
              style={{ fontFamily: 'BanglaBold' }}
            >
              [ ট্যাপ করো ]
            </Text>
          )
        )}
        {afterText}
      </Text>
    </View>
  );
}