import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Alert, Clipboard, Image, TextInput, Modal, StatusBar, DeviceEventEmitter, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager, RefreshControl } from 'react-native';

// 🚀 সেশন ট্র্যাকার (অ্যাপ একবার ওপেন হলে এটা true হয়ে যাবে, ফলে বারবার রিলোড হবে না)
let isSessionLoaded = false;
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import PorarPageEyeComfort from './PorarPageEyeComfort';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🚀 Skeleton Loading Card (ইউটিউবের মতো ফ্লাশ ইফেক্ট)
const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

 return (
    <Animated.View style={{ opacity: shimmerAnim }} className="mb-8">
      <View className="w-full aspect-[16/9] bg-[#E5E5E5] rounded-xl" />
      <View className="flex-row mt-3 px-1">
        <View className="w-10 h-10 rounded-full bg-[#E5E5E5] mr-3" />
        <View className="flex-1 mt-1">
          <View className="h-4 bg-[#E5E5E5] rounded-full w-3/4 mb-2.5" />
          <View className="h-3 bg-[#E5E5E5] rounded-full w-1/2" />
        </View>
      </View>
    </Animated.View>
  );
};

export default function Books({ onActiveStateChange, onScroll }) {
  const [myGuides, setMyGuides] = useState([]); 
  
  // 🚀 আনরিড মেসেজ ট্র্যাক করার স্টেট
  const [unreadCommunities, setUnreadCommunities] = useState({});
  // 🚀 নতুন লোডিং স্টেট আমার স্কোয়াডের জন্য
  const [isMySquadLoading, setIsMySquadLoading] = useState(true);

  useEffect(() => {
    // সিগন্যাল পেলেই আনরিড লিস্টে আইডি সেভ করবে
    const sub = DeviceEventEmitter.addListener('new_unread_message', (guideId) => {
      if (guideId) {
        setUnreadCommunities(prev => ({ ...prev, [guideId]: true }));
      }
    });
    return () => sub.remove();
  }, []);
  
  const [isLessonVisible, setLessonVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

 const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false); // 🚀 নতুন আপলোডিং স্টেট
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

const [refreshing, setRefreshing] = useState(false);

  // 🚀 Pull-to-Refresh ফাংশন
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSavedGuides(true).finally(() => setRefreshing(false));
  }, []);

  // 🚀 স্মার্ট ক্যাশ লজিক সহ ডাটা ফেচ
  const loadSavedGuides = async (forceNetwork = false) => {
    try {
      const uid = await AsyncStorage.getItem('@current_user_id');
      if (!uid) {
        setIsMySquadLoading(false);
        return;
      }

      // ১. শুধু প্রথমবার বা জোর করে রিফ্রেশ করলে লোকাল ক্যাশ থেকে দেখাবে
      if (!isSessionLoaded || forceNetwork) {
        const cachedSquads = await AsyncStorage.getItem(`@shelby_guides_${uid}`);
        let parsedSquads = [];
        if (cachedSquads) {
          try { parsedSquads = JSON.parse(cachedSquads); } catch (e) { console.log("Cache Parse Error:", e); }
        }
        
        if (parsedSquads && parsedSquads.length > 0) {
          // 🚀 যদি স্টেটে অলরেডি ডাটা থাকে, তবে ডাবল সেট করবো না (এতেই ঝিলিক মারা বন্ধ হবে)
          setMyGuides(prev => prev.length === 0 ? parsedSquads : prev);
          setIsMySquadLoading(false);
        } else if (!forceNetwork) {
          setIsMySquadLoading(true);
        }
      }
      
      // ২. সেশন লোড না হয়ে থাকলে বা নিজে থেকে টান দিলে তবেই নেটওয়ার্ক কল হবে
      if (!isSessionLoaded || forceNetwork) {
        const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'fetch_joined_communities', userEmail: uid })
        });
        const data = await response.json();

        if (data.success && data.channels) {
          if (!isSessionLoaded) {
             LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          setMyGuides(data.channels); 
          setIsMySquadLoading(false); 
          isSessionLoaded = true; // 🚀 সেশন লক করে দিলাম! এখন থেকে অ্যাপ না কাটা পর্যন্ত আর অটো লোড হবে না।
          
          const lightweightChannels = data.channels.map(channel => ({
            ...channel,
            banner: (channel.banner && channel.banner.startsWith('data:image')) ? '' : channel.banner,
            creatorAvatar: (channel.creatorAvatar && channel.creatorAvatar.startsWith('data:image')) ? '' : channel.creatorAvatar
          }));
          
          await AsyncStorage.setItem(`@shelby_guides_${uid}`, JSON.stringify(lightweightChannels));
        }
      }
    } catch (error) {
      console.log("Error loading squad:", error);
    } finally {
      setIsMySquadLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // 🚀 ফোকাস হলে শুধু ক্যাশ চেক করবে, নেটওয়ার্ক কল নয়। 
      loadSavedGuides(false);
    }, [])
  );

  useEffect(() => {
    // অন্য জায়গা থেকে সিগন্যাল এলে ব্যাকগ্রাউন্ডে ফোর্স আপডেট করবে
    const subscription = DeviceEventEmitter.addListener('refresh_library', () => loadSavedGuides(true));
    return () => subscription.remove();
  }, []);


 useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(15);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start();
  }, []);

  const handleUpdateOrSaveGuide = async (guideData, isNew = false) => {
    try {
      let updatedGuides;
      let finalGuide = { ...guideData };

      if (isNew) {
        const shareCode = finalGuide.shareCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        finalGuide = { ...finalGuide, shareCode };
        updatedGuides = [finalGuide, ...myGuides];
      } else {
        updatedGuides = myGuides.map(g => g.id === finalGuide.id ? finalGuide : g);
      }
      
    setMyGuides(updatedGuides);
      const uid = await AsyncStorage.getItem('@current_user_id') || 'default_user';
      
      // 🚀 Base64 থাম্বনেইল বাদ দিয়ে সেভ করবো
      const lightGuides = updatedGuides.map(g => ({
        ...g,
        thumbnail: (g.thumbnail && g.thumbnail.startsWith('data:image')) ? '' : g.thumbnail,
        banner: (g.banner && g.banner.startsWith('data:image')) ? '' : g.banner
      }));
      await AsyncStorage.setItem(`@shelby_guides_${uid}`, JSON.stringify(lightGuides));
      
      try {
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'save_guide', guideData: finalGuide })
        });
      } catch (serverErr) { console.log("Server upload error:", serverErr); }
    } catch (error) { console.log("Error processing guide:", error); }
  };

  const handleDeleteGuide = (guideId) => {
    Alert.alert("নিশ্চিত করুন", "আপনি কি সত্যিই এই গাইডটি ডিলিট করতে চান?", [
      { text: "বাতিল", style: "cancel" },
      { text: "ডিলিট", style: "destructive", onPress: async () => {
        try {
          const guideToDelete = myGuides.find(g => g.id === guideId);
          const updatedGuides = myGuides.filter(g => g.id !== guideId);
          
          setMyGuides(updatedGuides);
          const uid = await AsyncStorage.getItem('@current_user_id') || 'default_user';
          await AsyncStorage.setItem(`@shelby_guides_${uid}`, JSON.stringify(updatedGuides));

          if (guideToDelete && guideToDelete.shareCode) {
            fetch('https://growshelby-api.vercel.app/api/update_coins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
              body: JSON.stringify({ action: 'delete_guide', shareCode: guideToDelete.shareCode })
            });
          }
        } catch (error) { console.log("Error deleting guide:", error); }
      }}
    ]);
  };

  const handleCopyCode = (code) => {
    Clipboard.setString(code);
    Alert.alert("কপি হয়েছে! 🎉", `কোড: ${code}\nএখন বন্ধুদের মেসেঞ্জার বা হোয়াটসঅ্যাপে পাঠিয়ে দাও!`);
  };

const handleOpenGuide = (guide, isFromExplore = false) => {
    // 🚀 আনরিড মেসেজ রিড মার্ক করা এবং বটম বারের লাল বাতি নেভানো
    setUnreadCommunities(prev => ({ ...prev, [guide.shareCode]: false, [guide.channelId]: false }));
    DeviceEventEmitter.emit('clear_unread_message');

    setTimeout(() => {
      setSelectedLesson({ ...guide, isFromExplore });
      setLessonVisible(true);
    }, 50);
  };

  const handleImportFromExplore = async (guide) => {
    Alert.alert("লাইব্রেরিতে যুক্ত করুন", "এই স্কোয়াড গাইডটি আপনার লাইব্রেরিতে সেভ করতে চান?", [
      { text: "না", style: "cancel" },
      { text: "হ্যাঁ, সেভ করুন", onPress: async () => {
        try {
          const uid = await AsyncStorage.getItem('@current_user_id') || 'guest';
          const name = await AsyncStorage.getItem(`@user_name_${uid}`) || 'শিক্ষার্থী';
          const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

          const newGuide = { 
            ...guide, 
            id: 'imported_' + Date.now(), 
            shareCode: null, 
            isPublic: false,
            creatorName: guide.creatorName || name,
            creatorAvatar: guide.creatorAvatar || avatar
          };
          
          handleUpdateOrSaveGuide(newGuide, true);
          Alert.alert("সফল! 🎉", "গাইডটি আপনার প্লেলিস্টে সেভ হয়েছে।");
        } catch (e) { console.log("Import error:", e); }
      }}
    ]);
  };

  const openEditModal = (guide) => {
    setEditingGuide({
      ...guide,
      description: guide.description || '',
      chapter: guide.chapter || '',
      isPublic: guide.isPublic !== undefined ? guide.isPublic : true,
      thumbnail: guide.thumbnail || null
    });
    setEditModalVisible(true);
  };

  const saveMetadataEdits = () => {
    if (editingGuide.isPublic && !editingGuide.thumbnail) {
      return Alert.alert("থাম্বনেইল প্রয়োজন", "পাবলিক গাইডের জন্য একটি কভার ছবি দিতে হবে।");
    }
    handleUpdateOrSaveGuide(editingGuide, false);
    setEditModalVisible(false);
  };

 const pickEditThumbnail = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.3, base64: true
    });
    
    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditingGuide({ ...editingGuide, thumbnail: base64Image }); 
      setIsImageUploading(true); // 🚀 বাটন লক

      try {
        let formData = new FormData();
        formData.append("image", result.assets[0].base64);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=266dc6accf170af21b0a679770bcd7bb`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          setEditingGuide(prev => ({ ...prev, thumbnail: data.data.url }));
        }
      } catch (e) { 
        console.log("ImgBB Upload Error:", e); 
      } finally {
        setIsImageUploading(false); // 🚀 বাটন আনলক
      }
    }
  };

 // 🚀 Helper: ইংরেজি নাম্বারকে বাংলায় রূপান্তর এবং 1k+ ফরম্যাটিং
  const formatNumberToBangla = (num) => {
    if (!num) return '০';
    const banglaDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    
    if (num >= 1000) {
      const kValue = (num / 1000).toFixed(1).replace('.0', ''); // 1.0k এর বদলে 1k
      return kValue.toString().replace(/[0-9]/g, x => banglaDigits[x]) + 'k';
    }
    return num.toString().replace(/[0-9]/g, x => banglaDigits[x]);
  };

  // 🚀 Helper: রেটিং ফরম্যাটিং (যেমন: ৪.৫)
  const formatRatingToBangla = (rating) => {
    if (!rating || rating === 0) return 'নতুন'; // কেউ রেটিং না দিলে 'নতুন' দেখাবে
    const banglaDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return rating.toFixed(1).toString().replace(/[0-9]/g, x => banglaDigits[x]);
  };

// 🚀 Community-First Squad Card (SUPER FAST & Error Free!)
  const GuideCard = ({ guide, isExplore }) => {
    const [isImgLoaded, setIsImgLoaded] = useState(false);
    const shimmerAnim = useRef(new Animated.Value(0.4)).current;
    const imageFadeAnim = useRef(new Animated.Value(0)).current;

    // 🚀 ১. ইমেজ এবং এভাটার ভ্যালিড কিনা সেটা আগে চেক করে নিচ্ছি (যাতে 'null' এরর না আসে)
    const imageUri = isExplore ? guide.banner : guide.thumbnail;
    const isValidImage = imageUri && typeof imageUri === 'string' && imageUri !== 'null' && imageUri.trim() !== '';

    const avatarUri = guide.creatorAvatar;
    const isValidAvatar = avatarUri && typeof avatarUri === 'string' && avatarUri !== 'null' && avatarUri.trim() !== '';

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
        ])
      ).start();

      // 🚀 ২. যদি ইমেজ না থাকে, তাহলে শিমার সাথে সাথে বন্ধ করে দিব
      if (!isValidImage) {
        setIsImgLoaded(true);
        Animated.timing(imageFadeAnim, { toValue: 1, duration: 0, useNativeDriver: true }).start();
      }
    }, [isValidImage]);

    const handleImageLoad = () => {
      Animated.timing(imageFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setIsImgLoaded(true));
    };

    const rawContentCount = isExplore ? (guide.contentCount || guide.questionCount || guide.data?.length || 1) : (guide.failedItems?.length || guide.data?.length || 0);
    const contentCount = formatNumberToBangla(rawContentCount);
    const memberCount = formatNumberToBangla(guide.membersCount || 1);
    const rating = formatRatingToBangla(guide.averageRating || 0);

    return (
      <View className="mb-7">
        <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenGuide(guide, isExplore)}>

          {/* Thumbnail / Banner Area */}
          <View className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#F0F2F5] border border-[#E5E5E5] relative">

            {(unreadCommunities[guide.shareCode] || unreadCommunities[guide.channelId]) && (
              <View className="absolute top-3 right-3 bg-[#FF4B4B] px-2.5 py-1.5 rounded-full border-2 border-white z-20 flex-row items-center shadow-sm">
                <View className="w-1.5 h-1.5 bg-white rounded-full mr-1.5" />
                <Text className="text-white text-[11px]" style={{ fontFamily: 'BanglaBold' }}>নতুন মেসেজ</Text>
              </View>
            )}

            {!isImgLoaded && (
              <Animated.View style={{ opacity: shimmerAnim }} className="absolute inset-0 bg-[#EAE4D4]" />
            )}

            {/* 🚀 ৩. শুধু ভ্যালিড ইমেজ থাকলেই Image কম্পোনেন্ট রেন্ডার হবে */}
            {isValidImage && (
              <Animated.Image
                source={{ uri: imageUri }}
                className="w-full h-full absolute inset-0"
                resizeMode="cover"
                style={{ opacity: imageFadeAnim }}
                onLoad={handleImageLoad}
                onError={() => {
                  setIsImgLoaded(true); // এরর হলেও শিমার বন্ধ করে দিব
                  Animated.timing(imageFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
                }}
              />
            )}
          </View>

          {/* Info Area */}
          <View className="flex-row mt-4 px-1">
            {/* Creator Avatar */}
            <View className="w-11 h-11 rounded-full border border-[#E5E5E5] bg-[#F9F9F9] mr-3 overflow-hidden">
              {/* 🚀 ৪. এভাটার না থাকলে ডিফল্ট আইকন বসবে */}
              <Image
                source={{ uri: isValidAvatar ? avatarUri : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                className="w-full h-full"
              />
            </View>

            {/* Texts */}
            <View className="flex-1 justify-center -mt-1">
              <Text className="text-[#3C3C3C] text-[17px] leading-[26px] pt-1 mb-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>
                {isExplore ? (guide.notebookName || guide.creatorName) : guide.notebookName}
              </Text>

              <View className="flex-row items-center pr-2">
                <Text className="text-[#777777] text-[13px] flex-shrink-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                  {guide.creatorName || 'শিক্ষার্থী'}
                </Text>

                {isExplore && (
                  <>
                    <Text className="text-[#AFAFAF] text-[8px] mx-1.5">●</Text>
                    <View className="flex-row items-center">
                      <FontAwesome5 name="users" size={10} color="#777777" />
                      <Text className="text-[#777777] text-[12px] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{memberCount}</Text>
                    </View>
                    <Text className="text-[#AFAFAF] text-[8px] mx-1.5">●</Text>
                    <View className="flex-row items-center">
                      <FontAwesome5 name="star" size={10} color="#FF9600" solid={rating !== 'নতুন'} />
                      <Text className="text-[#777777] text-[12px] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{rating !== 'নতুন' ? rating : 'নতুন'}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {!isExplore && (
               <TouchableOpacity activeOpacity={0.7} onPress={() => openEditModal(guide)} className="p-2 self-start">
                 <FontAwesome5 name="ellipsis-v" size={14} color="#AFAFAF" />
               </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {/* Action Buttons Area (Only visible in My Playlist) */}
        {!isExplore && (
          <View className="flex-row items-center justify-between mt-3 px-1 ml-14">
            {guide.shareCode ? (
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleCopyCode(guide.shareCode)} className="flex-row items-center bg-[#1899D6]/10 px-3 py-1.5 rounded-lg border border-[#1899D6]/20">
                <FontAwesome5 name="copy" size={12} color="#1899D6" />
                <Text className="text-[#1899D6] text-[12px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>কোড: {guide.shareCode}</Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-[#E5E5E5] px-3 py-1.5 rounded-lg">
                <Text className="text-[#777777] text-[12px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>প্রাইভেট গাইড</Text>
              </View>
            )}
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleDeleteGuide(guide.id)} className="bg-[#FFF4E5] w-8 h-8 rounded-full items-center justify-center border border-[#FFDDAA]">
              <FontAwesome5 name="trash-alt" size={12} color="#FF4B4B" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F7F9FA] pt-2">
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9FA" />

    
     <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 10 }}
          onScroll={onScroll} 
          scrollEventThrottle={16} 
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#1CB0F6', '#FFC800']} 
              tintColor="#1CB0F6"
            />
          }
        >
          <View className="px-5">
            {isMySquadLoading && !refreshing ? (
              <View>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : myGuides.length > 0 ? (
              // 🚀 ম্যাজিক: key={index} এর বদলে আসল আইডি দিলে কম্পোনেন্ট রি-মাউন্ট হবে না, ঝিলিকও মারবে না!
              myGuides.map((guide) => <GuideCard key={guide.id || guide.shareCode} guide={guide} isExplore={true} />)
            ) : (

              
              <View className="items-center justify-center py-16 px-6 mt-4 bg-white rounded-[24px] border-2 border-[#E5E5E5] border-dashed">
                <View className="w-20 h-20 bg-[#FFF4E5] rounded-full items-center justify-center mb-4">
                  <FontAwesome5 name="users" size={32} color="#D47B00" solid />
                </View>
                <Text className="text-[20px] text-[#3C3C3C] text-center mb-2" style={{ fontFamily: 'BanglaBold' }}>
                  স্কোয়াড ফাঁকা!
                </Text>
                <Text className="text-[14px] text-[#777777] text-center leading-6" style={{ fontFamily: 'BanglaRegular' }}>
                  আপনি এখনো কোনো কমিউনিটিতে জয়েন করেননি। হোমপেইজ থেকে পছন্দমতো স্কোয়াডে যুক্ত হোন।
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* 🚀 Edit Modal for Creators */}
      {editingGuide && (
        <Modal visible={editModalVisible} animationType="slide" transparent={false} onRequestClose={() => setEditModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F7F9FA] pt-10">
           <View className="flex-row items-center justify-between px-5 pb-4 pt-2 bg-white border-b border-[#E5E5E5]">
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 -ml-2">
                <FontAwesome5 name="times" size={18} color="#777777" />
              </TouchableOpacity>
              <Text className="text-[18px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>গাইড এডিট করুন</Text>
              <TouchableOpacity onPress={saveMetadataEdits} disabled={isImageUploading} className={`p-2 -mr-2 ${isImageUploading ? 'opacity-50' : 'opacity-100'}`}>
                <Text className="text-[#1899D6] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>{isImageUploading ? '⏳' : 'সেভ'}</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity activeOpacity={0.85} onPress={pickEditThumbnail} className="mb-6">
                <View className="w-full aspect-[16/9] rounded-[20px] overflow-hidden border-2 border-[#E5E5E5] relative bg-white items-center justify-center shadow-sm">
                  {editingGuide.thumbnail ? (
                    <Image source={{ uri: editingGuide.thumbnail }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <FontAwesome5 name="image" size={32} color="#E5E5E5" />
                  )}
                  <View className="absolute bottom-3 right-3 bg-black/60 px-3 py-1.5 rounded-lg flex-row items-center">
                    <FontAwesome5 name="camera" size={12} color="#FFF" />
                    <Text className="text-white text-[12px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>কভার বদলান</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View className="bg-white p-5 rounded-[20px] border border-[#E5E5E5] mb-10 shadow-sm">
                <View className="flex-row items-center justify-between mb-6 bg-[#F9F9F9] p-3 rounded-xl border border-[#F0F0F0]">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${editingGuide.isPublic ? 'bg-[#1899D6]/10' : 'bg-[#777777]/10'}`}>
                      <FontAwesome5 name={editingGuide.isPublic ? "globe-asia" : "lock"} size={16} color={editingGuide.isPublic ? "#1899D6" : "#777777"} />
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className={`text-[15px] pt-0.5 ${editingGuide.isPublic ? 'text-[#1899D6]' : 'text-[#4B4B4B]'}`} style={{ fontFamily: 'BanglaBold' }}>
                        {editingGuide.isPublic ? 'পাবলিক গাইড' : 'প্রাইভেট গাইড'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => setEditingGuide({...editingGuide, isPublic: !editingGuide.isPublic})}
                    className={`w-12 h-7 rounded-full p-1 justify-center ${editingGuide.isPublic ? 'bg-[#58A700]' : 'bg-[#D7D7D7]'}`}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm ${editingGuide.isPublic ? 'self-end' : 'self-start'}`} />
                  </TouchableOpacity>
                </View>

                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>গাইডের নাম</Text>
                <TextInput 
                  className="bg-[#F9F9F9] p-4 rounded-[16px] mb-5 border border-[#E5E5E5] text-[#3C3C3C] text-[15px]" 
                  style={{ fontFamily: 'BanglaBold' }} 
                  value={editingGuide.notebookName || ''} 
                  onChangeText={t => setEditingGuide({...editingGuide, notebookName: t})} 
                />
                
                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>চ্যাপ্টার / বিষয়</Text>
                <TextInput 
                  className="bg-[#F9F9F9] p-4 rounded-[16px] mb-5 border border-[#E5E5E5] text-[#3C3C3C] text-[15px]" 
                  style={{ fontFamily: 'BanglaBold' }} 
                  value={editingGuide.chapter || ''} 
                  onChangeText={t => setEditingGuide({...editingGuide, chapter: t})} 
                />

                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>ইন্ট্রোডাকশন / ডেসক্রিপশন</Text>
                <TextInput 
                  className="bg-[#F9F9F9] p-4 rounded-[16px] border border-[#E5E5E5] min-h-[100px] text-[#3C3C3C] text-[15px]" 
                  style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }} 
                  multiline 
                  value={editingGuide.description || ''} 
                  onChangeText={t => setEditingGuide({...editingGuide, description: t})} 
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      )}

     <PorarPageEyeComfort 
        visible={isLessonVisible} 
        onClose={() => setLessonVisible(false)} 
        lessonItem={selectedLesson} 
      />
    </View>
  );
}