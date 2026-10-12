import React, { useState, useEffect } from 'react';
import { View, Text, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TopBar({ refreshTrigger }) {
  const [logoUrl, setLogoUrl] = useState('https://via.placeholder.com/120x40/ffffff/1CB0F6?text=LOGO');

  useEffect(() => {
    const fetchLogo = () => {
      fetch('https://growshelby-api.vercel.app/api/get_settings')
        .then(response => response.json())
        .then(data => {
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
        })
        .catch(error => console.error("Error fetching logo:", error));
    };

    fetchLogo();
  }, [refreshTrigger]); 

  return (
    <SafeAreaView className="bg-white">
      <View 
        className="flex-row justify-between items-center px-5 py-3 w-full" 
        style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }}
      >
        
        {/* Left Action: Fire/Streak Counter (Light 3D Theme) */}
        <View className="flex-row items-center justify-center bg-white px-4 py-2 rounded-2xl border-2 border-[#E5E5E5] border-b-[4px] border-b-[#CECECE]">
          <FontAwesome5 name="fire-alt" size={18} color="#FF9600" solid />
          <Text className="text-[#4B4B4B] ml-2 text-xs pt-0.5" style={{ fontFamily: 'BanglaBold' }}>০ স্ট্রিক</Text>
        </View>

        {/* Center Logo */}
        <View className="items-center justify-center">
          <Image
            source={{ uri: logoUrl }}
            style={{ width: 110, height: 36 }}
            resizeMode="contain"
          />
        </View>

        {/* Right Action: Star/Coins Counter (Light 3D Theme) */}
        <View className="flex-row items-center justify-center bg-white px-4 py-2 rounded-2xl border-2 border-[#E5E5E5] border-b-[4px] border-b-[#CECECE]">
          <FontAwesome5 name="star" size={15} color="#FFC800" solid />
          <Text className="text-[#4B4B4B] ml-2 text-xs pt-0.5" style={{ fontFamily: 'BanglaBold' }}>০ স্টার</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}