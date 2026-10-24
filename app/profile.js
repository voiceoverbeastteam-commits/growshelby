import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, Alert, Linking, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Bottombar from '../components/Bottombar';
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';
import PorarPageEyeComfort from '../components/PorarPageEyeComfort';
import { Animated } from 'react-native';

// 🚀 প্রোফাইল ও কমিউনিটি শিমার ইফেক্ট
const ProfileSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="items-center mt-10 mb-4 px-5 w-full">
      <View className="w-28 h-28 rounded-full bg-[#E5E5E5] mb-4 border-4 border-[#F5F5F5]" />
      <View className="w-40 h-6 bg-[#E5E5E5] rounded-full mb-2" />
      <View className="w-24 h-4 bg-[#E5E5E5] rounded-full mb-6" />
      <View className="flex-row items-center justify-between w-full mt-2 px-3">
        <View className="w-12 h-12 rounded-full bg-[#E5E5E5]" />
        <View className="flex-1 mx-3 h-12 rounded-full bg-[#E5E5E5]" />
        <View className="w-12 h-12 rounded-full bg-[#E5E5E5]" />
      </View>
    </Animated.View>
  );
};

const CommunityCardSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-white rounded-[20px] border border-[#E5E5E5] overflow-hidden shadow-sm mt-3">
      <View className="w-full aspect-[16/9] bg-[#E5E5E5]" />
      <View className="p-4">
        <View className="flex-row mb-4">
          <View className="w-11 h-11 rounded-full bg-[#E5E5E5] mr-3" />
          <View className="flex-1 justify-center">
            <View className="w-3/4 h-5 bg-[#E5E5E5] rounded-full mb-2" />
            <View className="w-1/2 h-3 bg-[#E5E5E5] rounded-full" />
          </View>
        </View>
        <View className="w-full h-3 bg-[#E5E5E5] rounded-full mb-2" />
        <View className="w-4/5 h-3 bg-[#E5E5E5] rounded-full mb-5" />
        <View className="flex-row space-x-3">
          <View className="flex-1 h-12 bg-[#E5E5E5] rounded-[12px]" />
          <View className="w-16 h-12 bg-[#E5E5E5] rounded-[12px]" />
        </View>
      </View>
    </Animated.View>
  );
};

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen() {
  const router = useRouter(); 
  
  const [isProfileLoading, setIsProfileLoading] = useState(true); // 🚀 শিমার স্টেট

  // 🚀 User Personal States
  const [userName, setUserName] = useState("শিক্ষার্থী");
  const [userEmail, setUserEmail] = useState("guest");
  const [avatarUrl, setAvatarUrl] = useState("https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
  
  // 🚀 Reader Specific Stats
  const [savedGuidesCount, setSavedGuidesCount] = useState(0);
  const [studyStreak, setStudyStreak] = useState(1);

  // 🚀 Community (Creator) States
  const [isCreator, setIsCreator] = useState(false);
  const [commName, setCommName] = useState("");
  const [commBanner, setCommBanner] = useState("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop");
  const [commDesc, setCommDesc] = useState("");
  const [commRating, setCommRating] = useState("নতুন");
  // 🚀 রিয়েল মেম্বার ও রেটিং ফেচ করার স্টেট
  const [realCommRating, setRealCommRating] = useState("নতুন");
  const [realCommMembers, setRealCommMembers] = useState(1);

  useEffect(() => {
    if (isCreator && userEmail && userEmail !== 'guest') {
      Promise.all([
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'get_reviews', guideId: userEmail })
        }).then(res => res.json()).catch(() => ({})),
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'get_community_members', guideId: userEmail, limit: 1, skip: 0 })
        }).then(res => res.json()).catch(() => ({}))
      ]).then(([reviewData, memberData]) => {
        if (reviewData.success && reviewData.reviews && reviewData.reviews.length > 0) {
          const total = reviewData.reviews.reduce((sum, r) => sum + r.rating, 0);
          setRealCommRating((total / reviewData.reviews.length).toFixed(1));
        }
        if (memberData.success && memberData.totalMembers !== undefined) {
          setRealCommMembers(memberData.totalMembers > 0 ? memberData.totalMembers : 1);
        }
      });
    }
  }, [isCreator, userEmail]);

  // 🚀 Settings & Modals
  const [isPremiumModalVisible, setPremiumModalVisible] = useState(false);
  const isPremium = false; 
  const [waNumber, setWaNumber] = useState("8801700000000");

 // 🚀 সার্ভার থেকে রিয়েল হোয়াটসঅ্যাপ নাম্বার নিয়ে আসার লজিক
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 🚀 ম্যাজিক ফিক্স: লিংকের শেষে ?t=Date.now() দিলে অ্যাপ আর পুরনো ডাটা ধরে রাখবে না, সবসময় সার্ভার থেকে একদম ফ্রেশ ডাটা আনবে!
        const res = await fetch(`https://growshelby-api.vercel.app/api/get_settings?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        
        if (data && data.whatsappNumber) {
          setWaNumber(data.whatsappNumber);
        }
      } catch (error) {
        console.log("হোয়াটসঅ্যাপ নাম্বার ফেচ এরর:", error);
      }
    };
    
    fetchSettings();
  }, []);

  // Modals
  const [isSetupModalVisible, setIsSetupModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // Temp states for Community Forms
  const [tempCommName, setTempCommName] = useState("");
  const [tempCommBanner, setTempCommBanner] = useState("");
  const [tempCommDesc, setTempCommDesc] = useState("");
  
  // 🚀 নতুন ক্যাটাগরি স্টেট ও লিস্ট
  const [commNiche, setCommNiche] = useState("এইচএসসি (HSC)"); 
  const [tempCommNiche, setTempCommNiche] = useState("এইচএসসি (HSC)"); 
  const targetCategories = [
    'ষষ্ঠ-১০ম শ্রেণি', 
    'এসএসসি (SSC)', 
    'এইচএসসি (HSC)', 
    'বিশ্ববিদ্যালয় ভর্তি', 
    'মেডিকেল', 
    'ইঞ্জিনিয়ারিং', 
    'বিসিএস (BCS)', 
    'আইইএলটিএস (IELTS)', 
    'অন্যান্য'
  ];
  const [setupStep, setSetupStep] = useState(1); // 🚀 Step Tracking
  // 🚀 Personal Profile Edit States
  const [isProfileEditModalVisible, setIsProfileEditModalVisible] = useState(false);
  const [tempUserName, setTempUserName] = useState("");
  const [tempAvatarUrl, setTempAvatarUrl] = useState("");
  const [isImageUploading, setIsImageUploading] = useState(false);

 // 🚀 ImgBB Upload Helper (Profile Page)
  const uploadToImgBB = async (base64String) => {
    try {
      let formData = new FormData();
      formData.append("image", base64String);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=266dc6accf170af21b0a679770bcd7bb`, { method: "POST", body: formData });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (e) { return null; }
  };

  const handlePickTempAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri, [{ resize: { width: 400 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      if (manipResult.base64) {
        setTempAvatarUrl(`data:image/jpeg;base64,${manipResult.base64}`); 
        setIsImageUploading(true); // 🚀 বাটন লক
        const imgUrl = await uploadToImgBB(manipResult.base64); 
        if (imgUrl) setTempAvatarUrl(imgUrl);
        setIsImageUploading(false); // 🚀 বাটন আনলক
      }
    }
  };

  const handleSavePersonalProfile = async () => {
    if (tempUserName.trim() === '') return Alert.alert("সতর্কতা", "নাম ফাঁকা রাখা যাবে না!");
    
    setUserName(tempUserName.trim());
    if (tempAvatarUrl) setAvatarUrl(tempAvatarUrl);

    await AsyncStorage.setItem(`@user_name_${userEmail}`, tempUserName.trim());
    if (tempAvatarUrl) await AsyncStorage.setItem(`@user_avatar_${userEmail}`, tempAvatarUrl);

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({
          action: 'update_profile',
          email: userEmail,
          name: tempUserName.trim(),
          avatar: tempAvatarUrl || avatarUrl
        })
      });
    } catch (e) {}

    setIsProfileEditModalVisible(false);
  };
  // 🚀 Community View States
  const [isCommunityViewVisible, setIsCommunityViewVisible] = useState(false);
  const [communityDataForView, setCommunityDataForView] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const uid = await AsyncStorage.getItem('@current_user_id') || 'guest';
          setUserEmail(uid);
          
          let savedName = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || "শিক্ষার্থী";
          setUserName(savedName);

          let savedAvatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || await AsyncStorage.getItem('@user_avatar') || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
          setAvatarUrl(savedAvatar);
          
          // Check Identity Status
          const creatorStatus = await AsyncStorage.getItem(`@is_creator_${uid}`);
          setIsCreator(creatorStatus === 'true');

       // 🚀 Load Community Data (With Auto Restore Magic)
          let needsServerSync = false;

          if (creatorStatus === 'true') {
            let savedCommName = await AsyncStorage.getItem(`@comm_name_${uid}`);
            let savedBanner = await AsyncStorage.getItem(`@comm_banner_${uid}`);
            let savedDesc = await AsyncStorage.getItem(`@comm_desc_${uid}`);

            if (savedCommName) setCommName(savedCommName);
            if (savedBanner) setCommBanner(savedBanner);
            if (savedDesc) setCommDesc(savedDesc);

            // 🚀 ম্যাজিক ফিক্স: অ্যান্ড্রয়েড ব্যাকআপ যদি বিশাল সাইজের ব্যানার রিস্টোর করতে না পারে, 
            // তখন সার্ভার থেকে ফ্রেশ ডেটা টানতে হবে!
            if (!savedBanner || !savedCommName) {
              needsServerSync = true;
            }
          } else {
            needsServerSync = true;
          }

          if (needsServerSync) {
            // 🚀 RESTORE LOGIC: সার্ভার থেকে ডাটা আনবে
            try {
              const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
                body: JSON.stringify({ action: 'sync_profile', email: uid })
              });
              const data = await res.json();
              
              // 🚀 স্মার্ট রিস্টোর: ডাটাবেস থেকে পারফেক্ট ব্যানার ও বায়ো রিসিভ করবে
              if (data.success && (data.banner || data.communityName)) {
                setIsCreator(true);
                setCommName(data.communityName || "আমার কমিউনিটি"); 
                
              const defaultBanner = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop";
                setCommBanner(data.banner || defaultBanner);
                setCommDesc(data.bio || "");
                setCommNiche(data.niche || "এইচএসসি (HSC)"); // 🔥 ক্যাটাগরি রিস্টোর হবে


                // লোকাল স্টোরেজে আবার সেভ করে দিচ্ছি
                await AsyncStorage.setItem(`@is_creator_${uid}`, 'true');
                await AsyncStorage.setItem(`@comm_name_${uid}`, data.communityName || "আমার কমিউনিটি"); 
                await AsyncStorage.setItem(`@comm_banner_${uid}`, data.banner || defaultBanner);
                if(data.bio) await AsyncStorage.setItem(`@comm_desc_${uid}`, data.bio);
              }
            } catch (e) {
              console.log("Restore error:", e);
            }
          }
          // Load Reader Stats
        // Load Reader Stats
            const savedData = await AsyncStorage.getItem(`@shelby_guides_${uid}`);
            if (savedData) {
               const guides = JSON.parse(savedData);
               setSavedGuidesCount(guides.length);
            }

        } catch (error) {
            console.log("Error loading user profile:", error);
          } finally {
            // 🚀 ম্যাজিক: শিমার থেকে আসল ডাটায় যাওয়ার সময় ধুপধাপ না করে একদম স্মুথলি ট্রানজিশন (Fade in) হবে!
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsProfileLoading(false); // 🚀 ডাটা লোড শেষ, শিমার অফ
          }
        };
        
        loadUserData();
    }, [])
  );

 // 🚀 Change Personal Avatar
  const handlePickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      // 🚀 ম্যাজিক: ছবিটাকে ছোট ও কম্প্রেস করা হচ্ছে
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }], 
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipResult.base64) {
        const base64Img = `data:image/jpeg;base64,${manipResult.base64}`;
        setAvatarUrl(base64Img);
       
      }
    }
  };

 // 🚀 Pick Banner for Community
  const handlePickBanner = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri, [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipResult.base64) {
        setTempCommBanner(`data:image/jpeg;base64,${manipResult.base64}`); 
        setIsImageUploading(true); // 🚀 বাটন লক
        const imgUrl = await uploadToImgBB(manipResult.base64); 
        if (imgUrl) setTempCommBanner(imgUrl);
        setIsImageUploading(false); // 🚀 বাটন আনলক
      }
    }
  };

  const handleEnterCommunity = () => {
    // 🚀 ফিক্স: ডেটা পাঠানোর সময় নামগুলো সঠিক বক্সে প্যাক করা হচ্ছে
    const myCommunityData = {
      id: userEmail,
      notebookName: commName,      // 🎯 কমিউনিটির অরিজিনাল নাম (যেমন: প্রি টেস্ট মাস্টারি...)
      creatorName: userName,       // 🎯 আপনার নিজের নাম (যেমন: Sakib)
      creatorAvatar: avatarUrl,
      creatorEmail: userEmail,
      niche: "আমার কমিউনিটি", 
      banner: commBanner,
      bio: commDesc,
      isFromExplore: true, 
      channelId: userEmail,
    };
    setCommunityDataForView(myCommunityData);
    setIsCommunityViewVisible(true);
  };


  // 🚀 Step Navigation & Validation
  const handleNextStep = () => {
    if (setupStep === 1 && tempCommName.trim() === '') {
      return Alert.alert("সতর্কতা", "কমিউনিটির একটি নাম দিন!");
    }
    if (setupStep === 2 && tempCommDesc.trim() === '') {
      return Alert.alert("সতর্কতা", "কমিউনিটির উদ্দেশ্যে কিছু লিখুন!");
    }
    if (setupStep === 3 && !tempCommBanner) {
      return Alert.alert("সতর্কতা", "কভার ছবি ছাড়া কমিউনিটি তৈরি করা যাবে করণ!");
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (setupStep < 3) {
      setSetupStep(setupStep + 1);
    } else {
      handleCreateCommunity();
    }
  };

  // 🚀 Create Community Action (Frontend & Backend Sync)
  const handleCreateCommunity = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
   setCommName(tempCommName.trim());
    setCommDesc(tempCommDesc.trim());
    if (tempCommBanner) setCommBanner(tempCommBanner);
    setCommNiche(tempCommNiche); // 🔥 লোকাল স্টেটে ক্যাটাগরি সেভ
    setIsCreator(true);
    
    await AsyncStorage.setItem(`@comm_name_${userEmail}`, tempCommName.trim());
    await AsyncStorage.setItem(`@comm_desc_${userEmail}`, tempCommDesc.trim());
    await AsyncStorage.setItem(`@comm_niche_${userEmail}`, tempCommNiche); // 🔥 লোকাল স্টোরেজে ক্যাটাগরি সেভ
    
    await AsyncStorage.setItem(`@is_creator_${userEmail}`, 'true');

    // 🚀 ROOT CAUSE FIX: Syncing Immediately to Backend to wipe out old cache
    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({
          action: 'update_channel_profile',
          channelId: userEmail,
          notebookName: tempCommName.trim(),
          banner: tempCommBanner || commBanner,
          bio: tempCommDesc.trim(),
          niche: tempCommNiche // 🔥 টার্গেট ক্যাটাগরি সার্ভারে সেভ হবে
        })
      });
    } catch (e) {
      console.log("Backend Sync Error:", e);
    }

    setIsSetupModalVisible(false);
  };

  // 🚀 Save Edited Community Info (Frontend & Backend Sync)
  const handleSaveCommunity = async () => {
    if (tempCommName.trim() === '') return Alert.alert("সতর্কতা", "কমিউনিটির নাম ফাঁকা রাখা যাবে না!");
    
    setCommName(tempCommName.trim());
    if (tempCommBanner) setCommBanner(tempCommBanner);
    setCommDesc(tempCommDesc.trim());
    setCommNiche(tempCommNiche); // 🔥 লোকাল স্টেটে ক্যাটাগরি সেভ
    
    await AsyncStorage.setItem(`@comm_name_${userEmail}`, tempCommName.trim());
    await AsyncStorage.setItem(`@comm_desc_${userEmail}`, tempCommDesc.trim());
    await AsyncStorage.setItem(`@comm_niche_${userEmail}`, tempCommNiche); // 🔥 লোকাল স্টোরেজে ক্যাটাগরি সেভ
    
    // 🚀 ROOT CAUSE FIX: Syncing Immediately to Backend to wipe out old cache
    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
       body: JSON.stringify({
          action: 'update_channel_profile',
          channelId: userEmail,
          notebookName: tempCommName.trim(),
          banner: tempCommBanner || commBanner,
          bio: tempCommDesc.trim(),
          niche: tempCommNiche // 🚀 ম্যাজিক ফিক্স: আগে এই লাইনটা মিসিং ছিল! তাই ক্যাটাগরি সেভ হতো না।
        })
      });
    } catch (e) {
      console.log("Backend Sync Error:", e);
    }

    setIsEditModalVisible(false);
  };

  // 🚀 Delete Community Action
  const handleDeleteCommunity = () => {
    Alert.alert(
      "কমিউনিটি ডিলিট",
      "আপনি কি নিশ্চিত যে আপনি আপনার কমিউনিটি মুছে ফেলতে চান?",
      [
        { text: "না", style: "cancel" },
        { 
          text: "হ্যাঁ, মুছুন", 
          style: "destructive",
          onPress: async () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsCreator(false);
            setCommName("");
            setCommDesc("");
            
            await AsyncStorage.removeItem(`@comm_name_${userEmail}`);
            await AsyncStorage.removeItem(`@comm_desc_${userEmail}`);
            await AsyncStorage.removeItem(`@comm_banner_${userEmail}`);
            await AsyncStorage.setItem(`@is_creator_${userEmail}`, 'false');
            
           // 🚀 ম্যাজিক ফিক্স: সার্ভার থেকে কমিউনিটি, বই, মেম্বার এবং রেটিংসহ সবকিছু ডিলিট করে দেওয়া হচ্ছে!
            try {
              await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
                body: JSON.stringify({
                  action: 'delete_whole_community',
                  channelId: userEmail
                })
              });
            } catch (e) {
              console.log("Delete sync error:", e);
            }

            setIsEditModalVisible(false);
          }
        }
      ]
    );
  };

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
    const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(err => {
      Alert.alert("দুঃখিত", "হোয়াটসঅ্যাপ ওপেন করতে সমস্যা হচ্ছে।");
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FA]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
         
       {/* ==========================================
             PERSONAL PROFILE SECTION (Always Visible)
         ========================================== */}
         <View className="bg-white pb-6 border-b border-[#E5E5E5] mb-4">
          {isProfileLoading ? (
            <ProfileSkeleton />
          ) : (
            <View className="items-center mt-10 mb-4 px-5">
               {/* 🚀 Avatar (ডিরেক্ট ক্লিক বন্ধ করা হলো) */}
               <View className="w-28 h-28 rounded-full border-4 border-[#F5F5F5] overflow-hidden bg-[#F9F9F9] mb-4 shadow-sm">
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
               </View>
               
               <Text className="text-[26px] text-[#3C3C3C] mb-1" style={{ fontFamily: 'BanglaBold' }}>{userName}</Text>
               <Text className="text-[14px] text-[#777777] mb-4" style={{ fontFamily: 'BanglaRegular' }}>{userEmail}</Text>
               
             {/* 🚀 নতুন অ্যাকশন প্যানেল (WhatsApp | Premium | Settings) */}
               <View className="flex-row items-center justify-between w-full mt-5 px-3">
                 
                 {/* 🚀 বাম পাশে সাপোর্ট (WhatsApp) আইকন */}
                 <TouchableOpacity 
                   activeOpacity={0.8} 
                   onPress={handleWhatsAppReport}
                   className="bg-[#25D366]/10 w-12 h-12 rounded-full items-center justify-center border border-[#25D366]/30"
                 >
                   <FontAwesome5 name="whatsapp" size={22} color="#25D366" />
                 </TouchableOpacity>

                 {/* 🚀 মাঝখানে প্রিমিয়াম আপগ্রেড বাটন */}
                 {!isPremium ? (
                   <TouchableOpacity 
                     activeOpacity={0.8} 
                     onPress={() => setPremiumModalVisible(true)}
                     className="flex-1 mx-3"
                   >
                     <View className="bg-[#D47B00] rounded-full pb-[4px]">
                       <View className="bg-[#FF9600] rounded-full py-3 flex-row justify-center items-center">
                         <FontAwesome5 name="crown" size={16} color="#FFFFFF" solid />
                         <Text className="ml-2 text-[15px] text-white pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আপগ্রেড প্রিমিয়াম</Text>
                       </View>
                     </View>
                   </TouchableOpacity>
                 ) : (
                   <View className="flex-1 mx-3 items-center justify-center py-3 bg-[#FFF4E5] rounded-full border border-[#FFDDAA]">
                      <Text className="text-[15px] text-[#D47B00] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>প্রিমিয়াম ইউজার 👑</Text>
                   </View>
                 )}

                 {/* 🚀 ডান পাশে কাস্টমাইজ প্রোফাইল (Settings/Robot) আইকন */}
                 <TouchableOpacity 
                   activeOpacity={0.8} 
                   onPress={() => {
                     setTempUserName(userName);
                     setTempAvatarUrl("");
                     setIsProfileEditModalVisible(true);
                   }}
                   className="bg-[#1899D6]/10 w-12 h-12 rounded-full items-center justify-center border border-[#1899D6]/30"
                 >
                   <FontAwesome5 name="user-cog" size={18} color="#1899D6" />
               </TouchableOpacity>
                 
               </View>
            </View>
          )}
         
         </View>

       {/* ==========================================
             COMMUNITY SECTION (Button or Card)
         ========================================== */}
         <View className="px-5 mb-6">
            <Text className="text-[18px] text-[#3C3C3C] mb-3 ml-1" style={{ fontFamily: 'BanglaBold' }}>আমার কমিউনিটি 🎯</Text>
            
            {isProfileLoading ? (
              <CommunityCardSkeleton />
            ) : isCreator ? (
               // 🚀 Community Card (Replaces the create button)
              <View className="bg-white rounded-[20px] border border-[#E5E5E5] overflow-hidden shadow-sm">
                 {/* Banner */}
                 <View className="w-full aspect-[16/9] bg-[#E5E5E5] relative">
                    <Image source={{ uri: commBanner }} className="w-full h-full" resizeMode="cover" />
                 </View>
                 
                 <View className="p-4">
                    {/* 🚀 YouTube Style Info Area */}
                    <View className="flex-row mb-3">
                      {/* Creator Avatar */}
                      <View className="w-11 h-11 rounded-full border border-[#E5E5E5] bg-[#F9F9F9] mr-3 overflow-hidden mt-1">
                        <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                      </View>

                      {/* Texts */}
                      <View className="flex-1 justify-center -mt-1">
                        <Text className="text-[#3C3C3C] text-[17px] leading-[26px] pt-1 mb-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>
                          {commName}
                        </Text>

                        <View className="flex-row items-center pr-2">
                          <Text className="text-[#777777] text-[13px] flex-shrink-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                            {userName}
                          </Text>
                          
                          <Text className="text-[#AFAFAF] text-[8px] mx-1.5">●</Text>
                          
                          <View className="flex-row items-center">
                            <FontAwesome5 name="users" size={10} color="#777777" />
                            <Text className="text-[#777777] text-[12px] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                              {realCommMembers}
                            </Text>
                          </View>

                          <Text className="text-[#AFAFAF] text-[8px] mx-1.5">●</Text>

                          <View className="flex-row items-center">
                            <FontAwesome5 name="star" size={10} color="#FF9600" solid={realCommRating !== 'নতুন'} />
                            <Text className="text-[#777777] text-[12px] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                              {realCommRating}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    <Text className="text-[13px] text-[#777777] mb-5 leading-6" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={2}>
                       <Text style={{ color: '#FF4B4B' }}>●</Text> {commDesc}
                    </Text>
                    
                    {/* Action Buttons */}
                    <View className="flex-row space-x-3">
                      <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={handleEnterCommunity}
                          className="flex-1 bg-[#1899D6] py-3 rounded-[12px] items-center flex-row justify-center shadow-sm"
                       >
                         <FontAwesome5 name="sign-in-alt" size={14} color="#FFFFFF" />
                         <Text className="text-white text-[15px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>ইন্টার কমিউনিটি</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={() => {
                            setTempCommName(commName);
                             setTempCommBanner(commBanner);
                             setTempCommDesc(commDesc);
                             setTempCommNiche(commNiche); // 🔥 অরিজিনাল টার্গেট সেট
                             setIsEditModalVisible(true);
                          }}
                          className="bg-[#F9F9F9] py-3 px-5 rounded-[12px] items-center border border-[#E5E5E5] justify-center"
                       >
                         <FontAwesome5 name="pen" size={14} color="#777777" />
                      </TouchableOpacity>
                    </View>
                 </View>
               </View>
            ) : (
               // 🚀 Create Community Button
               <TouchableOpacity 
                 activeOpacity={0.8} 
                 onPress={() => {
                  setTempCommName("");
                 setTempCommDesc("");
                 setTempCommBanner("");
                 setTempCommNiche("এইচএসসি (HSC)"); // 🔥 ডিফল্ট টার্গেট সেট
                 setSetupStep(1);
                   setIsSetupModalVisible(true);
                 }}
                 className="bg-white p-4 rounded-[20px] border-2 border-[#1899D6]/30 border-dashed flex-row items-center justify-between shadow-sm py-6"
               >
                 <View className="flex-row items-center">
                   <View className="w-12 h-12 bg-[#1899D6]/10 rounded-full items-center justify-center mr-4">
                      <FontAwesome5 name="users" size={20} color="#1899D6" />
                   </View>
                   <View>
                      <Text className="text-[18px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি তৈরি করুন</Text>
                      <Text className="text-[13px] text-[#AFAFAF] pt-0.5" style={{ fontFamily: 'BanglaRegular' }}>স্টুডেন্টদের জন্য স্পেসিফিক টার্গেট</Text>
                   </View>
                 </View>
                 <View className="bg-[#F5F5F5] w-8 h-8 rounded-full items-center justify-center">
                   <FontAwesome5 name="chevron-right" size={12} color="#777777" />
                 </View>
               </TouchableOpacity>
            )}
         </View>

         {/* ==========================================
             SETTINGS & ACTIONS (Only Logout)
         ========================================== */}
         <View className="px-5 items-center mt-2">
            <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} className="w-full max-w-[340px]">
              <View className="bg-[#D63939] rounded-[16px] pb-[6px]">
                <View className="bg-[#FF4B4B] rounded-[16px] py-4 flex-row justify-center items-center">
                  <FontAwesome5 name="sign-out-alt" size={20} color="#FFFFFF" solid />
                  <Text className="ml-3 text-[18px] text-white pt-1" style={{ fontFamily: 'BanglaBold' }}>লগআউট করুন</Text>
                </View>
              </View>
            </TouchableOpacity>
         </View>
      </ScrollView>

{/* 🚀 0. Personal Profile Edit Modal */}
      <Modal visible={isProfileEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsProfileEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F7F9FA] justify-start pt-12">
          <View className="flex-row items-center justify-between px-5 pb-4 bg-white border-b border-[#E5E5E5]">
            <TouchableOpacity onPress={() => setIsProfileEditModalVisible(false)} className="p-2 -ml-2">
               <FontAwesome5 name="times" size={18} color="#777777" />
            </TouchableOpacity>
          <Text className="text-[18px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রোফাইল কাস্টমাইজ</Text>
            <TouchableOpacity onPress={handleSavePersonalProfile} disabled={isImageUploading} className={`p-2 -mr-2 ${isImageUploading ? 'opacity-50' : 'opacity-100'}`}>
               <Text className="text-[16px] text-[#1899D6] pt-1" style={{ fontFamily: 'BanglaBold' }}>{isImageUploading ? '⏳' : 'সেভ'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            
            <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>প্রোফাইল ছবি</Text>
            <View className="items-center mb-6">
              <TouchableOpacity activeOpacity={0.8} onPress={handlePickTempAvatar}>
                <View className="w-28 h-28 rounded-full border-4 border-[#F5F5F5] overflow-hidden bg-[#F9F9F9] relative shadow-sm">
                  <Image source={{ uri: tempAvatarUrl || avatarUrl }} className="w-full h-full" resizeMode="cover" />
                  <View className="absolute inset-0 bg-black/40 items-center justify-center">
                    <FontAwesome5 name="camera" size={20} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>আপনার নাম</Text>
            <TextInput
              className="bg-white p-4 rounded-[16px] text-[16px] text-[#3C3C3C] mb-5 border border-[#E5E5E5]"
              style={{ fontFamily: 'BanglaBold' }}
              value={tempUserName}
              onChangeText={setTempUserName}
              placeholder="আপনার পুরো নাম লিখুন"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>


      {/* 🚀 1. Community Setup Modal (Step-by-Step) */}
      <Modal visible={isSetupModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsSetupModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F7F9FA] justify-start pt-12">
          <View className="flex-row items-center justify-between px-5 pb-4 bg-white border-b border-[#E5E5E5]">
            <TouchableOpacity onPress={() => setIsSetupModalVisible(false)} className="p-2 -ml-2">
               <FontAwesome5 name="times" size={18} color="#777777" />
            </TouchableOpacity>
            <Text className="text-[18px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি তৈরি করুন</Text>
            <View className="flex-row space-x-1">
              {[1, 2, 3].map((step) => (
                <View key={step} className={`h-2 rounded-full ${setupStep >= step ? 'w-4 bg-[#1899D6]' : 'w-2 bg-[#E5E5E5]'}`} />
              ))}
            </View>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-[#1899D6]/10 rounded-full items-center justify-center mb-3">
                <FontAwesome5 name="users" size={24} color="#1899D6" />
              </View>
              <Text className="text-[20px] text-[#3C3C3C] text-center mb-2" style={{ fontFamily: 'BanglaBold' }}>স্টুডেন্টদের একত্রিত করুন!</Text>
              <Text className="text-[14px] text-[#777777] text-center px-4 leading-6" style={{ fontFamily: 'BanglaRegular' }}>
                একটি স্পেসিফিক টার্গেট নিয়ে কমিউনিটি বানান যেখানে সবাই একসাথে পড়াশোনা করতে পারবে।
              </Text>
            </View>

          {/* Step 1: Name & Target */}
            {setupStep === 1 && (
              <View>
                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটির নাম <Text className="text-[#FF4B4B]">*</Text></Text>
                <TextInput
                  className="bg-white p-4 rounded-[16px] text-[16px] text-[#3C3C3C] mb-5 border border-[#E5E5E5]"
                  style={{ fontFamily: 'BanglaBold' }}
                  value={tempCommName}
                  onChangeText={setTempCommName}
                  placeholder="যেমন: প্রি-টেস্ট A+ চ্যালেঞ্জ..."
                  autoFocus
                />

                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1 mt-2" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটির টার্গেট / সেকশন <Text className="text-[#FF4B4B]">*</Text></Text>
                <View className="flex-row flex-wrap gap-2 mb-8">
                  {targetCategories.map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => setTempCommNiche(cat)}
                      className={`px-4 py-2 rounded-full border ${tempCommNiche === cat ? 'bg-[#1899D6] border-[#1899D6]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}
                    >
                      <Text className={`text-[13px] pt-0.5 ${tempCommNiche === cat ? 'text-white' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 2: Description */}
            {setupStep === 2 && (
              <View>
                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটির উদ্দেশ্য (ডেসক্রিপশন) <Text className="text-[#FF4B4B]">*</Text></Text>
                <TextInput
                  className="bg-white p-4 rounded-[16px] text-[15px] text-[#3C3C3C] mb-8 border border-[#E5E5E5] min-h-[100px]"
                  style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                  value={tempCommDesc}
                  onChangeText={setTempCommDesc}
                  placeholder="এই কমিউনিটিতে কী কী পড়ানো হবে বা এর মূল লক্ষ্য কী..."
                  multiline
                  autoFocus
                />
              </View>
            )}

            {/* Step 3: Banner */}
            {setupStep === 3 && (
              <View>
                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কভার ফটো (বাধ্যতামূলক) <Text className="text-[#FF4B4B]">*</Text></Text>
                <TouchableOpacity activeOpacity={0.8} onPress={handlePickBanner} className="mb-8">
                  <View className="w-full h-40 rounded-[16px] border-2 border-[#E5E5E5] border-dashed overflow-hidden bg-[#F9F9F9] items-center justify-center relative">
                    {tempCommBanner ? (
                      <Image source={{ uri: tempCommBanner }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="items-center">
                        <FontAwesome5 name="image" size={28} color="#1CB0F6" className="mb-3" />
                        <Text className="text-[#1899D6] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>কভার ছবি সিলেক্ট করুন</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-center justify-between w-full space-x-3">
              {setupStep > 1 && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSetupStep(setupStep - 1); }} className="flex-1 bg-[#E5E5E5] py-4 rounded-[16px] items-center">
                  <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>পেছনে যান</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity activeOpacity={0.8} onPress={handleNextStep} className="flex-[2]">
                <View className="bg-[#1899D6] rounded-[16px] pb-[6px]">
                  <View className="bg-[#1CB0F6] rounded-[16px] py-4 flex-row justify-center items-center">
                    <Text className="text-white text-[18px] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                      {setupStep < 3 ? 'পরের ধাপ' : 'কমিউনিটি তৈরি করো 🎉'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🚀 2. Edit Community Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-[#F7F9FA] justify-start pt-12">
          <View className="flex-row items-center justify-between px-5 pb-4 bg-white border-b border-[#E5E5E5]">
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="p-2 -ml-2">
               <FontAwesome5 name="times" size={18} color="#777777" />
            </TouchableOpacity>
           <Text className="text-[18px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি কাস্টমাইজ</Text>
            <TouchableOpacity onPress={handleSaveCommunity} disabled={isImageUploading} className={`p-2 -mr-2 ${isImageUploading ? 'opacity-50' : 'opacity-100'}`}>
               <Text className="text-[16px] text-[#1899D6] pt-1" style={{ fontFamily: 'BanglaBold' }}>{isImageUploading ? '⏳' : 'সেভ'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            
           <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কভার ফটো</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePickBanner} className="mb-6">
              {/* 🚀 ফিক্স: h-36 এর বদলে aspect-[16/9] দেওয়া হয়েছে যাতে ছবিটা একদম পারফেক্ট সাইজে দেখায় */}
              <View className="w-full aspect-[16/9] rounded-[16px] border border-[#E5E5E5] overflow-hidden bg-[#F5F5F5] relative shadow-sm">
                <Image source={{ uri: tempCommBanner || commBanner }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <FontAwesome5 name="camera" size={24} color="#FFFFFF" />
                  <Text className="text-white text-[12px] mt-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ব্যানার পরিবর্তন</Text>
                </View>
              </View>
            </TouchableOpacity>

           <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটির নাম</Text>
            <TextInput
              className="bg-white p-4 rounded-[16px] text-[16px] text-[#3C3C3C] mb-5 border border-[#E5E5E5]"
              style={{ fontFamily: 'BanglaBold' }}
              value={tempCommName}
              onChangeText={setTempCommName}
            />

            <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটির টার্গেট / সেকশন</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {targetCategories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => setTempCommNiche(cat)}
                  className={`px-4 py-2 rounded-full border ${tempCommNiche === cat ? 'bg-[#1899D6] border-[#1899D6]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}
                >
                  <Text className={`text-[13px] pt-0.5 ${tempCommNiche === cat ? 'text-white' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটির ডেসক্রিপশন</Text>
            <TextInput
              className="bg-white p-4 rounded-[16px] text-[15px] text-[#3C3C3C] mb-8 border border-[#E5E5E5] min-h-[100px]"
              style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
              value={tempCommDesc}
              onChangeText={setTempCommDesc}
              multiline
            />

            {/* 🚀 Delete Community Button for Testing */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleDeleteCommunity} className="w-full mt-4 mb-8">
              <View className="bg-[#D63939] rounded-[16px] pb-[6px]">
                <View className="bg-[#FF4B4B] rounded-[16px] py-4 flex-row justify-center items-center">
                  <FontAwesome5 name="trash-alt" size={16} color="#FFFFFF" solid />
                  <Text className="ml-2 text-[16px] text-white pt-1" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি ডিলিট করুন</Text>
                </View>
              </View>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🚀 Community View Render */}
      <PorarPageEyeComfort 
        visible={isCommunityViewVisible} 
        onClose={() => setIsCommunityViewVisible(false)} 
        lessonItem={communityDataForView} 
      />

      
      <PremiumUpgradeModal visible={isPremiumModalVisible} onClose={() => setPremiumModalVisible(false)} />
      <Bottombar />
    </SafeAreaView>
  );
}