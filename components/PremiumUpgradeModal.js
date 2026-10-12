import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Linking, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PremiumUpgradeModal({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(500)).current;

  const [waNumber, setWaNumber] = useState("8801700000000"); 
  const [waMessage, setWaMessage] = useState("ভাই আমি প্রিমিয়াম আপগ্রেড করতে চাই গ্রোশেলপি অ্যাপের। কিভাবে করতে পারি?"); 

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const response = await fetch('https://growshelby-api.vercel.app/api/get_settings');
            const data = await response.json();
            if (data.whatsappNumber) setWaNumber(data.whatsappNumber);
            if (data.whatsappMessage) setWaMessage(data.whatsappMessage);
        } catch (error) {
            console.log("Failed to fetch WhatsApp settings", error);
        }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(500); 
    }
  }, [visible, slideAnim]);

  const handlePremiumUpgrade = () => {
    const formattedNumber = waNumber.replace(/[^0-9]/g, ''); 
    const url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(waMessage)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("দুঃখিত", "আপনার ফোনে হোয়াটসঅ্যাপ ইনস্টল করা নেই।");
      }
    }).catch(err => console.error("An error occurred", err));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          style={{ transform: [{ translateY: slideAnim }] }} 
          className="bg-white rounded-t-[36px] p-6 pb-10 w-full shadow-2xl border-t-4 border-[#E5E5E5]"
        >
          <View className="items-center justify-center py-2">
            
            {/* Top Icon */}
            <View className="bg-[#FFF4E5] w-20 h-20 rounded-full items-center justify-center mb-4 border-[4px] border-[#FFC800]">
              <FontAwesome5 name="gem" size={32} color="#FF9600" solid />
            </View>
            
            {/* Title */}
            <Text className="text-[22px] text-[#3C3C3C] text-center px-2 mb-4" style={{ fontFamily: 'BanglaBold' }}>
              প্রো আনলক করো! 🚀
            </Text>
            
            {/* Features List Box */}
            <View className="w-full bg-[#F7F7F7] rounded-2xl p-4 mb-6 border-2 border-[#E5E5E5]">
              <View className="flex-row items-center mb-4">
                <View className="bg-[#FFC800]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                    <FontAwesome5 name="bolt" size={16} color="#FF9600" />
                </View>
                <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>সুপারফাস্ট ভিআইপি এআই সার্ভার</Text>
              </View>

              <View className="flex-row items-center mb-4">
                <View className="bg-[#58CC02]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                    <FontAwesome5 name="coins" size={14} color="#58A700" />
                </View>
                <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রতিদিন ৩০০ প্রিমিয়াম কয়েন</Text>
              </View>

              <View className="flex-row items-center mb-4">
                <View className="bg-[#1CB0F6]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                    <FontAwesome5 name="bullseye" size={16} color="#1899D6" />
                </View>
                <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>১০০% নির্ভুল গ্যামিফাইড কুইজ</Text>
              </View>

              <View className="flex-row items-center">
                <View className="bg-[#CE82FF]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                    <FontAwesome5 name="infinity" size={14} color="#A559D6" />
                </View>
                <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>আনলিমিটেড নোট স্ক্যানিং সুবিধা</Text>
              </View>
            </View>
            
            {/* WhatsApp Upgrade Button */}
            <TouchableOpacity activeOpacity={0.8} onPress={handlePremiumUpgrade} className="w-full mb-3">
              <View className="bg-[#D4B300] rounded-2xl pb-[6px]">
                <View className="bg-[#FFC800] rounded-2xl py-4 flex-row justify-center items-center">
                  <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                  <Text className="text-white text-[17px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>মেসেজ করে আপগ্রেড করো</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Cancel / Close Button */}
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} className="w-full">
              <View className="bg-[#E5E5E5] rounded-2xl pb-[6px]">
                <View className="bg-[#F0F0F0] rounded-2xl py-3.5 flex-row justify-center items-center">
                  <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ফিরে যান</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </Animated.View>

      </View>
    </Modal>
  );
}