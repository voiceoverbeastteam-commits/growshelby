import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, Alert, Linking, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

import Bottombar from '../components/Bottombar';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';

export default function ProfileScreen() {
  const router = useRouter(); 
  const [userName, setUserName] = useState("লোড হচ্ছে...");
  const [userAcademic, setUserAcademic] = useState("শিক্ষার্থী");
  
  const [isPremiumModalVisible, setPremiumModalVisible] = useState(false);
  const isPremium = false; 
  
  const [avatarUrl, setAvatarUrl] = useState("https://cdn-icons-png.flaticon.com/512/3135/3135715.png");

  // 🚀 হোয়াটসঅ্যাপ এপিআই স্টেট
  const [waNumber, setWaNumber] = useState("8801700000000");

  // 🚀 useEffect এর সাহায্যে প্রতিবার পেজে আসলে ডাটা রিফ্রেশ হবে
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const uid = await AsyncStorage.getItem('@current_user_id');
          if (!uid) return; 
          
          let savedName = await AsyncStorage.getItem(`@user_name_${uid}`);
          if (!savedName) savedName = await AsyncStorage.getItem('@user_name');
          if (savedName) setUserName(savedName);

          let savedAvatar = await AsyncStorage.getItem(`@user_avatar_${uid}`);
          if (!savedAvatar) savedAvatar = await AsyncStorage.getItem('@user_avatar');
          if (savedAvatar) setAvatarUrl(savedAvatar);
          
          let savedAcademic = await AsyncStorage.getItem(`@user_academic_${uid}`);
          if (!savedAcademic) savedAcademic = await AsyncStorage.getItem('@user_academic');
          if (savedAcademic) setUserAcademic(savedAcademic);

        } catch (error) {
          console.log("Error loading user profile:", error);
        }
      };
      
      loadUserData();
    }, [])
  );

  // 🚀 এপিআই থেকে হোয়াটসঅ্যাপ নম্বর ফেচ করা হচ্ছে
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const response = await fetch('https://growshelby-api.vercel.app/api/get_settings');
            const data = await response.json();
            if (data.whatsappNumber) setWaNumber(data.whatsappNumber);
        } catch (error) {
            console.log("Failed to fetch WhatsApp settings", error);
        }
    };
    fetchSettings();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "লগআউট",
      "আপনি কি নিশ্চিত যে আপনি অ্যাকাউন্ট থেকে বের হতে চান?",
      [
        { text: "না", style: "cancel" },
        { 
          text: "হ্যাঁ", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.setItem('@is_logged_in', 'false');
            await AsyncStorage.removeItem('@current_user_id'); 
            router.replace('/'); 
          }
        }
      ]
    );
  };

  const handleWhatsAppReport = () => {
    const formattedNumber = waNumber.replace(/[^0-9]/g, ''); 
    const message = "হ্যালো অ্যাডমিন, অ্যাপে আমার একটি সমস্যা হচ্ছে...";
    const url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("দুঃখিত", "আপনার ফোনে হোয়াটসঅ্যাপ ইনস্টল করা নেই।");
      }
    }).catch(err => console.error("An error occurred", err));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center px-6 py-4 mt-8">
        <Text className="text-2xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>
          প্রোফাইল
        </Text>
      </View>

      {/* 🚀 ScrollView অ্যাড করা হয়েছে যেন নিচে স্ক্রল করা যায় */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
         {/* Avatar */}
         <View className="w-32 h-32 rounded-full border-4 border-[#FF4B4B] overflow-hidden mb-4 items-center justify-center bg-[#F2F6F9]">
            <Image
              source={{ uri: avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
         </View>

         {/* User Name */}
         <Text 
           className="text-3xl text-[#3C3C3C] mb-1 text-center" 
           style={{ fontFamily: 'BanglaBold', lineHeight: 48, includeFontPadding: false }}
           numberOfLines={1}
           adjustsFontSizeToFit
         >
           {userName}
         </Text>

         {/* Academic Level */}
         <Text className="text-lg text-[#777777] mb-6" style={{ fontFamily: 'BanglaRegular' }}>
           {userAcademic}
         </Text>

         {/* Status Badge */}
         <View className={`px-5 py-2 rounded-full mb-10 ${isPremium ? 'bg-[#FF9600]/20' : 'bg-[#E5E5E5]'}`}>
           <Text className={`text-[15px] pt-1 ${isPremium ? 'text-[#FF9600]' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>
             {isPremium ? 'প্রিমিয়াম ইউজার' : 'ফ্রি ইউজার'}
           </Text>
         </View>

         {/* Upgrade Button */}
         {!isPremium && (
           <TouchableOpacity 
             activeOpacity={0.8} 
             onPress={() => setPremiumModalVisible(true)} 
             className="w-full max-w-[320px] mb-4"
           >
             <View className="bg-[#D47B00] rounded-[16px] pb-[6px]">
               <View className="bg-[#FF9600] rounded-[16px] py-4 flex-row justify-center items-center">
                 <FontAwesome5 name="crown" size={20} color="#FFFFFF" solid />
                 <Text className="ml-3 text-[18px] text-white pt-1" style={{ fontFamily: 'BanglaBold' }}>
                   প্রিমিয়াম আপগ্রেড করো
                 </Text>
               </View>
             </View>
           </TouchableOpacity>
         )}

         {/* WhatsApp Support Button */}
         <TouchableOpacity 
           activeOpacity={0.8} 
           onPress={handleWhatsAppReport} 
           className="w-full max-w-[320px] mb-4"
         >
           <View className="bg-[#128C7E] rounded-[16px] pb-[6px]">
             <View className="bg-[#25D366] rounded-[16px] py-4 px-4 flex-row justify-center items-center">
               <FontAwesome5 name="whatsapp" size={24} color="#FFFFFF" />
               <Text className="ml-3 text-[15px] text-white pt-1 flex-1 text-center" style={{ fontFamily: 'BanglaBold', lineHeight: 22 }}>
                 অ্যাপ সম্পর্কিত যে কোনো সমস্যায় অ্যাডমিনকে রিপোর্ট করো
               </Text>
             </View>
           </View>
         </TouchableOpacity>

         {/* Logout Button */}
         <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} className="w-full max-w-[320px]">
           <View className="bg-[#FF4B4B] rounded-[16px] pb-[6px]">
             <View className="bg-white border-2 border-[#FF4B4B] rounded-[16px] py-4 flex-row justify-center items-center">
               <FontAwesome5 name="sign-out-alt" size={20} color="#FF4B4B" solid />
               <Text className="ml-3 text-[18px] text-[#FF4B4B] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                 লগআউট করুন
               </Text>
             </View>
           </View>
         </TouchableOpacity>
      </ScrollView>

      <PremiumUpgradeModal 
        visible={isPremiumModalVisible} 
        onClose={() => setPremiumModalVisible(false)} 
      />

      <Bottombar />
      
    </SafeAreaView>
  );
}