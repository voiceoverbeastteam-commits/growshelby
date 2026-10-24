import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Animated, Modal, Text, DeviceEventEmitter, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import UserProfileButton from './UserProfileButton';
import TournamentButton from './TournamentButton';
import StudyButton from './StudyButton';
import PorarPageEyeComfort from './PorarPageEyeComfort';

// 🚀 ইমপোর্ট
import ToiriKorun from './ToiriKorun';
import Import from './Import';

export default function Bottombar({ translateY }) {
  const router = useRouter();
  const pathname = usePathname();

  // 🚀 গ্লোবাল অ্যাকশন শিট এবং মডালের স্টেট
  const [isActionSheetOpen, setActionSheetOpen] = useState(false);
  const [activeGlobalAction, setActiveGlobalAction] = useState(null); // 'CREATE' | 'IMPORT'
  const [communityDataForView, setCommunityDataForView] = useState(null);
  const [isCommunityViewVisible, setIsCommunityViewVisible] = useState(false);

  // 🚀 আনরিড মেসেজের স্টেট
  const [hasUnreadStudy, setHasUnreadStudy] = useState(false);

  // বর্তমান রাউট অনুযায়ী কোন ট্যাবটি এক্টিভ থাকবে তা নির্ধারণ
  let activeTab = 'home';
  if (pathname === '/profile') activeTab = 'profile';
  if (pathname === '/tournament') activeTab = 'tournament';
  if (pathname === '/study') activeTab = 'study';

  // 🚀 শুধুমাত্র বর্তমান অ্যাক্টিভ স্ক্রিনের বটম বারটি সিগন্যাল রিসিভ করবে (বাগ ফিক্সড)
  useFocusEffect(
    useCallback(() => {
      const subscription1 = DeviceEventEmitter.addListener('open_create_guide_modal', () => {
        setActiveGlobalAction('CREATE');
      });

      // 🚀 নতুন মেসেজ এলে লাল বাতি জ্বালানোর সিগন্যাল
      const subscription2 = DeviceEventEmitter.addListener('new_unread_message', () => {
        setHasUnreadStudy(true);
      });
      
     const subscription3 = DeviceEventEmitter.addListener('clear_unread_message', () => {
        setHasUnreadStudy(false);
      });

      // 🚀 TopBar এর প্লাস বাটনে ক্লিক করলে অ্যাকশন শিট ওপেন করার সিগন্যাল
      const subscription4 = DeviceEventEmitter.addListener('open_action_sheet', () => {
        setActionSheetOpen(true);
      });

      return () => {
        subscription1.remove();
        subscription2.remove();
        subscription3.remove();
        subscription4.remove();
      };
    }, [])
  );

  // 🚀 গ্লোবাল সেভ লজিক (যেকোনো পেজ থেকে সেভ করলে লাইব্রেরিতে চলে যাবে)
  const handleGlobalSave = async (guideData, isNew = false) => {
    try {
      let finalGuide = { ...guideData };

      if (isNew) {
        const shareCode = finalGuide.shareCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        finalGuide = { ...finalGuide, shareCode };
      }

      const uid = await AsyncStorage.getItem('@current_user_id') || 'default_user';
      const savedData = await AsyncStorage.getItem(`@shelby_guides_${uid}`);
      let myGuides = savedData ? JSON.parse(savedData) : [];

      let updatedGuides = [finalGuide, ...myGuides];
      await AsyncStorage.setItem(`@shelby_guides_${uid}`, JSON.stringify(updatedGuides));

      // 🚀 Books.js কে রিফ্রেশ করার সিগন্যাল পাঠানো হচ্ছে
      DeviceEventEmitter.emit('refresh_library');

      // সার্ভারে আপলোড
      try {
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'Growshelby_MVP_Secret_2026'
          },
          body: JSON.stringify({
            action: 'save_guide',
            guideData: finalGuide
          })
        });
      } catch (serverErr) {
        console.log("সার্ভার আপলোডে এরর:", serverErr);
      }

      setActiveGlobalAction(null);
      Alert.alert("ম্যাজিক সফল! 🎉", "গাইডটি আপনার লাইব্রেরিতে সেভ হয়ে গেছে।");
      
    } catch (error) {
      console.log("Error processing global guide:", error);
    }
  };

  return (
    <>
      <Animated.View 
        className="absolute bottom-6 self-center w-[92%] bg-white rounded-[32px] flex-row justify-between items-center px-6 py-4 border-2 border-[#E5E5E5] border-b-[6px] border-b-[#D7D7D7]"
        style={{
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, zIndex: 9999,
          transform: [{ translateY: translateY || 0 }] 
        }}
      >
        {/* Home Button */}
        <View className="w-12 h-12 items-center justify-center z-50">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/')} className="items-center justify-center w-full h-full">
            <FontAwesome5 name="home" size={24} color={activeTab === 'home' ? '#1CB0F6' : '#AFAFAF'} solid={activeTab === 'home'} />
          </TouchableOpacity>
        </View>

        {/* Tournament Button */}
        <View className="w-12 h-12 items-center justify-center z-50">
          <TournamentButton isActive={activeTab === 'tournament'} />
        </View>

       {/* 🚀 Center Action Placeholder (ভবিষ্যতের জন্য ফাঁকা রাখা হলো) */}
        <View className="w-12 h-12 items-center justify-center z-50">
          {/* Placeholder */}
        </View>

    {/* Study Button Placeholder (ভবিষ্যতের জন্য ফাঁকা রাখা হলো) */}
        <View className="w-12 h-12 items-center justify-center z-50 relative">
          {/* Placeholder */}
        </View>

        {/* Profile Button */}
        <View className="w-12 h-12 items-center justify-center z-50">
          <UserProfileButton isActive={activeTab === 'profile'} />
        </View>
      </Animated.View>

      {/* 🚀 Action Sheet Modal (Bottom Popup) */}
      <Modal visible={isActionSheetOpen} transparent animationType="fade" onRequestClose={() => setActionSheetOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity className="flex-1" onPress={() => setActionSheetOpen(false)} />
          <View className="bg-white rounded-t-[32px] p-6 pb-10 border-t-4 border-[#E5E5E5]">
            <Text className="text-xl text-[#3C3C3C] text-center mb-6" style={{ fontFamily: 'BanglaBold' }}>কী করতে চান?</Text>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => { setActionSheetOpen(false); setTimeout(() => setActiveGlobalAction('IMPORT'), 200); }} 
              className="bg-[#58CC02] p-4 rounded-[20px] mb-6 flex-row items-center border-b-4 border-[#58A700]"
            >
              <View className="bg-white/20 w-14 h-14 rounded-full items-center justify-center mr-4">
                <FontAwesome5 name="cloud-download-alt" size={22} color="#FFF" />
              </View>
             <View>
                <Text className="text-white text-[18px] pt-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি জয়েন করুন</Text>
                <Text className="text-white/80 text-[13px]" style={{ fontFamily: 'BanglaRegular' }}>সিক্রেট কোড ব্যবহার করে</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={() => setActionSheetOpen(false)} className="bg-[#F0F0F0] py-4 rounded-[16px] items-center">
              <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🚀 Global Fullscreen Modals for Creation & Import */}
      <Modal visible={activeGlobalAction === 'CREATE'} animationType="slide" onRequestClose={() => setActiveGlobalAction(null)}>
        <ToiriKorun onBack={() => setActiveGlobalAction(null)} onSave={(data) => handleGlobalSave(data, true)} />
      </Modal>

     <Modal visible={activeGlobalAction === 'IMPORT'} animationType="slide" onRequestClose={() => setActiveGlobalAction(null)}>
        <Import 
          onBack={() => setActiveGlobalAction(null)} 
          onImportSuccess={(communityData) => {
            setActiveGlobalAction(null); 
            setTimeout(() => {
              setCommunityDataForView(communityData);
              setIsCommunityViewVisible(true);
            }, 400);
          }} 
        />
      </Modal>

      {/* 🚀 Community View Render from Bottombar */}
      <PorarPageEyeComfort 
        visible={isCommunityViewVisible} 
        onClose={() => setIsCommunityViewVisible(false)} 
        lessonItem={communityDataForView} 
      />
    </>
  );
}