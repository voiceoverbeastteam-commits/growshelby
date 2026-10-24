import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, Animated, ScrollView, Image, Modal, Linking, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Camera } from 'expo-camera'; 
import { processWithMasterMind } from './AiMasterMind'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const AI_STEPS = [
  { text: "এআই তোমার দেওয়া ডেটা পড়া শুরু করেছে...", icon: "eye" },
  { text: "ছবি ও টেক্সট থেকে ইনফরমেশন আলাদা করা হচ্ছে...", icon: "microchip" },
  { text: "সবচেয়ে গুরুত্বপূর্ণ টপিকগুলো ফিল্টার করা হচ্ছে...", icon: "filter" },
  { text: "স্মার্ট কুইজ এবং ব্রেইন-টিজার তৈরি করা হচ্ছে...", icon: "brain" },
  { text: "ম্যাজিকের মতো গেম লেভেল সাজানো হচ্ছে...", icon: "magic" },
  { text: "ফিনিশিং টাচ! সবকিছু পারফেক্ট করা হচ্ছে...", icon: "gem" }
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AiBadassContentGenerationEngine({ onLessonGenerated, onCancel, userCoins, setUserCoins }) {
  const [generationState, setGenerationState] = useState('idle'); 
  
  const [notebookName, setNotebookName] = useState("");
  const [capturedImages, setCapturedImages] = useState([]);
  
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [savedText, setSavedText] = useState(""); 
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [waNumber, setWaNumber] = useState("8801700000000"); 
  const [waMessage, setWaMessage] = useState("ভাই আমি প্রিমিয়াম আপগ্রেড করতে চাই গ্রোশেলপি অ্যাপের। কিভাবে করতে পারি?"); 

  const MAX_CHARS = 4000;
  const MIN_CHARS = 50;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current; 

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
    Animated.parallel([
      Animated.spring(slideAnim, { 
        toValue: 0, 
        friction: 6, 
        tension: 45, 
        useNativeDriver: true 
      }),
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 300, 
        useNativeDriver: true 
      })
    ]).start();
  }, [slideAnim, fadeAnim]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => {
      if (onCancel) onCancel();
    });
  };

  useEffect(() => {
    let stepInterval;

    if (generationState === 'working') {
      setCurrentStepIndex(0);
      stepFadeAnim.setValue(1); 
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start();

      stepInterval = setInterval(() => {
        Animated.timing(stepFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setCurrentStepIndex((prev) => (prev + 1) % AI_STEPS.length);
          Animated.timing(stepFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
      }, 2500);

    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
      if (stepInterval) clearInterval(stepInterval);
      stepFadeAnim.setValue(1); 
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [generationState, pulseAnim, stepFadeAnim]);

  const handleOpenCamera = async () => {
    if (capturedImages.length >= 1) {
      return Alert.alert("লিমিট শেষ!", "প্রতিটি গেমের জন্য সর্বোচ্চ ১টি ছবি যুক্ত করা যাবে।");
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      return Alert.alert("পারমিশন প্রয়োজন", "ছবি তোলার জন্য ক্যামেরার পারমিশন দিন।");
    }
    
    setHasPermission(true);
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          base64: false
        });
        setCapturedImages(prev => [...prev, photo]);
        setIsCameraActive(false); 
      } catch (error) {
        Alert.alert("ত্রুটি", "ছবি তুলতে সমস্যা হয়েছে।");
      }
    }
  };

  const removeImage = (indexToRemove) => {
    setCapturedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveText = () => {
    if (inputText.trim().length < MIN_CHARS) {
      Alert.alert("অল্প লেখা", `এআই-কে ভালোভাবে গেম বানাতে সাহায্য করতে অন্তত ${MIN_CHARS} ক্যারেক্টার লিখতে হবে।`);
      return;
    }
    setSavedText(inputText.trim());
    setIsTextInputVisible(false);
  };

  // 🚀 ডাটাবেসে কয়েন আপডেট করার ফাংশনটি এখানে অ্যাড করা হয়েছে
  const updateCoinsInDatabase = async (costAmount) => {
    try {
      const userEmail = await AsyncStorage.getItem('@current_user_id'); 
      if (!userEmail || userEmail === 'default_user') return;

      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'Growshelby_MVP_Secret_2026'
        },
        body: JSON.stringify({
          email: userEmail,
          cost: costAmount
        })
      });
    } catch (error) {
      console.error("API Call Error:", error);
    }
  };

  const triggerGeneration = async () => {
    if (notebookName.trim() === "") return Alert.alert("নাম দিন", "নোটবুকের জন্য একটি সুন্দর নাম দিন।");
    if (capturedImages.length === 0 && savedText.length === 0) return Alert.alert("তথ্য নেই", "দয়া করে অন্তত একটি ছবি তুলুন অথবা টেক্সট দিন।");
    
    if (userCoins < 10) {
        setGenerationState('server_overloaded');
        return; 
    }

    // 🚀 অ্যাপে এবং সার্ভারে একসাথেই কয়েন কেটে নেওয়া হচ্ছে
    setUserCoins(prev => prev - 10);
    updateCoinsInDatabase(10); 
    setGenerationState('working');

    try {
      const generatedLesson = await processWithMasterMind({
        images: capturedImages, 
        rawText: savedText
      });

      pulseAnim.setValue(1);
      stepFadeAnim.setValue(1);
      setGenerationState('success');
      
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
        ]).start(() => {
          onLessonGenerated(generatedLesson, notebookName.trim());
          setGenerationState('idle');
        });
      }, 1500);

    } catch (error) {
      setGenerationState('server_overloaded');
      // 🚀 সার্ভার বা নেটওয়ার্ক ফেইল করলে কয়েন রিফান্ড করে দেওয়া হবে
      setUserCoins(prev => prev + 10); 
      updateCoinsInDatabase(-10); // মাইনাস দিয়ে সার্ভারে কয়েন ফেরত পাঠানো হলো
    }
  };

  const handlePremiumUpgrade = () => {
    const formattedNumber = waNumber.replace(/[^0-9]/g, ''); 
    const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(waMessage)}`;
    
    Linking.openURL(url).catch(err => {
      Alert.alert("দুঃখিত", "হোয়াটসঅ্যাপ ওপেন করতে সমস্যা হচ্ছে।");
    });
  };

  const isWorking = generationState === 'working' || generationState === 'success';
  const hasData = capturedImages.length > 0 || savedText.length > 0;
  const currentAiStep = AI_STEPS[currentStepIndex];

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="w-full justify-end flex-1">
        <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }} className="bg-white rounded-t-[36px] p-6 pb-10 w-full shadow-2xl border-t-4 border-[#E5E5E5]">
          
          <View className="flex-row items-center justify-between mb-5 border-b-2 border-[#F0F0F0] pb-4">
            <View className="flex-row items-center">
              <View className="bg-[#CE82FF]/20 p-3 rounded-2xl mr-3">
                <FontAwesome5 name="brain" size={22} color="#CE82FF" />
              </View>
              <View>
                <Text className="text-xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>স্মার্ট কন্টেন্ট ইঞ্জিন</Text>
                <Text className="text-sm text-[#777777] mt-0.5 pt-1" style={{ fontFamily: 'BanglaBold' }}>অবশিষ্ট কয়েন: <Text className="text-[#FF9600]">{userCoins}</Text> 🪙</Text>
              </View>
            </View>
            {!isWorking && generationState !== 'premium_locked' && generationState !== 'server_overloaded' && onCancel && (
              <TouchableOpacity onPress={closeWithAnimation} className="bg-[#E5E5E5]/50 p-3 rounded-full">
                <FontAwesome5 name="times" size={16} color="#777777" />
              </TouchableOpacity>
            )}
          </View>

          {generationState === 'server_overloaded' ? (
            <View className="items-center justify-center py-2">
              <View className="bg-[#FFF4E5] w-20 h-20 rounded-full items-center justify-center mb-4 border-[4px] border-[#FFC800]">
                <FontAwesome5 name="hourglass-half" size={28} color="#FF9600" />
              </View>
              
              <Text className="text-[22px] text-[#3C3C3C] text-center px-2 mb-2" style={{ fontFamily: 'BanglaBold' }}>
                ফ্রি সার্ভার ওভারলোডেড
              </Text>
              
              <Text className="text-[15px] text-[#777777] text-center mb-6 px-3 leading-6" style={{ fontFamily: 'BanglaRegular' }}>
                বর্তমানে ফ্রি এআই সার্ভারে অনেক বেশি রিকোয়েস্ট থাকার কারণে তোমার গেমটি তৈরি হতে সমস্যা হচ্ছে। এটি অ্যাপের কোনো ত্রুটি নয়। (তোমার ক্রেডিট ফেরত দেওয়া হয়েছে!)
              </Text>

              <Text className="text-[14.5px] text-[#4B4B4B] text-center mb-3 px-2 leading-5" style={{ fontFamily: 'BanglaBold' }}>
                এই সমস্যাটি সমাধান করতে প্রিমিয়াম আপগ্রেড করো। আপগ্রেড করতে নিচের বাটনে ক্লিক করো 
              </Text>
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => setGenerationState('premium_locked')} className="w-full mb-3">
                <View className="bg-[#D4B300] rounded-2xl pb-[6px]">
                  <View className="bg-[#FFC800] rounded-2xl py-4 flex-row justify-center items-center">
                    <FontAwesome5 name="crown" size={18} color="#FFF" />
                    <Text className="text-white text-[17px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রিমিয়ামে আপগ্রেড করো</Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => setGenerationState('idle')} className="w-full">
                <View className="bg-[#E5E5E5] rounded-2xl pb-[6px]">
                  <View className="bg-[#F0F0F0] rounded-2xl py-3.5 flex-row justify-center items-center">
                    <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ফিরে যান</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

          ) : generationState === 'premium_locked' ? (
            <View className="items-center justify-center py-2">
              <View className="bg-[#FFF4E5] w-20 h-20 rounded-full items-center justify-center mb-4 border-[4px] border-[#FFC800]">
                <FontAwesome5 name="gem" size={32} color="#FF9600" solid />
              </View>
              
              <Text className="text-[22px] text-[#3C3C3C] text-center px-2 mb-4" style={{ fontFamily: 'BanglaBold' }}>
                প্রো আনলক করো
              </Text>
              
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
              
              <TouchableOpacity activeOpacity={0.8} onPress={handlePremiumUpgrade} className="w-full mb-3">
                <View className="bg-[#D4B300] rounded-2xl pb-[6px]">
                  <View className="bg-[#FFC800] rounded-2xl py-4 flex-row justify-center items-center">
                    <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                    <Text className="text-white text-[17px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>মেসেজ করে আপগ্রেড করো</Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => setGenerationState('server_overloaded')} className="w-full">
                <View className="bg-[#E5E5E5] rounded-2xl pb-[6px]">
                  <View className="bg-[#F0F0F0] rounded-2xl py-3.5 flex-row justify-center items-center">
                    <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ফিরে যান</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

          ) : isWorking ? (
            <View className="items-center justify-center py-10">
              <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: stepFadeAnim }} className="bg-[#CE82FF]/10 w-24 h-24 rounded-full border-2 border-[#CE82FF]/30 mb-6 items-center justify-center">
                <FontAwesome5 
                  name={generationState === 'success' ? "check-circle" : currentAiStep.icon} 
                  size={42} 
                  color={generationState === 'success' ? "#58CC02" : "#CE82FF"} 
                />
              </Animated.View>
              <Animated.Text style={{ opacity: stepFadeAnim, fontFamily: 'BanglaBold' }} className="text-[18px] text-[#4B4B4B] text-center px-5 leading-8 h-16">
                {generationState === 'success' ? "গেম সফলভাবে তৈরি হয়েছে!" : currentAiStep.text}
              </Animated.Text>
            </View>
          ) : (
            <View className="mt-1">
              <Text className="text-[15px] text-[#3C3C3C] mb-2 px-1" style={{ fontFamily: 'BanglaBold' }}>নোটবুকের নাম দিন:</Text>
              <TextInput
                className="bg-[#F7F7F7] text-[#3C3C3C] p-4 rounded-2xl border-2 border-[#E5E5E5] text-[16px] mb-5"
                style={{ fontFamily: 'BanglaBold' }} 
                placeholder="যেমন: জীববিজ্ঞান ১ম পত্র" 
                placeholderTextColor="#AFAFAF"
                value={notebookName} 
                onChangeText={setNotebookName}
              />

              {isTextInputVisible ? (
                <View className="mb-4 bg-[#F7F7F7] p-2 rounded-2xl border-2 border-[#E5E5E5]">
                  <TextInput
                    className="text-[#3C3C3C] p-3 min-h-[140px] text-[15px]"
                    style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                    multiline
                    maxLength={MAX_CHARS}
                    placeholder={`এখানে আপনার নোট বা শিটের লেখা পেস্ট করুন... (সর্বোচ্চ ${MAX_CHARS} ক্যারেক্টার)`}
                    placeholderTextColor="#AFAFAF"
                    value={inputText}
                    onChangeText={setInputText}
                    autoFocus
                  />
                  <View className="flex-row justify-between items-center mt-2 border-t border-[#E5E5E5] pt-3 px-1">
                    <Text className={`text-xs pt-1 ${inputText.length < MIN_CHARS || inputText.length >= MAX_CHARS ? 'text-[#FF4B4B]' : 'text-[#7B92A5]'}`} style={{fontFamily: 'BanglaBold'}}>
                      {inputText.length} / {MAX_CHARS} 
                    </Text>
                    <View className="flex-row">
                      <TouchableOpacity onPress={() => setIsTextInputVisible(false)} className="px-4 py-2 rounded-xl bg-[#E5E5E5] mr-2">
                        <Text className="text-[#777777] text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSaveText} className="px-5 py-2 rounded-xl bg-[#1CB0F6]">
                        <Text className="text-white text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>সংরক্ষণ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="flex-row justify-between mb-4">
                  <TouchableOpacity 
                    activeOpacity={capturedImages.length >= 1 ? 1 : 0.8} 
                    onPress={() => {
                        if (capturedImages.length >= 1) {
                            Alert.alert("লিমিট শেষ!", "প্রতিটি গেমের জন্য সর্বোচ্চ ১টি ছবি যুক্ত করা যাবে।");
                        } else {
                            handleOpenCamera();
                        }
                    }} 
                    className="flex-1 mr-1.5"
                  >
                    <View className={`${capturedImages.length >= 1 ? 'bg-[#AFAFAF]' : 'bg-[#58A700]'} rounded-2xl pb-[6px]`}>
                      <View className={`${capturedImages.length >= 1 ? 'bg-[#D7D7D7]' : 'bg-[#58CC02]'} rounded-2xl py-3.5 flex-row justify-center items-center`}>
                        <FontAwesome5 name="camera" size={18} color={capturedImages.length >= 1 ? "#777777" : "#FFFFFF"} />
                        <Text className={`${capturedImages.length >= 1 ? 'text-[#777777]' : 'text-white'} text-[15px] ml-2 pt-1`} style={{ fontFamily: 'BanglaBold' }}>ছবি তুলুন</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.8} onPress={() => { setIsTextInputVisible(true); setInputText(savedText); }} className="flex-1 ml-1.5">
                    <View className={`${savedText.length > 0 ? 'bg-[#D4B300]' : 'bg-[#1899D6]'} rounded-2xl pb-[6px]`}>
                      <View className={`${savedText.length > 0 ? 'bg-[#FFC800]' : 'bg-[#1CB0F6]'} rounded-2xl py-3.5 flex-row justify-center items-center`}>
                        <FontAwesome5 name={savedText.length > 0 ? "pen" : "file-alt"} size={16} color="#FFFFFF" solid />
                        <Text className="text-white text-[15px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>
                          {savedText.length > 0 ? 'টেক্সট এডিট' : 'টেক্সট দিন'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {hasData && !isTextInputVisible && (
                <View className="mb-5 mt-2">
                  <Text className="text-[14px] text-[#777777] mb-2 px-1" style={{ fontFamily: 'BanglaBold' }}>যুক্ত করা ম্যাটেরিয়াল:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {capturedImages.map((img, index) => (
                      <View key={`img-${index}`} className="mr-3 relative">
                        <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-xl border-2 border-[#E5E5E5]" />
                        <TouchableOpacity 
                          onPress={() => removeImage(index)} 
                          className="absolute -top-2 -right-2 bg-[#FF4B4B] w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                        >
                          <FontAwesome5 name="times" size={10} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {savedText.length > 0 && (
                      <View className="mr-3 relative w-20 h-20 bg-[#FFF4E5] rounded-xl border-2 border-[#FFC800] justify-center items-center p-2">
                        <FontAwesome5 name="file-alt" size={22} color="#FF9600" solid />
                        <Text className="text-[10px] text-[#D4B300] text-center mt-2 pt-1 leading-3" style={{fontFamily:'BanglaBold'}} numberOfLines={2}>
                          টেক্সট নোট ({savedText.length} অঃ)
                        </Text>
                        <TouchableOpacity 
                          onPress={() => setSavedText("")} 
                          className="absolute -top-2 -right-2 bg-[#FF4B4B] w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                        >
                          <FontAwesome5 name="times" size={10} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
              
              {!isTextInputVisible && (
                <TouchableOpacity activeOpacity={0.8} onPress={triggerGeneration} className="mt-2">
                  <View className={`${hasData && notebookName ? 'bg-[#A559D6]' : 'bg-[#E5E5E5]'} rounded-2xl pb-[6px]`}>
                    <View className={`${hasData && notebookName ? 'bg-[#CE82FF]' : 'bg-[#F0F0F0]'} rounded-2xl py-4 flex-row justify-center items-center`}>
                      <FontAwesome5 name="bolt" size={18} color={hasData && notebookName ? "#FFFFFF" : "#AFAFAF"} />
                      <Text className={`text-lg ml-2.5 pt-1 ${hasData && notebookName ? 'text-white' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                        গেম তৈরি করুন (১০ ক্রেডিট)
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      <Modal visible={isCameraActive} animationType="fade" transparent={false} onRequestClose={() => setIsCameraActive(false)}>
        <View className="flex-1 bg-black">
          {hasPermission ? (
            <Camera style={{ flex: 1 }} type="back" ref={cameraRef}>
              <View className="flex-1 justify-between bg-transparent">
                <View className="flex-row justify-between items-center p-6 pt-12 bg-black/40">
                  <Text className="text-white text-lg pt-1" style={{ fontFamily: 'BanglaBold' }}>নোটের ছবি তুলুন</Text>
                  <TouchableOpacity onPress={() => setIsCameraActive(false)} className="bg-white/20 p-3 rounded-full">
                    <FontAwesome5 name="times" size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <View className="pb-12 pt-6 bg-black/40 flex-row justify-center items-center">
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={takePicture} 
                    className="w-20 h-20 bg-transparent rounded-full border-[5px] border-white justify-center items-center"
                  >
                    <View className="w-16 h-16 bg-white rounded-full" />
                  </TouchableOpacity>
                </View>
              </View>
            </Camera>
          ) : (
            <View className="flex-1 justify-center items-center bg-black">
               <Text className="text-white mb-4 text-lg" style={{ fontFamily: 'BanglaBold' }}>ক্যামেরা ব্যবহারের পারমিশন প্রয়োজন</Text>
               <TouchableOpacity onPress={handleOpenCamera} className="bg-[#58CC02] px-6 py-3 rounded-xl">
                 <Text className="text-white text-lg pt-1" style={{ fontFamily: 'BanglaBold' }}>পারমিশন দিন</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}