import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ConfidenceMeterCard({ item, onNext, onMarkForRevision }) {
  return (
    <View className="bg-white p-6 rounded-3xl border-2 border-b-[5px] border-[#E5E5E5] border-b-[#D7D7D7] mb-4">
      <Text className="text-[18px] text-[#3C3C3C] leading-8 mb-8 text-center" style={{ fontFamily: 'BanglaBold' }}>
        {item?.info}
      </Text>

      <View className="flex-row justify-between space-x-3">
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={onMarkForRevision} 
          className="flex-1 mr-2"
        >
          <View className="bg-[#D63939] rounded-2xl pb-[5px]">
            <View className="bg-[#FF4B4B] rounded-2xl py-3.5 items-center flex-row justify-center">
              <FontAwesome5 name="brain" size={16} color="#FFF" />
              <Text className="text-white text-[15px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>কঠিন লাগছে</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={onNext} 
          className="flex-1 ml-2"
        >
          <View className="bg-[#58A700] rounded-2xl pb-[5px]">
            <View className="bg-[#58CC02] rounded-2xl py-3.5 items-center flex-row justify-center">
              <FontAwesome5 name="fire-alt" size={16} color="#FFF" />
              <Text className="text-white text-[15px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>মুখস্ত ডান!</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}