import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, LayoutAnimation, TextInput, UIManager, Platform, Image, Animated, Alert, FlatList, ActivityIndicator, Linking, DeviceEventEmitter, RefreshControl, Dimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard'; // 🚀 ফিক্স: নতুন ক্লিপবোর্ড ইমপোর্ট
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { KeyboardAvoidingView } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import DateTimePicker from '@react-native-community/datetimepicker'; // 🚀 ডেট-পিকার

// 🚀 Modular Discussion Component
import Discussion from './Discussion';

const API_URL = 'https://growshelby-api.vercel.app/api/update_coins';

const apiCall = async (label, body) => {
  const t = Date.now();
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { console.log(`[API:${label}] ❌ JSON পার্স হয়নি`); }
    console.log(`[API:${label}] status=${res.status} ${Date.now() - t}ms success=${data?.success} error=${data?.error || '-'}`);
    if (!data?.success) console.log(`[API:${label}] ⚠️ RAW=`, raw.slice(0, 800));
    return data;
  } catch (e) {
    console.log(`[API:${label}] 🔌 NETWORK ERROR:`, e?.message);
    return null;
  }
};

// 🚀 বাংলা ফরম্যাট হেল্পার
const formatBnDate = (timestamp) => {
  if (!timestamp) return 'তারিখ বাছুন';
  const d = new Date(timestamp);
  const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  return `${String(d.getDate()).replace(/[0-9]/g, w => '০১২৩৪৫৬৭৮৯'[w])} ${months[d.getMonth()]}`;
};

const formatBnTime = (timestamp) => {
  if (!timestamp) return 'সময় বাছুন';
  const d = new Date(timestamp);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'পিএম' : 'এএম';
  h = h % 12; h = h ? h : 12; 
  const bnNum = (num) => String(num).padStart(2, '0').replace(/[0-9]/g, w => '০১২৩৪৫৬৭৮৯'[w]);
 return `${bnNum(h)}:${bnNum(m)} ${ampm}`;
};

// 🚀 Quiz Phase Helper (ডাইনামিক লাইভ উইন্ডো)
const getQuizPhase = (quiz, nowTime = Date.now()) => {
  if (!quiz.targetTimestamp) return (quiz.questions?.length > 0 || quiz.questionCount > 0) ? 'live' : 'upcoming';
  const liveDurationMS = (quiz.liveDuration || 60) * 60 * 1000;
  if (nowTime < quiz.targetTimestamp) return 'upcoming';
  if (nowTime < quiz.targetTimestamp + liveDurationMS) return 'live';
  return 'past';
};

const getEffectiveQuizPhase = (quiz, nowTime, hasTaken) => {
  const basePhase = getQuizPhase(quiz, nowTime);
  if (basePhase === 'live' && hasTaken) return 'past';
  return basePhase;
};

// 🚀 রিয়েল-টাইম লাইভ কাউন্টডাউন কম্পোনেন্ট
const LiveCountdown = ({ targetTimestamp }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetTimestamp) return;
    const updateTimer = () => {
      const diff = targetTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft('কুইজ চলছে!');
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      const bn = (num) => String(num).padStart(2, '0').replace(/[0-9]/g, w => '০১২৩৪৫৬৭৮৯'[w]);
      
      setTimeLeft(`${bn(d)} দিন : ${bn(h)} ঘ : ${bn(m)} মি : ${bn(s)} সে`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

 return <Text className="text-[#D47B00] text-[15px] ml-2 pt-0.5 tracking-wide" style={{ fontFamily: 'BanglaBold' }}>{timeLeft || 'হিসাব হচ্ছে...'}</Text>;
};

// 🚀 গ্লোবাল লাইভ ব্যাজ কম্পোনেন্ট
const LiveBadge = () => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <View className="bg-[#FF4B4B] rounded-full px-3 py-1.5 flex-row items-center shadow-sm">
      <Animated.View style={{ opacity: blinkAnim }} className="w-2 h-2 rounded-full bg-white" />
      <Text className="text-white text-[11px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>লাইভ কুইজ</Text>
    </View>
  );
};

import SmartReaderEngine from './SmartReaderEnginebackup';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🚀 হেডারের ফ্ল্যাশিং ব্যাজ স্কেলেটন
const HeaderBadgeSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="flex-row items-center justify-center bg-white px-2 py-1.5 rounded-full border border-[#EFE8D6] shadow-sm">
      <View className="flex-row -space-x-3">
        <View className="w-7 h-7 rounded-full bg-[#EAE4D4] border-2 border-white" />
        <View className="w-7 h-7 rounded-full bg-[#EAE4D4] border-2 border-white" />
        <View className="w-7 h-7 rounded-full bg-[#EAE4D4] border-2 border-white" />
      </View>
    </Animated.View>
  );
};

// 🚀 রিভিউর ফ্ল্যাশিং স্কেলেটন
const ReviewSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-white p-4 rounded-[20px] border border-[#EFE8D6] mb-3 shadow-sm">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-[#EAE4D4] mr-3" />
        <View className="flex-1">
          <View className="w-32 h-4 bg-[#EAE4D4] rounded-full mb-2" />
          <View className="w-20 h-3 bg-[#EAE4D4] rounded-full" />
        </View>
      </View>
      <View className="w-full h-3 bg-[#EAE4D4] rounded-full mb-2" />
      <View className="w-4/5 h-3 bg-[#EAE4D4] rounded-full mb-2" />
      <View className="w-2/3 h-3 bg-[#EAE4D4] rounded-full" />
    </Animated.View>
  );
};

// 🚀 লিডারবোর্ডের স্পেশাল শিমার (Podium + List)
const LeaderboardSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim, paddingTop: 10 }}>
      {/* 🚀 Podium Shimmer */}
      <View className="flex-row justify-center items-end mb-8 mt-6">
        <View className="items-center flex-1">
          <View className="w-14 h-14 rounded-full bg-[#EAE4D4] mb-3" />
          <View className="w-16 h-3 bg-[#EAE4D4] rounded-full mb-2" />
          <View className="w-10 h-2 bg-[#EAE4D4] rounded-full" />
        </View>
        <View className="items-center flex-[1.2] -mt-6">
          <View className="w-8 h-6 bg-[#EAE4D4] rounded-md mb-3" />
          <View className="w-20 h-20 rounded-full bg-[#EAE4D4] mb-3" />
          <View className="w-20 h-4 bg-[#EAE4D4] rounded-full mb-2" />
          <View className="w-12 h-2 bg-[#EAE4D4] rounded-full" />
        </View>
        <View className="items-center flex-1">
          <View className="w-14 h-14 rounded-full bg-[#EAE4D4] mb-3" />
          <View className="w-16 h-3 bg-[#EAE4D4] rounded-full mb-2" />
          <View className="w-10 h-2 bg-[#EAE4D4] rounded-full" />
        </View>
      </View>
      
      {/* 🚀 List Shimmer */}
      <View className="bg-white rounded-3xl border border-[#EFE8D6] shadow-sm p-2">
        {[1, 2, 3].map((_, idx) => (
          <View key={idx} className="flex-row items-center p-3 border-b border-[#F9F9F9]">
            <View className="w-4 h-4 bg-[#EAE4D4] rounded-sm mr-3" />
            <View className="w-10 h-10 rounded-full bg-[#EAE4D4] mr-3" />
            <View className="flex-1 justify-center">
              <View className="w-32 h-3 bg-[#EAE4D4] rounded-full mb-2" />
              <View className="w-20 h-2 bg-[#EAE4D4] rounded-full" />
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// 🚀 মেম্বার লিস্টের ফ্ল্যাশিং স্কেলেটন
const MemberSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="flex-row items-center mb-3 bg-[#FDF6E3] p-3 rounded-[20px] border border-[#EFE8D6]">
      <View className="w-12 h-12 rounded-full bg-[#EAE4D4]" />
      <View className="ml-3 flex-1">
        <View className="w-32 h-4 bg-[#EAE4D4] rounded-full mb-2" />
        <View className="w-20 h-3 bg-[#EAE4D4] rounded-full" />
      </View>
      <View className="w-16 h-7 bg-[#EAE4D4] rounded-full" />
    </Animated.View>
  );
};

// 🚀 ব্যানার ও রেটিংসের ফুল-পেইজ শিমার
const PageIntroSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-[#FFFDF8] border-b border-[#EFE8D6] pb-5 mb-2 shadow-sm">
      <View className="w-full aspect-video bg-[#EAE4D4]" />
      <View className="px-5 mt-4">
        <View className="w-3/4 h-7 bg-[#EAE4D4] rounded-full mb-5" />
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-[#EAE4D4] border-2 border-[#EFE8D6]" />
            <View className="ml-3 flex-1">
              <View className="w-32 h-4 bg-[#EAE4D4] rounded-full mb-2.5" />
              <View className="w-20 h-3 bg-[#EAE4D4] rounded-full" />
            </View>
          </View>
          <View className="w-20 h-9 bg-[#EAE4D4] rounded-[16px] ml-2" />
          <View className="w-24 h-9 bg-[#EAE4D4] rounded-[16px] ml-2" />
        </View>
      </View>
    </Animated.View>
  );
};

// 🚀 স্টাডি প্যাকের (বইয়ের) শিমার/স্কেলেটন ইফেক্ট
const GuideSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim, width: '48%' }} className="bg-white rounded-[20px] mb-4 border border-[#EFE8D6] shadow-sm overflow-hidden">
      <View className="w-full aspect-square bg-[#EAE4D4]" />
      <View className="p-3">
        <View className="w-full h-4 bg-[#EAE4D4] rounded-full mb-2" />
        <View className="w-2/3 h-4 bg-[#EAE4D4] rounded-full mb-3" />
        <View className="w-1/2 h-2 bg-[#EAE4D4] rounded-full" />
      </View>
    </Animated.View>
  );
};

// 🚀 Bank Card Skeleton (Chapter Tab)
const BankCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 600, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-white p-4 rounded-[20px] mb-4 border-2 border-[#EFE8D6] flex-row items-center">
      <View className="w-12 h-12 bg-[#EAE4D4] rounded-full mr-4" />
      <View className="flex-1 pr-2">
        <View className="w-3/4 h-4 bg-[#EAE4D4] rounded-full mb-2.5" />
        <View className="w-1/2 h-3 bg-[#EAE4D4] rounded-full" />
      </View>
      <View className="w-8 h-8 bg-[#EAE4D4] rounded-full ml-2" />
    </Animated.View>
  );
};

// 🚀 Special Card Skeleton
const SpecialCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 600, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-white p-4 rounded-[20px] mb-4 border-2 border-[#EFE8D6]">
      <View className="flex-row items-center mb-3">
        <View className="w-full h-5 bg-[#EAE4D4] rounded-full" />
      </View>
      <View className="w-1/3 h-6 bg-[#EAE4D4] rounded-md mb-4" />
      <View className="w-full h-[46px] bg-[#EAE4D4] rounded-[16px]" />
    </Animated.View>
  );
};

const normalizeText = (text) => {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[।.,;:'"()\-\s]/g, '').toLowerCase();
};

// 🚀 বাংলা নাম্বারকে ইংলিশ নাম্বারে কনভার্ট করার ফাংশন
const toEnglishNumber = (numStr) => {
  if (numStr === null || numStr === undefined) return '0';
  const str = String(numStr);
  const bengaliToEnglishMap = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, match => bengaliToEnglishMap[match] || match);
};

// 💡 শর্ট অ্যানসার কার্ড
const ShortAnswerCard = ({ data, globalReveal, onOpenDiscussion }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => setShowAnswer(globalReveal), [globalReveal]);

  const toggleAnswer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAnswer(!showAnswer);
  };

  return (
    <View className="bg-[#FFFDF8] p-5 rounded-[20px] border-2 border-[#EFE8D6] mb-5 shadow-sm mx-5">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#1CB0F6]/10 px-3 py-1 rounded-lg border border-[#1CB0F6]/30">
          <Text className="text-[12px] text-[#1899D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{data.type}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>

  {/* 🚀 রিডিং মোডে চিত্র দেখালে টেক্সট হাইড হয়ে যাবে */}
      {data.image ? (
        <Image source={{ uri: data.image }} className="w-full aspect-[16/9] rounded-xl mb-5 border border-[#EFE8D6] bg-[#F9F9F9]" resizeMode="contain" />
      ) : (
        <Text className="text-[#3D382F] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>
      )}

      {showAnswer ? (
        <View className="bg-[#FDF6E3] p-4 rounded-xl border border-[#EFE8D6] mt-2">
          <Text className="text-[#5C5549] text-[15px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{data.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
          <TouchableOpacity onPress={toggleAnswer} className="self-end mt-3">
            <Text className="text-[#FF4B4B] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleAnswer} className="bg-[#EAE4D4] p-3 rounded-xl items-center border border-[#EFE8D6] border-dashed">
          <Text className="text-[#827B6E] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 💡 এমসিকিউ কার্ড
const MCQCard = ({ data, globalReveal, onOpenDiscussion }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => setShowAnswer(globalReveal), [globalReveal]);

  const toggleAnswer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAnswer(!showAnswer);
  };

  let anyOptionMatched = false;
  const normalizedCorrectText = normalizeText(data.correctAnswer);

  return (
    <View className="bg-[#FFFDF8] p-5 rounded-[20px] border-2 border-[#EFE8D6] mb-5 shadow-sm mx-5">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#A559D6]/10 px-3 py-1 rounded-lg border border-[#A559D6]/30">
          <Text className="text-[12px] text-[#A559D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এমসিকিউ</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
   {/* 🚀 রিডিং মোডে চিত্র দেখালে টেক্সট হাইড হয়ে যাবে */}
      {data.image ? (
        <Image source={{ uri: data.image }} className="w-full aspect-[16/9] rounded-xl mb-5 border border-[#EFE8D6] bg-[#F9F9F9]" resizeMode="contain" />
      ) : (
        <Text className="text-[#3D382F] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>
      )}

      <View className="mb-4 space-y-2">
        {data.options?.map((option, index) => {
          const normalizedOption = normalizeText(option);
          let isCorrectOption = false;

          if (data.answer !== undefined && data.answer !== null && Number(data.answer) === index) isCorrectOption = true;
          else if (normalizedCorrectText && normalizedOption && (normalizedOption === normalizedCorrectText || normalizedOption.includes(normalizedCorrectText) || normalizedCorrectText.includes(normalizedOption))) isCorrectOption = true;
          else if (normalizedCorrectText === String.fromCharCode(2453 + index)) isCorrectOption = true;

          if (isCorrectOption) anyOptionMatched = true;
          const isHighlighted = showAnswer && isCorrectOption;

          return (
            <View className={`flex-row items-center p-3 rounded-lg border mb-2 ${isHighlighted ? 'bg-[#EAF2D7] border-[#8BA85E]' : 'bg-[#FDF6E3] border-[#EFE8D6]'}`} key={index}>
              <View className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${isHighlighted ? 'bg-[#8BA85E]' : 'bg-[#EAE4D4]'}`}>
                <Text className={`text-[13px] ${isHighlighted ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>{String.fromCharCode(2453 + index)}</Text>
              </View>
              <Text className={`text-[15px] flex-1 pt-1 ${isHighlighted ? 'text-[#4A632D]' : 'text-[#5C5549]'}`} style={{ fontFamily: isHighlighted ? 'BanglaBold' : 'BanglaRegular', lineHeight: 24 }}>{option}</Text>
              {isHighlighted && <FontAwesome5 name="check-circle" size={16} color="#4A632D" />}
            </View>
          );
        })}
      </View>

      {showAnswer ? (
        <View className="mt-2">
          {!anyOptionMatched && (data.correctAnswer || data.answer !== undefined) && (
            <View className="bg-[#FFF4E5] p-4 rounded-xl border border-[#FFC800] mb-3">
              <Text className="text-[#D47B00] text-[13px] mb-1" style={{ fontFamily: 'BanglaBold' }}><FontAwesome5 name="exclamation-triangle" size={12} /> এআই মেলাতে পারেনি</Text>
              <Text className="text-[#5C5549] text-[15px] leading-7" style={{ fontFamily: 'BanglaBold' }}>সঠিক উত্তর: {data.correctAnswer !== undefined ? data.correctAnswer : data.options?.[Number(data.answer)]}</Text>
            </View>
          )}
        {!!data.explanation && (
            <View className="bg-[#FDF6E3] p-4 rounded-xl border border-[#EFE8D6]">
              <Text className="text-[#5C5549] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা:</Text>
              <Text className="text-[#6B655B] text-[14px] mt-1 leading-6" style={{ fontFamily: 'BanglaRegular' }}>{data.explanation}</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleAnswer} className="self-end mt-3">
            <Text className="text-[#FF4B4B] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>উত্তর লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleAnswer} className="bg-[#EAE4D4] p-3 rounded-xl items-center border border-[#EFE8D6] border-dashed">
          <Text className="text-[#827B6E] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সঠিক উত্তর দেখুন <FontAwesome5 name="check-circle" size={12}/></Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 💡 সৃজনশীল কার্ড
const CQCard = ({ data, globalReveal, subFilter, onOpenDiscussion }) => {
  const [revealedAnswers, setRevealedAnswers] = useState({});

 const filteredQuestions = data.questions?.filter(q => {
    if (subFilter === 'ক') return q.label.includes('ক');
    if (subFilter === 'খ') return q.label.includes('খ');
    if (subFilter === 'গ ও ঘ') return q.label.includes('গ') || q.label.includes('ঘ');
    return true; 
  }) || [];

  const showStem = subFilter === 'সব' || subFilter === 'গ ও ঘ';

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // 🚀 ম্যাজিক অ্যানিমেশন
    const newState = {};
    filteredQuestions.forEach((_, i) => newState[i] = globalReveal);
    setRevealedAnswers(newState);
  }, [globalReveal, subFilter, data.questions]);

  // 🚀 ফিক্স: Hook এর পরে early return দিতে হয়, নাহলে অ্যাপ ক্র্যাশ করবে
  if (filteredQuestions.length === 0) return null;

  const toggleAnswer = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <View className="bg-[#FFF8EB] p-5 rounded-[20px] border-2 border-[#F0D5A3] mb-5 shadow-sm mx-5">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#FF9600]/10 px-3 py-1 rounded-lg border border-[#FF9600]/30">
          <Text className="text-[12px] text-[#D47B00] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>সৃজনশীল প্রশ্ন</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      
   {showStem && (
        <View className="mb-4 bg-[#FFFDF8] p-4 rounded-xl border border-[#F0D5A3]">
          <Text className="text-[#D47B00] text-[14px] mb-2" style={{ fontFamily: 'BanglaBold' }}>উদ্দীপক:</Text>
          {/* 🚀 রিডিং মোডে চিত্র দেখালে টেক্সট হাইড হয়ে যাবে */}
          {data.image ? (
            <Image source={{ uri: data.image }} className="w-full aspect-[16/9] rounded-xl mt-2 mb-2 border border-[#EFE8D6] bg-[#F9F9F9]" resizeMode="contain" />
          ) : (
            <Text className="text-[#3D382F] text-[16px] leading-8" style={{ fontFamily: 'BanglaRegular' }}>{data.stem}</Text>
          )}
        </View>
      )}
      
      <View className={`${showStem ? 'border-t border-[#F0D5A3] pt-4' : ''}`}>
        {filteredQuestions.map((q, index) => (
        <View className="mb-5" key={index}>
            {/* 🚀 রিডিং মোডে চিত্র দেখালে টেক্সট হাইড হয়ে যাবে (ক, খ, গ, ঘ এর জন্য) */}
            {q.image ? (
              <View className="mb-3">
                <Text className="text-[#3D382F] text-[16px] mb-2 leading-7" style={{ fontFamily: 'BanglaBold' }}>{q.label})</Text>
                <Image source={{ uri: q.image }} className="w-full aspect-[16/9] rounded-xl border border-[#EFE8D6] bg-[#F9F9F9]" resizeMode="contain" />
              </View>
            ) : (
              <Text className="text-[#3D382F] text-[16px] mb-2 leading-7" style={{ fontFamily: 'BanglaBold' }}>{q.label}) {q.question}</Text>
            )}
            {revealedAnswers[index] ? (
              <View className="bg-[#FFFDF8] p-4 rounded-xl border border-[#FFC800] mt-2">
                <Text className="text-[#5C5549] text-[15px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{q.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
                <TouchableOpacity onPress={() => toggleAnswer(index)} className="self-end mt-3">
                  <Text className="text-[#D47B00] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleAnswer(index)} className="bg-[#FDF6E3] p-3 rounded-xl items-center border border-[#FFC800] border-dashed">
                <Text className="text-[#D47B00] text-[14px] pt-1" style={{ fontFamily: 'BanglaBold' }}>{q.label}-এর উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// 💡 মেইন রিডিং স্ক্রিন
export default function PorarPageEyeComfort({ visible, onClose, lessonItem, isNativeScreen = false }) {
  const insets = useSafeAreaInsets();
  // 🚀 বাউন্সি অ্যানিমেশন লজিক
  const screenHeight = Dimensions.get('window').height;
  const pageSlideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible && !isNativeScreen) {
      Animated.spring(pageSlideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }).start();
    } else if (isNativeScreen) {
      pageSlideAnim.setValue(0);
    } else {
      pageSlideAnim.setValue(screenHeight);
    }
  }, [visible, isNativeScreen]);

  // বের হওয়ার সময়ও যেন স্মুথলি নিচে নেমে যায়
  const closePageWithAnimation = () => {
    if (isNativeScreen) {
      onClose();
    } else {
      Animated.timing(pageSlideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }).start(() => onClose());
    }
  };
  const [activeCategory, setActiveCategory] = useState('সব');
  const [cqSubFilter, setCqSubFilter] = useState('সব');
  // 🚀 কার্ডে ক্লিক করে ঢুকলেই প্রতিবার শিমার দেখানোর স্টেট
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsInitialLoading(true);
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 700); // ৭০০ মিলি-সেকেন্ড শিমার দেখানোর পর আসল ডেটা ভেসে উঠবে
      return () => clearTimeout(timer);
    }
  }, [visible]);
  const [globalReveal, setGlobalReveal] = useState(false);

  // 🚀 Share Modal State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareModalType, setShareModalType] = useState('success');

 // 🚀 Discussion Modal State
 // 🚀 Custom Styled In-App Alert State
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error', showCancel: false, onConfirm: null });

const [discussionVisible, setDiscussionVisible] = useState(false);
  const [activeDiscussionData, setActiveDiscussionData] = useState(null);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]); // 🚀 পেন্ডিং জয়েন রিকোয়েস্ট রাখার স্টেট
  const [communityAdmins, setCommunityAdmins] = useState([]);
  const [communityAdminList, setCommunityAdminList] = useState([]);

  const openDiscussion = (questionData = null) => {
    setActiveDiscussionData(questionData);
    setDiscussionVisible(true);
  };

  // 🚀 পুশ নোটিফিকেশন থেকে মেম্বার লিস্ট অটো-ওপেন করার লিসেনার
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('open_members_modal', () => {
       handleMembersBadgeClick();
    });
    return () => sub.remove();
  }, []);

  // 🚀 জয়েন রিকোয়েস্ট অ্যাকসেপ্ট/রিজেক্ট করার ফাংশন
  const handleJoinAction = async (targetUserEmail, actionType) => {
    // 🚀 Optimistic UI: সাথে সাথে স্ক্রিন থেকে সরিয়ে ফেলা
    setPendingJoinRequests(prev => prev.filter(req => req.userEmail !== targetUserEmail));
    
    try {
      const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
  await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: actionType, guideId, userEmail: targetUserEmail, actorEmail: currentUserEmail })
      });
      
      // 🚀 অ্যাকসেপ্ট করলে মেম্বার লিস্টটা রিফ্রেশ করে নতুন মেম্বারকে দেখানোর জন্য
      if (actionType === 'accept_join_request') {
         handleMembersBadgeClick();
      }
    } catch(e) {
      console.log("Join Action Error", e);
    }
  };

 // 🚀 কোশ্চেন ব্যাংক তৈরি হওয়ার পর ফ্রন্টএন্ডে রিয়েল-টাইম আপডেট করার লজিক
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('question_bank_added', ({ shareCode, newBankData }) => {
            addedTrackerRef.current.banks[newBankData.bankId] = { shareCode, bankId: newBankData.bankId, bankName: newBankData.bankName };
      console.log('📦 question_bank_added ইভেন্ট:', shareCode, newBankData.bankId);
      
      // 🚀 স্পেশাল ব্যাংক তৈরি হলে মেইন বইতে না বসিয়ে স্পেশাল লিস্টে বসবে
      if (shareCode.startsWith('SPECIAL_')) {
        const body = shareCode.slice(8); const idx = body.lastIndexOf('_'); const actualShareCode = body.slice(idx + 1);
        setSpecialBanks(prev => {
          const existing = prev[actualShareCode] || [];
          return { ...prev, [actualShareCode]: [...existing, newBankData] };
        });
        return;
      }

      setChannelGuides(prevGuides => prevGuides.map(guide => {
        if (guide.shareCode === shareCode) {
          return {
            ...guide,
            failedItems: [...(guide.failedItems || []), newBankData]
          };
        }
        return guide;
      }));

      // যদি সাবজেক্ট ভিউ ওপেন থাকে, তবে সেটাকেও আপডেট করতে হবে
   // যদি সাবজেক্ট ভিউ ওপেন থাকে, তবে সেটাকেও আপডেট করতে হবে
      setSelectedSubject(prevSubject => {
        if (prevSubject && prevSubject.shareCode === shareCode) {
          return {
            ...prevSubject,
            failedItems: [...(prevSubject.failedItems || []), newBankData]
          };
        }
        return prevSubject;
      });
    });
// 🚀 নতুন: এক্সিস্টিং কোশ্চেন ব্যাংকে আপডেট হলে রিয়েল-টাইমে রিফ্রেশ করার ইভেন্ট
    const updateSubscription = DeviceEventEmitter.addListener('question_bank_updated', ({ shareCode, updatedSubject }) => {
      if (shareCode.startsWith('SPECIAL_')) {
        const body = shareCode.slice(8); const idx = body.lastIndexOf('_'); const actualShareCode = body.slice(idx + 1);
        setSpecialBanks(prev => ({ ...prev, [actualShareCode]: updatedSubject.failedItems }));
        return;
      }
      setChannelGuides(prevGuides => prevGuides.map(guide => guide.shareCode === shareCode ? updatedSubject : guide));
      setSelectedSubject(prevSubject => (prevSubject && prevSubject.shareCode === shareCode) ? updatedSubject : prevSubject);
    });

    return () => {
      subscription.remove();
      updateSubscription.remove();
    };
  }, []);

  // 🚀 FIX: পুশ নোটিফিকেশন থেকে সিগন্যাল পেলে সাথে সাথে গ্লোবাল ডিসকাশন মডাল ওপেন করবে
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('open_discussion_modal', () => {
      openDiscussion(null); // null মানে জেনারেল কমিউনিটি চ্যাট ওপেন হবে
    });
    return () => subscription.remove();
  }, []);

  // ==========================================================
  // 🚀 Community Members State (Smart Loading)
  // ==========================================================
  const [members, setMembers] = useState([]);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [showReviewOptions, setShowReviewOptions] = useState(false); // থ্রি-ডট মেনু দেখানোর জন্য
  const [totalMemberCount, setTotalMemberCount] = useState(0);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(''); // 🚀 ইউজারের আসল নাম
  const [realAdminName, setRealAdminName] = useState(null); // 🚀 অ্যাডমিনের আসল নাম
  // 🚀 ডেটা ডিবাগিং (চেক করার জন্য)
  useEffect(() => {
    if (visible) {
      console.log("\n========== ডেটা চেকিং শুরু ==========");
      console.log("১. লেসন আইটেম (lessonItem):", JSON.stringify(lessonItem, null, 2));
      console.log("২. কারেন্ট ইউজার ইমেইল (currentUserEmail):", currentUserEmail);
      console.log("৩. ব্যাকএন্ড থেকে আসা আসল নাম (realAdminName):", realAdminName);
      console.log("=====================================\n");
    }
  }, [visible, lessonItem, currentUserEmail, realAdminName]);

  // 🚀 ব্যাকএন্ড থেকে অ্যাডমিনের অরিজিনাল নাম আনার লজিক
  useEffect(() => {
    const fetchRealAdminName = async () => {
      const adminEmail = lessonItem?.creatorEmail || lessonItem?.channelId;
      if (!visible || !adminEmail) return;
      try {
        const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'get_real_user_name', email: adminEmail })
        });
        const data = await res.json();
        if (data.success && data.name) setRealAdminName(data.name);
      } catch (e) {}
    };
    fetchRealAdminName();
  }, [visible, lessonItem]);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [bannedList, setBannedList] = useState([]);
  const [isBannedModalVisible, setIsBannedModalVisible] = useState(false);
  const [isCaSelectModalVisible, setIsCaSelectModalVisible] = useState(false);
  const [caSearchQuery, setCaSearchQuery] = useState('');
  const [caCandidates, setCaCandidates] = useState([]);
  const [selectedCa, setSelectedCa] = useState(null);
  const [isCaSearching, setIsCaSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isBannedLoading, setIsBannedLoading] = useState(false);
  const caSearchTimeout = useRef(null);
  const caSearchReqId = useRef(0);
  const [isMember, setIsMember] = useState(false);
  // 🚀 Review & Rating States
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false); // ফর্ম হাইড/শো করার জন্য
  const [averageRating, setAverageRating] = useState(0); // গড় রেটিং রাখার জন্য
  const [hasUserReviewed, setHasUserReviewed] = useState(false); // ইউজার আগে রেটিং দিয়েছে কিনা
  const [isSubmittingReview, setIsSubmittingReview] = useState(false); // সাবমিট হওয়ার সময় লোডিং দেখানোর জন্য
  const [reviewText, setReviewText] = useState('');
  
 // 🚀 আসল রিভিউ ডেটা রাখার State
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // 🚀 Channel Guides & Reader States
  const [channelGuides, setChannelGuides] = useState([]);
    const addedTrackerRef = useRef({ guides: {}, banks: {} });
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [readerVisible, setReaderVisible] = useState(false);
 // 🚀 Refresh States
  const [refreshing, setRefreshing] = useState(false);

 const [activeQuizTab, setActiveQuizTab] = useState('upcoming');
 const [isQuizCreateModalVisible, setIsQuizCreateModalVisible] = useState(false);
  const [communityQuizzes, setCommunityQuizzes] = useState([]);
  const [editingQuizId, setEditingQuizId] = useState(null); // 🚀 কুইজ এডিট ট্র্যাক করার স্টেট

  // 🚀 ম্যাজিক: কুইজের ফেজ বদলানোর ঠিক মুহূর্তে UI রি-রেন্ডার করার ক্লক
  const [quizClock, setQuizClock] = useState(Date.now());
  useEffect(() => {
    if (!visible || !communityQuizzes || communityQuizzes.length === 0) return;
    let nextTrigger = Infinity;
    const now = Date.now();

  communityQuizzes.forEach(q => {
      if (q.targetTimestamp) {
        if (q.targetTimestamp > now && q.targetTimestamp < nextTrigger) {
          nextTrigger = q.targetTimestamp;
        }
        const liveDurationMS = (q.liveDuration || 60) * 60 * 1000;
        const endLive = q.targetTimestamp + liveDurationMS;
        if (endLive > now && endLive < nextTrigger) {
          nextTrigger = endLive;
        }
      }
    });

    if (nextTrigger !== Infinity) {
      let delay = nextTrigger - now;
      if (delay > 2147483647) delay = 2147483647;
      const timerId = setTimeout(() => setQuizClock(Date.now()), delay + 1000);
      return () => clearTimeout(timerId);
    }
  }, [visible, communityQuizzes, quizClock]);
  
// 🚀 Creator AI Generator States
  const [quizJsonInput, setQuizJsonInput] = useState('');
  const [tempGeneratedQuestions, setTempGeneratedQuestions] = useState([]);

 // 🚀 Live Smart Quiz Engine States (For Students)
  const [isLiveQuizModalVisible, setIsLiveQuizModalVisible] = useState(false);
  const [liveQuizActiveQuiz, setLiveQuizActiveQuiz] = useState(null);
  const [parsedQuizData, setParsedQuizData] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  
// 🚀 Quiz History & Revision Tracker State
  const [quizHistoryMap, setQuizHistoryMap] = useState({});

  // 🚀 Load Quiz History on Mount (Offline First + Server Sync)
 // 🚀 Load Quiz History on Mount (Offline First + Server Sync)
  useEffect(() => {
    if (currentUserEmail && visible) {
      // ১. প্রথমে ইনস্ট্যান্ট UI এর জন্য লোকাল স্টোরেজ থেকে ডেটা লোড
      AsyncStorage.getItem(`@quiz_history_v1_${currentUserEmail}_${lessonItem?.channelId}`).then(data => {
        if (data) setQuizHistoryMap(JSON.parse(data));
      }).catch(e => console.log(e));

      // ২. ব্যাকগ্রাউন্ডে সার্ভার থেকে সব হিস্ট্রি টানবে (যাতে অন্য ফোনে খেললেও এখানে সিঙ্ক হয়)
      fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'fetch_my_quiz_history', userEmail: currentUserEmail })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          const serverMap = {};
          data.history.forEach(item => {
            if (item.channelId === lessonItem?.channelId) {
              serverMap[item.quizId] = { score: item.score, failedItems: item.failedItems, completedAt: new Date(item.updatedAt).getTime() };
            }
          });
          setQuizHistoryMap(prev => {
            const mergedMap = { ...prev, ...serverMap };
            AsyncStorage.setItem(`@quiz_history_v1_${currentUserEmail}_${lessonItem?.channelId}`, JSON.stringify(mergedMap)).catch(()=>{});
            return mergedMap;
          });
        }
      })
      .catch(e => console.log("Fetch History Error:", e));
    }
  }, [currentUserEmail, visible, lessonItem?.channelId]);
  
  // 🚀 Timer & Performance States
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  // 🚀 Timer Engine (Countdown)
  useEffect(() => {
    let timer;
    if (isLiveQuizModalVisible && parsedQuizData && !isQuizFinished && quizTimeLeft > 0) {
      timer = setInterval(() => {
        setQuizTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleQuizFinish(); // সময় শেষ হলে অটো সাবমিট
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveQuizModalVisible, parsedQuizData, isQuizFinished, quizTimeLeft]);

  const formatQuizTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const bn = (num) => String(num).padStart(2, '0').replace(/[0-9]/g, w => '০১২৩৪৫৬৭৮৯'[w]);
    return `${bn(m)}:${bn(s)}`;
  };

  // কুইজ তৈরির ফর্ম স্টেট

  // কুইজ তৈরির ফর্ম স্টেট
  const [quizTitle, setQuizTitle] = useState('');
  const [quizBanner, setQuizBanner] = useState('');
 const [quizDate, setQuizDate] = useState('');
  const [quizTime, setQuizTime] = useState('');
  const [quizLiveDuration, setQuizLiveDuration] = useState('60'); // 🚀 নতুন: লাইভ থাকার সময়
  const [isQuizImageUploading, setIsQuizImageUploading] = useState(false);
  
  // 🚀 স্মার্ট টাইমার স্টেট
  const [quizTimestamp, setQuizTimestamp] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
 // 🚀 Smart Resource Rules (টপিক ও টাইপ ফিল্টার সেভ রাখার জন্য)
  const [quizSelectedRules, setquizSelectedRules] = useState([]);
  const [isResourcePickerVisible, setIsResourcePickerVisible] = useState(false);
  const [expandedResourceGuide, setExpandedResourceGuide] = useState(null); // Accordion State

  // 🚀 New Special Bank Resource States
  const [resourcePickerTab, setResourcePickerTab] = useState('main');
  const [specialPickerGroups, setSpecialPickerGroups] = useState([]);
  const [isSpecialPickerLoading, setIsSpecialPickerLoading] = useState(false);
  const [expandedSpecialBankKey, setExpandedSpecialBankKey] = useState(null);
  const [isResourceOpening, setIsResourceOpening] = useState(false);

  const loadSpecialPickerGroups = async () => {
    setIsSpecialPickerLoading(true);
    try {
      const gIds = channelGuides.map(g => g.shareCode).filter(Boolean);
      if (gIds.length === 0) {
        setSpecialPickerGroups([]);
        return;
      }
      const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'fetch_all_special_banks', guideIds: gIds })
      });
      const data = await res.json();
      if (data.success) {
        setSpecialPickerGroups(data.groups || []);
      }
    } catch(e) {
      console.log('Error loading special groups:', e);
    } finally {
      setIsSpecialPickerLoading(false);
    }
  };

  useEffect(() => {
    if (isResourcePickerVisible) {
      setResourcePickerTab('main');
      setExpandedSpecialBankKey(null);
      if (currentUserEmail === 'rumontrader662@gmail.com') {
        loadSpecialPickerGroups();
      }
    }
  }, [isResourcePickerVisible]);

  // 🚀 ব্যানার আপলোডার (ImgBB)
  const pickQuizBanner = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8
    });
    if (!result.canceled && result.assets[0].uri) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri, [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (manipResult.base64) {
        setQuizBanner(`data:image/jpeg;base64,${manipResult.base64}`);
        setIsQuizImageUploading(true);
        const imgUrl = await uploadToImgBB(manipResult.base64);
        if (imgUrl) setQuizBanner(imgUrl);
        setIsQuizImageUploading(false);
      }
    }
  };

 // 🚀 Special Questions Resolver Helper (Shared Engine)
  const resolveSpecialRuleQuestions = async (rule, cache) => {
    const cacheKey = `${rule.guideShareCode}__${rule.communityId}`;
    let banks = cache[cacheKey];
    if (!banks) {
      try {
        const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'fetch_special_banks', guideId: rule.guideShareCode, communityId: rule.communityId })
        });
        const data = await res.json();
        if (data.success) {
          banks = data.banks || [];
          cache[cacheKey] = banks;
        } else { banks = []; }
      } catch(e) { banks = []; }
    }
    const targetBank = banks.find(b => b.bankId === rule.bankId);
    if (!targetBank || !targetBank.questions) return [];
    return targetBank.questions.filter(q => {
      const typeMatched = !rule.allowedTypes || rule.allowedTypes.length === 0 || rule.allowedTypes.includes(q.type);
      const topicMatched = !rule.allowedTopics || rule.allowedTopics.length === 0 || rule.allowedTopics.includes(q.topic);
      return typeMatched && topicMatched;
    });
  };

  // 🚀 ইউজারের জন্য স্মার্ট কুইজ সিলেবাস ওপেন করা (Locked Mode)
  const handleOpenQuizResources = async (quiz) => {
    setIsResourceOpening(true);
    try {
      let filteredQuestions = [];
      let fetchCache = {};

      // ক্রিয়েটরের সেট করা রুলস অনুযায়ী প্রশ্ন ফিল্টার করা হচ্ছে
      if (quiz.resources && quiz.resources.length > 0) {
        for (const rule of quiz.resources) {
          if (rule.sourceType === 'special') {
            const specialQs = await resolveSpecialRuleQuestions(rule, fetchCache);
            filteredQuestions.push(...specialQs);
          } else {
            const sourceGuide = channelGuides.find(g => g.id === (rule.guideId || rule.id));
            if (sourceGuide && sourceGuide.failedItems) {
              sourceGuide.failedItems.forEach(bank => {
                if (bank.questions) {
                  bank.questions.forEach(q => {
                    const typeMatched = rule.allowedTypes.length === 0 || rule.allowedTypes.includes(q.type);
                    const topicMatched = rule.allowedTopics.length === 0 || rule.allowedTopics.includes(q.topic);
                    if (typeMatched && topicMatched) {
                      filteredQuestions.push(q);
                    }
                  });
                }
              });
            }
          }
        }
      }

      if (filteredQuestions.length === 0) {
        return Alert.alert("রিসোর্স খালি!", "এই কুইজের জন্য কোনো প্রশ্ন ফিল্টার করা যায়নি।");
      }

      const tempSyllabusGuide = {
        id: 'quiz_syllabus_' + quiz.id,
        notebookName: quiz.title + ' (সিলেবাস)',
        failedItems: filteredQuestions,
        channelId: lessonItem?.channelId,
        creatorName: lessonItem?.creatorName,
        isQuizResourceMode: true
      };

      openBookInReader(tempSyllabusGuide);
    } finally {
      setIsResourceOpening(false);
    }
  };

 // 🚀 2-Step Folder System States (Subject > Question Bank)
  const [selectedSubject, setSelectedSubject] = useState(null);
 const [isSubjectViewVisible, setIsSubjectViewVisible] = useState(false);
  
  // 🚀 নতুন: কমিউনিটি স্পেশাল ব্যাংক ম্যানেজ করার স্টেটসমূহ
  const [specialBanks, setSpecialBanks] = useState({});
  const [isManagingSpecialBank, setIsManagingSpecialBank] = useState(false);
  const [isLoadingSpecialBanks, setIsLoadingSpecialBanks] = useState(false);

  // 🚀 ট্র্যাক করবে কোন কোশ্চেন ব্যাংক কখন পড়া হয়েছে
  const [bankReadTimestamps, setBankReadTimestamps] = useState({}); 

  // 🚀 স্পেশাল ব্যাংক ফেচ করার লজিক
  useEffect(() => {
    if (isSubjectViewVisible && selectedSubject?.shareCode && lessonItem?.channelId) {
      const fetchSpecial = async () => {
        setIsLoadingSpecialBanks(true);
        try {
          const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
            body: JSON.stringify({
              action: 'fetch_special_banks',
              guideId: selectedSubject.shareCode,
              communityId: lessonItem.channelId
            })
          });
          const data = await res.json();
          if (data.success) {
            setSpecialBanks(prev => ({ ...prev, [selectedSubject.shareCode]: data.banks || [] }));
          }
        } catch (e) {}
        setIsLoadingSpecialBanks(false);
      };
      fetchSpecial();
    }
  }, [isSubjectViewVisible, selectedSubject?.shareCode]);

  useEffect(() => {
    const loadReadData = async () => {
      try {
        const data = await AsyncStorage.getItem('@bank_read_history');
        if (data) setBankReadTimestamps(JSON.parse(data));
      } catch(e) {}
    };
    loadReadData();
  }, []);
 // 🚀 Subject View (Study Pack) Bouncy Animations
  const subjectSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const subjectFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSubjectViewVisible) {
      // 🚀 Reset tabs & shimmer on open
      setSubjectActiveTab('chapter');
      setIsTabLoading(true);
      setTimeout(() => setIsTabLoading(false), 600);

      subjectSlideAnim.setValue(Dimensions.get('window').height); // অ্যানিমেশন যেন আটকে না যায়
      Animated.parallel([
        Animated.timing(subjectFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(subjectSlideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true })
      ]).start();
    }
  }, [isSubjectViewVisible]);

  // 🚀 Handle Pin Toggle for Special Banks
  const handleTogglePinSpecialBank = async (bankToToggle) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const currentBanks = specialBanks[selectedSubject.shareCode] || [];
    const isCurrentlyPinned = !!bankToToggle.isPinned;
    
    const updatedBanks = currentBanks.map(b => {
      if (b.bankId === bankToToggle.bankId) {
        return { ...b, isPinned: !isCurrentlyPinned, pinnedAt: !isCurrentlyPinned ? Date.now() : null };
      }
      return b;
    });
    
    // Optimistic Update
    setSpecialBanks(prev => ({ ...prev, [selectedSubject.shareCode]: updatedBanks }));

    // Persist via Backend (Using existing save_guide endpoint)
    try {
      const fakeSubject = { 
        ...selectedSubject, 
        failedItems: updatedBanks, 
        shareCode: `SPECIAL_${lessonItem?.channelId}_${selectedSubject.shareCode}` 
      };
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'save_guide', guideData: fakeSubject })
      });
    } catch (error) {
      console.log('Pin Error:', error);
    }
  };

  // 🚀 Tab Switcher Helper
  const handleTabSwitch = (tabName) => {
    if (subjectActiveTab === tabName) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSubjectActiveTab(tabName);
    setIsTabLoading(true);
    setTimeout(() => setIsTabLoading(false), 600);
  };

  const closeSubjectModalSmoothly = () => {
    Animated.parallel([
      Animated.timing(subjectFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(subjectSlideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true })
    ]).start(() => setIsSubjectViewVisible(false));
  };

const [isSubjectCreateVisible, setIsSubjectCreateVisible] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newSubjectThumbnail, setNewSubjectThumbnail] = useState('');
  
// 🚀 Subject Tabs & Pin States
  const [subjectActiveTab, setSubjectActiveTab] = useState('chapter'); // 'special' | 'chapter'
  const [isTabLoading, setIsTabLoading] = useState(false);

 // 🚀 Manage Question Bank States
  const [isBankManageModalVisible, setIsBankManageModalVisible] = useState(false);
  const [managingBank, setManagingBank] = useState(null);

  // 🚀 New States for Smart Bulk Management[cite: 2]
 const [isBankSelectionMode, setIsBankSelectionMode] = useState(false);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState({});
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [activeBankFilter, setActiveBankFilter] = useState('সব');
const [activeBankTypeFilter, setActiveBankTypeFilter] = useState('সব'); 
 const [activeNeedsImageFilter, setActiveNeedsImageFilter] = useState(false); // 🚀 চিত্র ফিল্টার স্টেট
 const [uploadingImageQId, setUploadingImageQId] = useState(null); // 🚀 কোন প্রশ্নে ছবি আপলোড হচ্ছে তার ট্র্যাক
  
 // 🚀 Undo/Redo History States
  
  // 🚀 Undo/Redo History States
  const [bankHistory, setBankHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const saveTimeoutRef = useRef(null);
  // 🚀 মাস্টার রিফ্রেশ ফাংশন (সব ডাটা একসাথে আপডেট করবে)
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
    
    try {
    // একসাথে গাইড, মেম্বার এবং রিভিউ ફેচ করবো
      await Promise.all([
   // 🚀 ১. গাইড ফেচ (মাস্টার অ্যাকাউন্ট থেকে + নির্দিষ্ট টার্গেট ট্যাগ অনুযায়ী)
              apiCall('refresh_fetch_channel_guides', {
          action: 'fetch_channel_guides',
          channelId: 'rumontrader662@gmail.com',
          targetCategory: lessonItem?.niche,
        }).then(data => {
          if (data?.success) {
            console.log(`🔄 রিফ্রেশে ${data.guides?.length} টি গাইড এল`);
            setChannelGuides(data.guides);
          }
        }),
        
        // ২. মেম্বার ফেচ
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'get_community_members', guideId, limit: 10, skip: 0 })
        }).then(res => res.json()).then(data => { 
          if (data.success) { setMembers(data.members); setTotalMemberCount(data.totalMembers !== null ? data.totalMembers : 0); } 
        }),
        
 // ৩. রিভিউ ফেচ
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'get_reviews', guideId })
        }).then(res => res.json()).then(data => { if (data.success && data.reviews) setReviews(data.reviews); }),

 // 🚀 ৪. কুইজ ফেচ (মাস্টার অ্যাকাউন্ট থেকে + নির্দিষ্ট টার্গেট ট্যাগ অনুযায়ী)
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'fetch_community_quizzes', channelId: 'rumontrader662@gmail.com', targetCategory: lessonItem?.niche, userEmail: await AsyncStorage.getItem('@current_user_id') })
        }).then(res => res.json()).then(data => { if (data.success && data.quizzes) setCommunityQuizzes(data.quizzes); }),

        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'get_community_admins', guideId })
        }).then(res => res.json()).then(data => {
          if (data.success) {
            setCommunityAdminList(data.admins);
            setCommunityAdmins(data.admins.map(a => a.email));
          }
        })
      ]);

 const uid = await AsyncStorage.getItem('@current_user_id');
      if (uid) {
        const reqStatusRes = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'check_join_request', guideId, userEmail: uid })
        });
        const reqStatusData = await reqStatusRes.json();
        setIsBanned(!!reqStatusData.isBanned);
        setJoinRequestPending(!reqStatusData.isBanned && !!reqStatusData.isPending);
      }

    } catch (error) {
      console.log("Refresh Error:", error);
    } finally {
      setRefreshing(false); // রিফ্রেশ লোডিং অফ
    }
  }, [lessonItem]);
  const [selectedGuide, setSelectedGuide] = useState(null);

  // 🚀 বই এডিট ও ডিলিট করার স্টেট এবং লজিক
  const [isGuideEditModalVisible, setIsGuideEditModalVisible] = useState(false);
  const [editingChannelGuide, setEditingChannelGuide] = useState(null);
  const [tempGuideTitle, setTempGuideTitle] = useState("");
  const [tempGuideThumbnail, setTempGuideThumbnail] = useState("");
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleEditGuideClick = (guide) => {
    setEditingChannelGuide(guide);
    setTempGuideTitle(guide.notebookName || "");
    setTempGuideThumbnail(guide.thumbnail || "");
    setIsGuideEditModalVisible(true);
  };

 // 🚀 ImgBB Upload Helper
  const uploadToImgBB = async (base64String) => {
    try {
      let formData = new FormData();
      formData.append("image", base64String);
     const imgbbKey = process.env.EXPO_PUBLIC_IMGBB_KEY;
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (e) { return null; }
  };

const pickGuideThumbnail = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets[0].uri) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }], 
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipResult.base64) {
        setTempGuideThumbnail(`data:image/jpeg;base64,${manipResult.base64}`);
        setIsImageUploading(true); // 🚀 বাটন লক
        const imgUrl = await uploadToImgBB(manipResult.base64);
        if (imgUrl) setTempGuideThumbnail(imgUrl);
        setIsImageUploading(false); // 🚀 বাটন আনলক
      }
    }
  };

  const saveGuideEdits = async () => {
    if (!tempGuideTitle.trim()) return Alert.alert("সতর্কতা", "গাইডের নাম ফাঁকা রাখা যাবে না!");
    
    const updatedGuide = { ...editingChannelGuide, notebookName: tempGuideTitle, thumbnail: tempGuideThumbnail };
    
    // সাথে সাথে স্ক্রিনে আপডেট দেখানোর জন্য
    setChannelGuides(prev => prev.map(g => g.id === updatedGuide.id ? updatedGuide : g));
    setIsGuideEditModalVisible(false);

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'save_guide', guideData: updatedGuide })
      });
    } catch (e) { console.log("Update Error:", e); }
  };

  const handleDeleteChannelGuide = (guide) => {
    Alert.alert("ডিলিট করুন", "আপনি কি সত্যিই এই বইটি ডিলিট করতে চান?", [
      { text: "না", style: "cancel" },
      { 
        text: "হ্যাঁ, মুছুন", 
        style: "destructive",
        onPress: async () => {
          // সাথে সাথে স্ক্রিন থেকে রিমুভ করার জন্য
          setChannelGuides(prev => prev.filter(g => g.id !== guide.id));
          try {
            await fetch('https://growshelby-api.vercel.app/api/update_coins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
              body: JSON.stringify({ action: 'delete_guide', shareCode: guide.shareCode })
            });
          } catch (e) { console.log("Delete Error:", e); }
        }
      }
    ]);
  };

  useEffect(() => {
    const fetchGuides = async () => {
      if (!visible) return;
      
 if (lessonItem?.channelId) {
        setIsLoadingGuides(true);
        try {
        // 🚀 Master Account থেকে নির্দিষ্ট টার্গেটের (যেমন HSC) স্টাডি প্যাক ফেচ করা হচ্ছে
                const data = await apiCall('fetch_channel_guides', {
            action: 'fetch_channel_guides',
            channelId: 'rumontrader662@gmail.com',
            targetCategory: lessonItem?.niche,
          });

          if (!data?.success) {
            console.log('🔴 গাইড ফেচ ফেইল — লোকাল লিস্ট আগের মতোই থাকল');
          } else {
            const serverGuides = data.guides || [];
            console.log(`📥 সার্ভার থেকে ${serverGuides.length} টি গাইড | niche = "${lessonItem?.niche}"`);
            serverGuides.forEach(g =>
              console.log(`   • ${g.shareCode} | ${g.notebookName} | target="${g.target}" | channelId=${g.channelId} | banks=${g.failedItems?.length || 0}`)
            );

            Object.values(addedTrackerRef.current.guides).forEach(saved => {
              const found = serverGuides.find(g => g.shareCode === saved.shareCode);
              if (!found) {
                console.log('🔴🔴 MISSING GUIDE:', saved.notebookName);
                console.log('   সেভের সময়: target=', saved.target, '| channelId=', saved.channelId);
                console.log('   ফেচের সময়: targetCategory=', lessonItem?.niche, '| channelId=rumontrader662@gmail.com');
                console.log('   target মেলে?', saved.target === lessonItem?.niche);
              } else {
                console.log('🟢 গাইড সার্ভারে আছে:', saved.notebookName);
              }
            });

            Object.values(addedTrackerRef.current.banks).forEach(({ shareCode, bankId, bankName }) => {
              const g = serverGuides.find(x => x.shareCode === shareCode);
              const bankFound = g?.failedItems?.some(b => b.bankId === bankId);
              console.log(bankFound ? `🟢 ব্যাংক আছে: ${bankName}` : `🔴🔴 MISSING BANK: ${bankName} (গাইড পাওয়া গেছে? ${!!g})`);
            });

            setChannelGuides(serverGuides);
          }

      const uid = await AsyncStorage.getItem('@current_user_id');
          // 🚀 Master Account থেকে নির্দিষ্ট টার্গেটের (যেমন HSC) কুইজ ফেচ করা হচ্ছে
          const quizRes = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
            body: JSON.stringify({ action: 'fetch_community_quizzes', channelId: 'rumontrader662@gmail.com', targetCategory: lessonItem?.niche, userEmail: uid })
          });
          const quizData = await quizRes.json();
          if (quizData.success) setCommunityQuizzes(quizData.quizzes || []);

        } catch (e) { console.log(e); }
        finally { setIsLoadingGuides(false); }
      } else if (lessonItem && !lessonItem.channelId) {
        // যদি নিজের লাইব্রেরি থেকে ওপেন করে, তবে এটাই তার বই
        setChannelGuides([lessonItem]);
      }
    };
    fetchGuides();
  }, [visible, lessonItem]);

 const router = useRouter();

  // 🚀 FIX 2: নোটিফিকেশন থেকে আসলে অটোমেটিক SmartReaderEngine ওপেন করার ম্যাজিক!
  useEffect(() => {
    if (visible && lessonItem?.autoOpenReader) {
      const timer = setTimeout(() => {
        openBookInReader(lessonItem);
      }, 500); // লবি রেন্ডার হওয়ার আধা সেকেন্ড পর অটোমেটিক রিডার খুলে যাবে
      return () => clearTimeout(timer);
    }
  }, [visible, lessonItem]);

  // ব্যাকআপ ইভেন্ট লিসেনার (যদি রাউটিং ডিলে হয়)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('auto_open_smart_reader', (guide) => {
       if (visible) openBookInReader(guide);
    });
    return () => subscription.remove();
  }, [visible]);

 const openBookInReader = async (guide) => {
    const guideWithChannelInfo = { ...guide, channelId: lessonItem?.channelId || lessonItem?.creatorEmail || 'default_channel' };
    
    setSelectedGuide(guideWithChannelInfo);
    setReaderVisible(true);

    // 🚀 ব্যাকগ্রাউন্ডে ভিউ কাউন্ট আপডেট করা (যাতে অ্যাপ স্লো না হয়)
    if (currentUserEmail) {
      try {
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ 
            action: 'record_guide_view', 
            shareCode: guide.shareCode, 
            userEmail: currentUserEmail 
          })
        });
        
        // 🚀 লোকাল স্টেট আপডেট করা যাতে রিফ্রেশ না করেই সাথে সাথে ভিউ বেড়ে যায়
        setChannelGuides(prevGuides => prevGuides.map(g => {
          if (g.shareCode === guide.shareCode && (!g.viewedBy || !g.viewedBy.includes(currentUserEmail))) {
            return { ...g, views: (g.views || 0) + 1, viewedBy: [...(g.viewedBy || []), currentUserEmail] };
          }
          return g;
        }));
      } catch (e) {
        console.log("View count error", e);
      }
    }
  };
  // 🚀 ম্যাজিক বাউন্স অ্যানিমেশন ইঞ্জিন
  

  const [membersSkip, setMembersSkip] = useState(0);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
 // 🚀 অরিজিনাল কমিউনিটি বাউন্স অ্যানিমেশন (ফুল স্ক্রিন সাপোর্ট)
  const membersSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const membersFadeAnim = useRef(new Animated.Value(0)).current;
  // 🚀 Vibe Coder Magic: ফ্রেন্ড ও প্রোফাইল ট্র্যাকিং স্টেটস
 const [myFriends, setMyFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]); // 🚀 নতুন যুক্ত করা হলো
  const [profileStack, setProfileStack] = useState([]); 
  const profileSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // 🚀 সরাসরি রিকোয়েস্ট এক্সেপ্ট করার লজিক
  const handleAcceptRequest = async (targetEmail, targetName, targetAvatar) => {
    setReceivedRequests(prev => prev.filter(e => e !== targetEmail));
    setMyFriends(prev => [{ email: targetEmail, name: targetName, avatar: targetAvatar }, ...prev]); 
    try {
      const currentUid = await AsyncStorage.getItem('@current_user_id');
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'accept_friend_request_direct', senderEmail: targetEmail, receiverEmail: currentUid })
      });
    } catch(e) {}
  };

  // 🚀 মডাল ওপেন/ক্লোজ হলে ফ্রেন্ড লিস্ট আনা ও স্ট্যাক রিসেট করা
  useEffect(() => {
    if (!membersModalVisible) {
      setProfileStack([]);
      profileSlideAnim.setValue(Dimensions.get('window').width);
    } else {
      fetchFriendNetworkData();
    }
  }, [membersModalVisible]);

  const currentProfileEntry = profileStack[profileStack.length - 1];
  const selectedLiveMember = currentProfileEntry?.member || null;
  const selectedUserProfile = currentProfileEntry?.profileData || null;
  const isProfileLoading = currentProfileEntry ? currentProfileEntry.isLoading : true;

  const fetchFriendNetworkData = async () => {
    try {
      const currentUid = await AsyncStorage.getItem('@current_user_id') || 'guest';
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'get_lobby_data', userEmail: currentUid, searchQuery: '', guideId: lessonItem?.channelId || 'default' })
      });
    const result = await response.json();
      if (result.success) {
        setMyFriends(result.friends || []);
        setPendingRequests(result.sentRequestEmails || []);
        setReceivedRequests(result.receivedRequestEmails || []); // 🚀 রিসিভড রিকোয়েস্ট ট্র্যাক
      }
    } catch (error) { console.log(error); }
  };

 const handleAddFriend = async (targetEmail) => {
    if (!isMember && lessonItem?.creatorEmail !== currentUserEmail) {
      setCustomAlert({
        visible: true,
        title: "অ্যাক্সেস নেই!",
        message: "শুধুমাত্র কমিউনিটি মেম্বাররাই একে অপরকে ফ্রেন্ড রিকোয়েস্ট পাঠাতে পারবে।",
        type: "error"
      });
      return;
    }
    const isAlreadyPending = pendingRequests.includes(targetEmail);
    if (isAlreadyPending) {
      setPendingRequests(prev => prev.filter(email => email !== targetEmail));
      try {
        const currentUid = await AsyncStorage.getItem('@current_user_id');
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'cancel_friend_request', senderEmail: currentUid, receiverEmail: targetEmail })
        });
      } catch(e) {}
    } else {
      setPendingRequests(prev => [...prev, targetEmail]);
      try {
        const currentUid = await AsyncStorage.getItem('@current_user_id');
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'send_friend_request', senderEmail: currentUid, receiverEmail: targetEmail })
        });
      } catch(e) {}
    }
  };

  const fetchProfileFriends = async (type, reset = false, specificEmail = null) => {
    const targetEmail = specificEmail || selectedLiveMember?.email || selectedLiveMember?.id;
    if (!targetEmail) return;

    setProfileStack(prev => {
      const newStack = [...prev];
      if (newStack.length === 0) return newStack;
      const lastIdx = newStack.length - 1;
      if (!reset && (!newStack[lastIdx].hasMoreInlineFriends || newStack[lastIdx].isFetchingFriends)) return newStack;
      
      newStack[lastIdx] = { 
        ...newStack[lastIdx], 
        isFetchingFriends: true,
        inlineFriendsType: type,
        ...(reset ? { inlineFriends: [], inlineFriendsSkip: 0, hasMoreInlineFriends: true } : {})
      };
      return newStack;
    });

    try {
      const currentUid = await AsyncStorage.getItem('@current_user_id') || 'guest';
      let currentSkip = 0;
      setProfileStack(prev => {
        if(prev.length > 0) currentSkip = prev[prev.length - 1].inlineFriendsSkip;
        return prev;
      });

      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ 
          action: 'get_profile_friends', 
          targetEmail: targetEmail, 
          viewerEmail: currentUid,
          listType: type,
          limit: 10,
          skip: currentSkip
        })
      });
      const result = await response.json();
      
      if (result.success) {
        setProfileStack(prev => {
          const newStack = [...prev];
          if (newStack.length === 0) return newStack;
          const lastIdx = newStack.length - 1;
          if ((newStack[lastIdx].member.userEmail || newStack[lastIdx].member.email || newStack[lastIdx].member.id) !== targetEmail) return newStack;

          newStack[lastIdx] = {
            ...newStack[lastIdx],
            inlineFriends: reset ? result.friends : [...newStack[lastIdx].inlineFriends, ...result.friends],
            inlineFriendsSkip: currentSkip + 10,
            hasMoreInlineFriends: result.friends.length >= 10,
            isFetchingFriends: false
          };
          return newStack;
        });
      }
    } catch (e) {
      setProfileStack(prev => {
        const newStack = [...prev];
        if (newStack.length > 0) newStack[newStack.length - 1].isFetchingFriends = false;
        return newStack;
      });
    }
  };

  const openMemberProfile = async (member) => {
    setProfileStack(prev => [...prev, { 
      member, 
      profileData: null, 
      isLoading: true,
      inlineFriends: [],
      inlineFriendsSkip: 0,
      hasMoreInlineFriends: true,
      inlineFriendsType: 'all',
      isFetchingFriends: false
    }]);
    
    const targetEmail = member.userEmail || member.email || member.id || member.name;
    fetchProfileFriends('all', true, targetEmail);
    
    if (profileStack.length === 0) {
      Animated.spring(profileSlideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
    }

    try {
      const currentUid = await AsyncStorage.getItem('@current_user_id') || 'guest';
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'get_user_social_profile', targetEmail: targetEmail, viewerEmail: currentUid })
      });
      const result = await response.json();
      if (result.success) {
        setProfileStack(prev => {
          const newStack = [...prev];
          const lastIndex = newStack.length - 1;
          newStack[lastIndex] = { ...newStack[lastIndex], profileData: result.data, isLoading: false };
          return newStack;
        });
      }
    } catch (error) {}
  };

  const goBackProfile = () => {
    if (profileStack.length > 1) {
      setProfileStack(prev => prev.slice(0, -1));
    } else {
      closeMemberProfile();
    }
  };

  const closeMemberProfile = () => {
    Animated.spring(profileSlideAnim, { toValue: Dimensions.get('window').width, friction: 8, tension: 50, useNativeDriver: true }).start(() => setProfileStack([]));
  };

useEffect(() => {
    if (membersModalVisible) {
      // 🚀 স্মার্ট লজিক: মডাল ওপেন হওয়ার ঠিক আগে পজিশন রিসেট, যাতে অ্যানিমেশন কখনো আটকে না যায়
      membersSlideAnim.setValue(Dimensions.get('window').height);
      
      Animated.parallel([
        Animated.timing(membersFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(membersSlideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true })
      ]).start();
    }
  }, [membersModalVisible]);

  // মডালটা স্মুথলি নামার ফাংশন
  const closeMembersModalSmoothly = () => {
    Animated.parallel([
      Animated.timing(membersFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(membersSlideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true })
    ]).start(() => setMembersModalVisible(false));
  };
// 🚀 রেটিং ও রিভিউ বাউন্স অ্যানিমেশন লজিক
  const reviewSlideAnim = useRef(new Animated.Value(1000)).current;
  const reviewFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isReviewModalVisible) {
      Animated.parallel([
        Animated.timing(reviewFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(reviewSlideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true })
      ]).start();
    }
  }, [isReviewModalVisible]);

  const closeReviewModalSmoothly = () => {
    Animated.parallel([
      Animated.timing(reviewFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(reviewSlideAnim, { toValue: 1000, duration: 250, useNativeDriver: true })
    ]).start(() => setIsReviewModalVisible(false));
  };

  useEffect(() => {
    const fetchInitialMembers = async () => {
      setIsLoadingMembers(true); // 🚀 ডেটা লোড হওয়া শুরু (স্কেলেটন দেখাবে)
      const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
     const uid = await AsyncStorage.getItem('@current_user_id');
          if (uid) {
            setCurrentUserEmail(uid);
            // 🚀 ইউজারের আসল নাম লোকাল স্টোরেজ থেকে ফেচ করা হচ্ছে
            const name = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || 'শিক্ষার্থী';
            setCurrentUserName(name);
          }
          
       if (guideId) {
        try {
          const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
            body: JSON.stringify({ action: 'get_community_members', guideId, limit: 10, skip: 0 })
          });
       const data = await res.json();
          // ফেচ অ্যাডমিনস
          const admRes = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
            body: JSON.stringify({ action: 'get_community_admins', guideId })
          });
          const admData = await admRes.json();
          let tempAdmins = [];
          
          if (data.success) {
            setMembers(data.members);
            if (data.totalMembers !== null) setTotalMemberCount(data.totalMembers);
            
            const isOwnerCheck = lessonItem?.creatorEmail === uid || lessonItem?.channelId === uid;
            let tempStaff = isOwnerCheck || uid === 'rumontrader662@gmail.com';

            if (admData.success) {
               setCommunityAdminList(admData.admins);
               tempAdmins = admData.admins.map(a => a.email);
               setCommunityAdmins(tempAdmins);
               if(tempAdmins.includes(uid)) tempStaff = true;
            }

          const isUserMember = data.members.some(m => m.userEmail === uid) || isOwnerCheck;
            setIsMember(isUserMember || uid === 'rumontrader662@gmail.com');
            if (data.members.length < 10) setHasMoreMembers(false);

         setIsBanned(false);
            setJoinRequestPending(false);
            if (!isUserMember && uid) {
              const reqStatusRes = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                body: JSON.stringify({ action: 'check_join_request', guideId, userEmail: uid })
              });
              const reqStatusData = await reqStatusRes.json();
              if (reqStatusData.isBanned) setIsBanned(true);
              else if (reqStatusData.isPending) setJoinRequestPending(true);
            }

            // 🚀 ইউজার যদি অ্যাডমিন বা CA হয়, তবে পেন্ডিং রিকোয়েস্টগুলো ফেচ করবে
            if (tempStaff) {
               fetch('https://growshelby-api.vercel.app/api/update_coins', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                  body: JSON.stringify({ action: 'get_pending_join_requests', guideId, actorEmail: uid })
               }).then(res => res.json()).then(reqData => {
                  if (reqData.success) setPendingJoinRequests(reqData.requests || []);
               }).catch(e => console.log(e));
            }
          }
        } catch (e) {} finally {
          setIsLoadingMembers(false); // 🚀 ডেটা লোড শেষ (আসল ছবি দেখাবে)
        }
      }else {
        setIsLoadingMembers(false);
      }
    };
    if (visible) {
      setMembers([]); setMembersSkip(0); setHasMoreMembers(true); fetchInitialMembers();
    }
  }, [visible, lessonItem]);

  // 🚀 ডাটাবেস থেকে আসল রিভিউগুলো নিয়ে আসা
  useEffect(() => {
    const fetchRealReviews = async () => {
      const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
      if (!guideId || !visible) return;
      
      setIsLoadingReviews(true);
      try {
        const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'get_reviews', guideId })
        });
        const data = await res.json();
        if (data.success && data.reviews) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.log("Reviews fetch error:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchRealReviews();
  }, [visible, lessonItem]);

  // 🚀 রেটিং ক্যালকুলেশন এবং ইউজার রিভিউ চেক
  useEffect(() => {
    const calculateAndCheckReview = async () => {
      // ১. গড় রেটিং বের করা
      if (reviews.length > 0) {
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avg = (total / reviews.length).toFixed(1); // 4.5 বা 4.0 ফরমেটে আনবে
        setAverageRating(avg);
      } else {
        setAverageRating(0);
      }

      // ২. বর্তমান ইউজার আগে রিভিউ দিয়েছে কিনা চেক করা
      const uid = await AsyncStorage.getItem('@current_user_id');
      if (uid) {
        const alreadyReviewed = reviews.some(review => review.userId === uid);
        setHasUserReviewed(alreadyReviewed);
      }
    };
    
    calculateAndCheckReview();
  }, [reviews]); // যখনই reviews এর ডাটা চেঞ্জ হবে, এটা আবার ক্যালকুলেট হবে

  const loadMoreMembers = async () => {
    if (isLoadingMembers || !hasMoreMembers) return;
    setIsLoadingMembers(true);
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
    const newSkip = membersSkip + 10;
    
    try {
      const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'get_community_members', guideId, limit: 10, skip: newSkip })
      });
      const data = await res.json();
      if (data.success) {
        if (data.members.length < 10) setHasMoreMembers(false);
        setMembers(prev => [...prev, ...data.members]);
        setMembersSkip(newSkip);
      }
    } catch (e) {} finally {
      setIsLoadingMembers(false);
    }
  };

const [joinRequestPending, setJoinRequestPending] = useState(false);

const handleJoinCommunity = async () => {
    if (isBanned) return;
    const uid = await AsyncStorage.getItem('@current_user_id');
    const name = await AsyncStorage.getItem(`@user_name_${uid}`) || 'শিক্ষার্থী';
    const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;

    setJoinRequestPending(true);

    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'send_join_request', guideId, userEmail: uid, userName: name, userAvatar: avatar })
      });
      const result = await response.json();

      if (result.banned) {
        setJoinRequestPending(false);
        setIsBanned(true);
      } else if (result.success) {
        setCustomAlert({ visible: true, title: "রিকোয়েস্ট পাঠানো হয়েছে! 🎉", message: "অ্যাডমিন অ্যাপ্রুভ করলে আপনি এই কমিউনিটির মেম্বার হতে পারবেন।", type: "success" });
      } else {
        setJoinRequestPending(false);
        setCustomAlert({ visible: true, title: "দুঃখিত!", message: "রিকোয়েস্ট পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।", type: "error" });
      }
    } catch (error) {
      setJoinRequestPending(false);
      setCustomAlert({ visible: true, title: "কানেকশন এরর!", message: "ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।", type: "error" });
    }
  };

const handleRemoveMember = (memberEmail, memberName) => {
    const doRemove = async (email, ban) => {
      const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
      try {
        const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'remove_community_member', guideId, memberEmail: email, ban })
        });
        const data = await res.json();
        if (data.success) {
          setMembers(prev => prev.filter(m => (m.userEmail || m.email || m.id) !== email));
          setTotalMemberCount(prev => prev - 1);
        } else {
          Alert.alert("দুঃখিত", data.error || "রিমুভ করা যায়নি");
          handleMembersBadgeClick();
        }
      } catch(e) {
        Alert.alert("দুঃখিত", "ইন্টারনেট সমস্যা, আবার চেষ্টা করুন");
      }
    };

    Alert.alert(
      "মেম্বার রিমুভ",
      `আপনি কি সত্যিই ${memberName}-কে রিমুভ করতে চান?`,
      [
        { text: "বাতিল", style: "cancel" },
        { text: "রিমুভ করুন", style: "destructive", onPress: () => doRemove(memberEmail, false) },
        { text: "পার্মানেন্ট ব্যান", style: "destructive", onPress: () => doRemove(memberEmail, true) }
      ]
    );
  };
 const fetchBannedList = async () => {
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
    setIsBannedLoading(true);
    try {
      const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'get_community_bans', guideId })
      });
      const data = await res.json();
      if (data.success) setBannedList(data.bans);
    } catch(e) {}
    setIsBannedLoading(false);
  };

const searchCandidates = (text) => {
    setCaSearchQuery(text);
    setIsCaSearching(true);
    
    if (caSearchTimeout.current) clearTimeout(caSearchTimeout.current);
    const reqId = ++caSearchReqId.current;

    caSearchTimeout.current = setTimeout(async () => {
      try {
        const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
        const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'search_ca_candidates', guideId, query: text })
        });
        const data = await res.json();
        if (reqId === caSearchReqId.current) {
          if (data.success) setCaCandidates(data.candidates || []);
          setIsCaSearching(false);
        }
      } catch(e) {
        if (reqId === caSearchReqId.current) setIsCaSearching(false);
      }
    }, 400);
  };
  // ==========================================================
  
  // ==========================================================
  // ==========================================================

  // 🚀 রিভিউ সাবমিট, এডিট ও ডিলিট করার সম্পূর্ণ লজিক
  const handleSubmitReview = async () => {
    if (userRating === 0 || !reviewText.trim()) return;
    setIsSubmittingReview(true);

    try {
      const uid = await AsyncStorage.getItem('@current_user_id');
      const name = await AsyncStorage.getItem(`@user_name_${uid}`) || 'শিক্ষার্থী';
      const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
      const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;

      if (isEditingReview) {
        // এডিট হলে লোকাল স্টেট আপডেট করা
        setReviews(reviews.map(r => r.userId === uid ? { ...r, rating: userRating, text: reviewText } : r));
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'update_review', guideId, userId: uid, rating: userRating, text: reviewText })
        });
      } else {
        // নতুন রিভিউ হলে এড করা
        const newReview = { id: Date.now().toString(), userId: uid, name, avatar, rating: userRating, text: reviewText };
        setReviews([newReview, ...reviews]);
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'add_review', guideId, review: newReview })
        });
      }

      setHasUserReviewed(true);
      setIsEditingReview(false);
      setShowReviewForm(false);
    } catch (error) {
      Alert.alert('দুঃখিত', 'রিভিউ সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditClick = async () => {
    const uid = await AsyncStorage.getItem('@current_user_id');
    const myReview = reviews.find(r => r.userId === uid);
    if (myReview) {
      setUserRating(myReview.rating);
      setReviewText(myReview.text);
      setIsEditingReview(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setHasUserReviewed(false); 
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = () => {
    Alert.alert('সতর্কতা', 'আপনি কি সত্যিই আপনার রিভিউটি মুছে ফেলতে চান?', [
      { text: 'না', style: 'cancel' },
      { 
        text: 'হ্যাঁ, মুছুন', 
        style: 'destructive',
        onPress: async () => {
          const uid = await AsyncStorage.getItem('@current_user_id');
          const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
          
          setReviews(reviews.filter(r => r.userId !== uid));
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setHasUserReviewed(false);
          setUserRating(0);
          setReviewText('');
          setShowReviewForm(false);
          setIsEditingReview(false);
          
          fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
            body: JSON.stringify({ action: 'delete_review', guideId, userId: uid })
          });
        }
      }
    ]);
  };
  // 🚀 Zen Mode Animations
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY > lastScrollY.current + 15 && currentY > 100) {
      Animated.parallel([
        Animated.timing(headerTranslateY, { toValue: -150, duration: 250, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start();
    } 
    else if (currentY < lastScrollY.current - 15 || currentY <= 50) {
      Animated.parallel([
        Animated.timing(headerTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start();
    }
    lastScrollY.current = currentY;
  };

  // 🚀 স্টুডেন্ট ব্যাজে ক্লিক করলে নতুন করে ফেচ এবং শিমার দেখানোর ফাংশন
  const handleMembersBadgeClick = async () => {
    // ১. আগের ডাটা ক্লিয়ার করে শিমার চালু করা ও মডাল ওপেন করা
    setMembers([]);
    setMembersSkip(0);
    setHasMoreMembers(true);
    setIsLoadingMembers(true);
    setMembersModalVisible(true);

    // ২. ডাটাবেস থেকে ফ্রেশ ডাটা ফেচ করা
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
    if (!guideId) {
      setIsLoadingMembers(false);
      return;
    }

    try {
      const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'get_community_members', guideId, limit: 10, skip: 0 })
      });
      const data = await res.json();
      
 if (data.success) {
        setMembers(data.members);
        if (data.totalMembers !== null) setTotalMemberCount(data.totalMembers);
        
       const uid = await AsyncStorage.getItem('@current_user_id');
        const isOwnerCheck = lessonItem?.creatorEmail === uid || lessonItem?.channelId === uid;
        let tempStaff = isOwnerCheck || uid === 'rumontrader662@gmail.com';

        const admRes = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'get_community_admins', guideId })
        });
        const admData = await admRes.json();
        if (admData.success) {
           setCommunityAdminList(admData.admins);
           const tAdmins = admData.admins.map(a => a.email);
           setCommunityAdmins(tAdmins);
           if(tAdmins.includes(uid)) tempStaff = true;
        }

       setIsMember(data.members.some(m => m.userEmail === uid) || isOwnerCheck || uid === 'rumontrader662@gmail.com');
        
        if (data.members.length < 10) setHasMoreMembers(false);

        // 🚀 অ্যাডমিন বা CA হলে মেম্বার লিস্ট ওপেন করার সময় পেন্ডিং রিকোয়েস্টও ফেচ করবে
        if (tempStaff) {
           fetch('https://growshelby-api.vercel.app/api/update_coins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
              body: JSON.stringify({ action: 'get_pending_join_requests', guideId, actorEmail: uid })
           }).then(res => res.json()).then(reqData => {
              if (reqData.success) setPendingJoinRequests(reqData.requests || []);
           }).catch(e => console.log(e));
        }
      }
    } catch (e) {
      console.log("Member Fetch Error:", e);
    } finally {
      setIsLoadingMembers(false); // ৩. নতুন ডাটা আসলে শিমার অফ হয়ে যাবে
    }
  };

 const handleShareCode = async () => { // 🚀 ফিক্স: async যুক্ত করা হলো
    // 🚀 কমিউনিটির কোড হিসেবে তার প্রথম গাইডের শেয়ার কোডটি ব্যবহার করা হবে
    const communityCode = lessonItem?.communityCode || lessonItem?.channelId || lessonItem?.creatorEmail || null;
    
    if (communityCode) {
      await Clipboard.setStringAsync(communityCode); // 🚀 ফিক্স: setStringAsync ব্যবহার করা হলো
      setShareModalType('success');
      setShareModalVisible(true);
    } else {
      setShareModalType('error');
      setShareModalVisible(true);
    }
  };

 // 🚀 লিডারবোর্ড স্টেটস (Fix: Early return-এর আগে Hook কল করতে হবে)
 const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
 const [leaderboardData, setLeaderboardData] = useState([]);
 const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
 const [activeLeaderboardQuiz, setActiveLeaderboardQuiz] = useState(null);
 const isOwner = lessonItem?.creatorEmail === currentUserEmail || lessonItem?.channelId === currentUserEmail;
 const isStaff = isOwner || communityAdmins.includes(currentUserEmail) || currentUserEmail === 'rumontrader662@gmail.com';

 // 🚀 Quiz Action Sheet States (Duolingo Style)
 const [pickedQuizForAction, setPickedQuizForAction] = useState(null);
 const quizActionSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
 const quizActionFadeAnim = useRef(new Animated.Value(0)).current;

 useEffect(() => {
   if (pickedQuizForAction) {
     quizActionSlideAnim.setValue(Dimensions.get('window').height);
     Animated.parallel([
       Animated.timing(quizActionFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
       Animated.spring(quizActionSlideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true })
     ]).start();
   }
 }, [pickedQuizForAction]);

 const closeQuizActionSheet = (callback) => {
   Animated.parallel([
     Animated.timing(quizActionFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
     Animated.timing(quizActionSlideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true })
   ]).start(() => {
     setPickedQuizForAction(null);
     if (typeof callback === 'function') callback();
   });
 };

 if (!visible) return null;

  const extractedData = lessonItem?.failedItems || lessonItem?.data || [];
  const categories = ['সব', ...Array.from(new Set(extractedData.map(item => item.type)))];

  const filteredData = extractedData.filter(item => {
    if (activeCategory === 'সব') return true;
    return item.type === activeCategory;
  });

const handleCategoryChange = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(cat);
    setGlobalReveal(false); 
    if (cat !== 'সৃজনশীল') setCqSubFilter('সব'); 
  };

const openLeaderboard = async (quiz) => {
    setActiveLeaderboardQuiz(quiz);
    setIsLeaderboardVisible(true);
    setIsLeaderboardLoading(true);
    
  try {
      const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
        body: JSON.stringify({ action: 'get_quiz_leaderboard', quizId: quiz.id || quiz._id, channelId: lessonItem?.channelId })
      });
      const data = await res.json();
      if (data.success) {
        setLeaderboardData(data.leaderboard || []);
      }
    } catch (e) {
      console.log("Leaderboard Fetch Error:", e);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

 // 🚀 স্মার্ট অটো-শিফটিং লজিক (Phase অনুযায়ী)
  const upcomingQuizzes = communityQuizzes.filter(q => {
    const hasTaken = !!quizHistoryMap[q.id || q._id];
    const phase = getEffectiveQuizPhase(q, quizClock, hasTaken);
    return phase === 'upcoming' || phase === 'live';
  });
  const pastQuizzes = communityQuizzes.filter(q => {
    const hasTaken = !!quizHistoryMap[q.id || q._id];
    return getEffectiveQuizPhase(q, quizClock, hasTaken) === 'past';
  });
  const displayQuizzes = activeQuizTab === 'upcoming' ? upcomingQuizzes : pastQuizzes;
  const takenLiveCount = communityQuizzes.filter(q => getQuizPhase(q, quizClock) === 'live' && !!quizHistoryMap[q.id || q._id]).length;

 // ==========================================================
 // ==========================================================
  // 🚀 Creator AI Quiz Generator Logic (Robust Parsing)
  // ==========================================================
  const handleCreatorCopyAIPrompt = async () => {
    let filteredQuestions = [];
    let fetchCache = {};

    // 🚀 Prefill cache from the resource picker data to skip network hits if already loaded
    if (specialPickerGroups && specialPickerGroups.length > 0) {
      specialPickerGroups.forEach(g => {
        fetchCache[`${g.guideId}__${g.communityId}`] = g.banks;
      });
    }

    // 1. Filter Questions based on rules
    if (quizSelectedRules && quizSelectedRules.length > 0) {
      for (const rule of quizSelectedRules) {
        if (rule.sourceType === 'special') {
          const specialQs = await resolveSpecialRuleQuestions(rule, fetchCache);
          filteredQuestions.push(...specialQs);
        } else {
          const sourceGuide = channelGuides.find(g => g.id === (rule.guideId || rule.id));
          if (sourceGuide && sourceGuide.failedItems) {
            sourceGuide.failedItems.forEach(bank => {
              if (bank.questions) {
                bank.questions.forEach(q => {
                  const typeMatched = !rule.allowedTypes || rule.allowedTypes.length === 0 || rule.allowedTypes.includes(q.type);
                  const topicMatched = !rule.allowedTopics || rule.allowedTopics.length === 0 || rule.allowedTopics.includes(q.topic);
                  
                  if (typeMatched && topicMatched) {
                    filteredQuestions.push(q);
                  }
                });
              }
            });
          }
        }
      }
    }

    if (filteredQuestions.length === 0) {
      return Alert.alert("রিসোর্স নেই", "প্রথমে সিলেবাস ও ফিল্টার থেকে রিসোর্স সিলেক্ট করুন।");
    }

    // 2. Clean Data Logic
    let cleanData = [];
    filteredQuestions.forEach(q => {
      const mainText = q.type === 'সৃজনশীল' ? q.stem : (q.question || q.stem);
      
      // বাদ দেওয়া: টেক্সট ফাঁকা বা শুধু ছবি আছে
      if (!mainText || String(mainText).trim() === '') return;

      let item = { type: q.type, topic: q.topic };

      if (q.options && Array.isArray(q.options)) {
        // MCQ 
        item.q = q.question;
        item.options = q.options;
        let correctText = '';
        if (q.answer !== undefined && q.answer !== null && !isNaN(Number(q.answer)) && q.options[Number(q.answer)]) {
           correctText = q.options[Number(q.answer)];
        } else {
           correctText = q.correctAnswer;
        }
        item.a = correctText;
      } else if (q.questions && Array.isArray(q.questions)) {
        // সৃজনশীল
        item.stem = q.stem;
        item.parts = q.questions.map(p => {
           let part = { label: p.label, q: p.question, a: p.answer };
           Object.keys(part).forEach(k => (!part[k] || String(part[k]).trim() === '') && delete part[k]);
           return part;
        });
      } else {
        // শর্ট প্রশ্ন বা অন্যান্য
        item.q = q.question || q.stem;
        item.a = q.answer || q.correctAnswer;
      }

      // ফাঁকা এবং undefined ফিল্ডগুলো ডিলিট করা
      Object.keys(item).forEach(key => {
        if (item[key] === undefined || item[key] === null || String(item[key]).trim() === '') {
          delete item[key];
        }
      });

      cleanData.push(item);
    });

    if (cleanData.length === 0) {
       return Alert.alert("রিসোর্স নেই", "বাছাই করা প্রশ্নগুলোর টেক্সট ফাঁকা, পর্যাপ্ত ডেটা পাওয়া যায়নি।");
    }

    // 3. Limit to 120 questions evenly distributed across topics
    const originalCount = cleanData.length;
    if (cleanData.length > 120) {
       const byTopic = {};
       cleanData.forEach(item => {
          const t = item.topic || 'Unknown';
          if (!byTopic[t]) byTopic[t] = [];
          byTopic[t].push(item);
       });

       // Shuffle arrays inside topics
       for (let t in byTopic) {
          byTopic[t].sort(() => Math.random() - 0.5);
       }

       const selected = [];
       let topics = Object.keys(byTopic);
       let i = 0;
       
       while (selected.length < 120 && topics.length > 0) {
          const currentTopic = topics[i % topics.length];
          if (byTopic[currentTopic].length > 0) {
             selected.push(byTopic[currentTopic].shift());
          } else {
             topics.splice(i % topics.length, 1);
             continue; 
          }
          i++;
       }
       cleanData = selected;
    }

    // 4. Prompt injection 
    const prompt = `You are an expert Bangladeshi HSC exam setter. Create exactly 30 high-quality Multiple Choice Questions (MCQs) in Bengali, based ONLY on the study material given at the end.

## About the material
The material is a JSON array. Each item has a "type" (e.g. MCQ, short question, creative/সৃজনশীল, etc.), a "topic", and the content:
- Short/knowledge questions: "q" with its model answer "a".
- MCQ items: "q", "options", and "a" (the correct answer text).
- Creative (সৃজনশীল) items: "stem" (the stimulus passage) and "parts" (ক, খ, গ, ঘ), each with a question and its answer.
Read ALL items. Every fact in the answers is a source of truth.

## Rules for creating the 30 MCQs
1. Cover ALL topics in the material as evenly as possible. Do not repeat the same fact twice.
2. Use a mix: about 40% recall (knowledge), 40% understanding/application, 20% higher-order (reasoning, comparison, multi-statement style like "i, ii, iii" combinations). Stimulus-based questions: you may write a short stimulus inside the question text.
3. Convert creative and short questions into MCQs by testing the key fact, concept, reason or calculation in their answers.
4. Only one option must be clearly correct. The 3 wrong options (distractors) must be plausible, similar in length and style, and based on common student mistakes. Never use "all of the above" or "none of the above".
5. The correct answer must be supported by the material. Do not invent facts, numbers or formulas that are not in the material. Do not use outside knowledge to change an answer.
6. Spread the correct answer positions evenly: roughly 7-8 questions each for position 0, 1, 2 and 3. Do not make a pattern.
7. Questions must be self-contained. Never write "according to the text/above/given passage" unless the stimulus is included in the question itself.
8. Write everything in clear Bengali (subject terms may stay in English where the textbook uses them). Keep each question under 3 lines and each option short.
9. Skip any item whose question text is empty or unclear.
10. If the material has fewer than 30 usable facts, create more questions by testing the same facts from different angles (definition, reason, example, comparison), but still never invent new facts.

## Output format (VERY IMPORTANT)
- Output ONLY plain text lines. No JSON, no brackets, no markdown, no code fences, no numbering, no headings, no explanation before or after.
- Exactly 30 lines. One question per line, in exactly this format:
  question text | option 1 | option 2 | option 3 | option 4 | correct option number
- Use the pipe character | ONLY as the separator. Never use | inside the question or options.
- The correct option number is a single digit 1, 2, 3 or 4 (1 = option 1, 4 = option 4), written in English digits.
- Do NOT write ক/খ/গ/ঘ or A/B/C/D labels before options.
- No line breaks inside a question. Do not leave blank lines between questions.
- You may use any quote characters inside the text freely.
- Example of one line:
  বাংলাদেশের স্বাধীনতা ঘোষণা কবে করা হয়? | ২৫ মার্চ ১৯৭১ | ২৬ মার্চ ১৯৭১ | ১৬ ডিসেম্বর ১৯৭১ | ১৭ এপ্রিল ১৯৭১ | 2
- Before answering, silently check: exactly 30 lines, each line has exactly 6 parts separated by |, the correct number matches the right option, and correct positions are spread evenly across 1-4.

## Study material
${JSON.stringify(cleanData)}`;

    // 5. Clipboard & Alert logic
    await Clipboard.setStringAsync(prompt);
    
    if (originalCount > 120) {
      Alert.alert("প্রম্পট কপি হয়েছে! 🚀", `লিমিট ঠিক রাখতে ${originalCount} টি থেকে সমানভাবে ১২০ টি প্রশ্ন নেওয়া হয়েছে।\n\nএখন ChatGPT বা Claude-এ গিয়ে পেস্ট করুন।`);
    } else {
      Alert.alert("প্রম্পট কপি হয়েছে! 🚀", "এখন ChatGPT বা Claude-এ গিয়ে পেস্ট করুন এবং যে JSON দিবে তা নিচে পেস্ট করুন।");
    }
  };

 const handleCreatorParseQuizJson = () => {
    try {
      if (!quizJsonInput || !quizJsonInput.trim()) {
        return Alert.alert("পার্স এরর", "AI-কে বলুন: প্রতি লাইনে একটা প্রশ্ন, | দিয়ে ভাগ করে দিন");
      }

      // ১. টেক্সট ক্লিন করা
      let text = quizJsonInput;
      text = text.replace(/```json/gi, '').replace(/```/g, ''); // Remove code fences
      text = text.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters & BOM
      
      // শুধু নির্দিষ্ট এস্কেপ করা মার্কডাউন ফিক্স (যাতে JSON এর ভেতরে থাকা " এবং \n নষ্ট না হয়)
      text = text.replace(/\\\[/g, '[').replace(/\\\]/g, ']')
                 .replace(/\\_/g, '_').replace(/\\\*/g, '*')
                 .replace(/\\\|/g, '|');

      let validQuestions = [];
      let rejectedCount = 0;

      // প্রিফিক্স মুছে ফেলার রেগুলার এক্সপ্রেশন
      const cleanQuestionText = (str) => str.replace(/^[\s\d১-৯]+[.)\-]\s*/, '').replace(/^-\s*/, '').trim();
      const cleanOptionText = (str) => str.replace(/^[\sকখগঘABCD]+[.)]\s*/, '').replace(/^\([কখগঘABCD]\)\s*/, '').trim();

   // ২. মোড ১ (পাইপ-ফরম্যাট পার্সিং - টানা লাইন বা মাল্টি-লাইন সব সাপোর্ট করবে)
      if (text.includes('|')) {
        const parts = text.split('|').map(p => p.trim());
        if (parts.length >= 6) {
          let currentQText = cleanQuestionText(parts[0]);
          
          for (let i = 0; i < parts.length - 5; i += 5) {
            const o1 = cleanOptionText(parts[i + 1]);
            const o2 = cleanOptionText(parts[i + 2]);
            const o3 = cleanOptionText(parts[i + 3]);
            const o4 = cleanOptionText(parts[i + 4]);
            
            const mixedPart = parts[i + 5]; // এখানে উত্তর + পরের প্রশ্ন (যদি লাইনব্রেক না থাকে) একসাথেই থাকতে পারে
            
            // উত্তর (প্রথম সংখ্যা) এবং পরের প্রশ্ন আলাদা করা
            const ansMatch = mixedPart ? mixedPart.match(/^([0-9০-৯]+)\s*([\s\S]*)$/) : null;
            
            if (ansMatch) {
              const ansNum = parseInt(toEnglishNumber(ansMatch[1]), 10);
              const nextQText = cleanQuestionText(ansMatch[2]);
              
              if (currentQText && o1 && o2 && o3 && o4 && ansNum >= 1 && ansNum <= 4) {
                validQuestions.push({
                  question: currentQText,
                  options: [o1, o2, o3, o4],
                  correctAnswerIndex: ansNum - 1
                });
              } else {
                rejectedCount++;
              }
              currentQText = nextQText; // পরের প্রশ্নের জন্য সেট করা
            } else {
              rejectedCount++;
              break; // উত্তর না পেলে এই ব্লক ব্রেক করবে
            }
          }
        }
      }

      // ৩. মোড ২ (JSON ফ্যালব্যাক) - যদি লাইন মোডে কিছুই না পাওয়া যায়
      if (validQuestions.length === 0) {
        rejectedCount = 0;
        let jsonStr = text;
        const firstBracket = jsonStr.indexOf('[');
        const lastBracket = jsonStr.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
        }

        // স্মার্ট কোট ফিক্স ও ট্রেইলিং কমা রিমুভ
        jsonStr = jsonStr.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

        let parsedArray = null;
        try {
          parsedArray = JSON.parse(jsonStr);
        } catch (e1) {
          try {
            // যদি key গুলোতে single quote বা quote না থাকে
            jsonStr = jsonStr.replace(/['"]?question['"]?\s*:/g, '"question":')
                             .replace(/['"]?options['"]?\s*:/g, '"options":')
                             .replace(/['"]?correctAnswerIndex['"]?\s*:/g, '"correctAnswerIndex":');
            parsedArray = JSON.parse(jsonStr);
          } catch (e2) {
            // শেষ চেষ্টা: রেজেক্স দিয়ে আলাদা আলাদা অবজেক্ট বের করা
            parsedArray = [];
            const objRegex = /\{[^{}]*\}/g;
            const matches = jsonStr.match(objRegex);
            if (matches) {
              for (const match of matches) {
                try {
                  parsedArray.push(JSON.parse(match));
                } catch (e3) {} // ইনভ্যালিড অবজেক্টগুলো স্কিপ
              }
            }
          }
        }

        // ৪. JSON ডেটা ভ্যালিডেশন
        if (Array.isArray(parsedArray)) {
          for (let item of parsedArray) {
            let qText = (item.question || '').toString().trim();
            let opts = Array.isArray(item.options) ? item.options.map(o => (o || '').toString().trim()) : [];
            
            // প্রিফিক্স ক্লিন
            qText = cleanQuestionText(qText);
            opts = opts.map(cleanOptionText);

            let cIndex = item.correctAnswerIndex;
            if (typeof cIndex === 'string') cIndex = parseInt(toEnglishNumber(cIndex), 10);

            if (qText && opts.length === 4 && opts.every(o => o.length > 0) && Number.isInteger(cIndex) && cIndex >= 0 && cIndex <= 3) {
              validQuestions.push({ question: qText, options: opts, correctAnswerIndex: cIndex });
            } else {
              rejectedCount++;
            }
          }
        }
      }

      // ৫. ফলাফল
      if (validQuestions.length > 0) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTempGeneratedQuestions(validQuestions);
        let msg = `${validQuestions.length} টি প্রশ্ন পার্স হয়েছে`;
        if (rejectedCount > 0) msg += `\n(${rejectedCount} টি প্রশ্ন ভুল ফরম্যাটের কারণে বাদ গেছে)`;
        Alert.alert("সফল!", msg);
      } else {
        Alert.alert("পার্স এরর", "AI-কে বলুন: প্রতি লাইনে একটা প্রশ্ন, | দিয়ে ভাগ করে দিন");
      }
    } catch (error) {
      console.log("Parse Error: ", error);
      Alert.alert("পার্স এরর", "AI-কে বলুন: প্রতি লাইনে একটা প্রশ্ন, | দিয়ে ভাগ করে দিন");
    }
  };

  const handleQuizOptionSelect = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuizAnswers(prev => ({ ...prev, [currentQuizIndex]: index }));
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < parsedQuizData.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      handleQuizFinish();
    }
  };

const handleQuizFinish = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let failedItemsToSave = [];

    parsedQuizData.forEach((q, idx) => {
      const userAnswer = quizAnswers[idx];
      if (userAnswer === undefined || userAnswer === null) {
        skipped++;
        failedItemsToSave.push({ type: 'mcq', question: q.question, options: q.options, answer: q.correctAnswerIndex, explanation: 'আপনি প্রশ্নটি স্কিপ করেছেন।' });
      } else if (userAnswer === q.correctAnswerIndex) {
        correct++;
      } else {
        wrong++;
        failedItemsToSave.push({ type: 'mcq', question: q.question, options: q.options, answer: q.correctAnswerIndex, explanation: `আপনার দেওয়া উত্তর ছিল: ${q.options[userAnswer]}` });
      }
    });

    // 🚀 Performance Time Calculation
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - quizStartTime) / 1000);
    setTotalTimeTaken(timeTaken);

    const finalResultObj = { correct, wrong, skipped, total: parsedQuizData.length };
    setQuizResults(finalResultObj);
    setIsQuizFinished(true);

 // 🚀 Save History & Failed Items Silently to AsyncStorage
    if (liveQuizActiveQuiz) {
      const quizId = liveQuizActiveQuiz.id || liveQuizActiveQuiz._id;
      setQuizHistoryMap(prev => {
        const existingHistory = prev[quizId]; // চেক করছি আগে কুইজ দিয়েছে কিনা
        const newMap = {
                          ...prev,
                          [quizId]: { 
                            // 🚀 যদি আগে কুইজ দিয়ে থাকে, তবে আগের অরিজিনাল স্কোরটাই লক থাকবে। শুধু রিভিশন প্যাকের জন্য ভুলগুলো আপডেট হবে।
                            score: existingHistory ? existingHistory.score : finalResultObj, 
                            failedItems: failedItemsToSave, 
                            completedAt: Date.now() 
                          }
                        };
                        AsyncStorage.setItem(`@quiz_history_v1_${currentUserEmail}_${lessonItem?.channelId}`, JSON.stringify(newMap)).catch(()=>{});
                        return newMap;
      });

      // 🚀 Background Sync to Server for Future Leaderboard & Cloud Save
      if (currentUserEmail) {
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({
            action: 'submit_quiz_result',
            quizId: quizId,
            channelId: lessonItem?.channelId,
            userEmail: currentUserEmail,
            userName: currentUserName || 'শিক্ষার্থী',
            userAvatar: members.find(m => m.userEmail === currentUserEmail)?.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            score: finalResultObj,
            timeTaken: timeTaken,
            failedItems: failedItemsToSave
          })
        }).catch(e => console.log("Background Quiz Sync Error:", e));
      }
    }
  };

const handleCreateRevisionPack = () => {
    const quizId = liveQuizActiveQuiz?.id || liveQuizActiveQuiz?._id;
    const historyData = quizHistoryMap[quizId];

    if (!historyData || !historyData.failedItems || historyData.failedItems.length === 0) {
      return Alert.alert("অভিনন্দন!", "আপনার কোনো ভুল নেই, রিভিশন করার দরকার নেই!");
    }

    const revisionGuide = {
      id: 'revision_' + Date.now(),
      notebookName: liveQuizActiveQuiz.title + ' (রিভিশন প্যাক)',
      failedItems: historyData.failedItems, // 🚀 Saved history থেকে সরাসরি নিয়ে নিচ্ছে
      channelId: lessonItem?.channelId,
      creatorName: 'Smart AI Revision',
      isQuizResourceMode: true 
    };

    setIsLiveQuizModalVisible(false);
    openBookInReader(revisionGuide); 
  };

 // 🚀 ফিক্স: এটা নেটিভ স্ক্রিন হলে View হিসেবে রেন্ডার হবে, আর প্রোফাইল থেকে ওপেন হলে Modal হিসেবে!
 const Wrapper = isNativeScreen ? View : Modal;
 const wrapperProps = isNativeScreen 
   ? { style: { flex: 1 } } 
   : { animationType: "none", onRequestClose: closePageWithAnimation, transparent: true, visible: visible, statusBarTranslucent: true };

 return (
   <Wrapper {...wrapperProps}>
     <>
       <Animated.View style={{ flex: 1, transform: [{ translateY: pageSlideAnim }] }}>
        <View className="flex-1 bg-[#FDF6E3]">
        
        {/* 🚀 Floating Zen Mode Header */}
        <Animated.View 
          style={{ 
            transform: [{ translateY: headerTranslateY }], 
            opacity: headerOpacity,
            paddingTop: Math.max(insets.top, 15) 
          }} 
          className="absolute top-0 w-full flex-row items-center justify-between px-5 pb-4 bg-[#FFFDF8]/95 border-b border-[#EFE8D6] shadow-sm z-50 backdrop-blur-md"
        >
         <TouchableOpacity className="bg-[#EAE4D4] w-10 h-10 rounded-full items-center justify-center" onPress={closePageWithAnimation}>
            <FontAwesome5 color="#6B655B" name="arrow-left" size={16}/>
          </TouchableOpacity>
          
     {/* 🚀 Facebook/LinkedIn Style Minimalist Member Badge with Skeleton */}
          {(isLoadingMembers && members.length === 0) || refreshing || isInitialLoading ? (
            <HeaderBadgeSkeleton />
          ) : (
       <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleMembersBadgeClick} 
              className="flex-row items-center justify-center bg-white px-2 py-1.5 rounded-full border border-[#EFE8D6] shadow-sm"
            >
              <View className="flex-row -space-x-3">
                {members.slice(0, 3).map((m, i) => (
                  <Image 
                    key={m.userEmail || `avatar_${i}`} 
                    source={{uri: m.userAvatar && m.userAvatar !== 'null' ? m.userAvatar : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}} 
                    className="w-7 h-7 rounded-full border-2 border-white bg-[#EAE4D4]" 
                  />
                ))}
                {totalMemberCount > 3 && (
                  <View className="w-7 h-7 rounded-full bg-[#F3F4F6] border-2 border-white items-center justify-center">
                    <Text className="text-[10px] text-[#4B5563]" style={{ fontFamily: 'BanglaBold' }}>
                      +{totalMemberCount > 99 ? '99' : totalMemberCount - 3}
                    </Text>
                  </View>
                )}
                {totalMemberCount === 0 && (
                  <View className="w-7 h-7 rounded-full bg-[#F3F4F6] border-2 border-white items-center justify-center">
                    <FontAwesome5 name="users" size={10} color="#9CA3AF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          <View className="flex-row space-x-3">
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleShareCode}
              className="bg-[#1899D6]/10 w-10 h-10 rounded-full items-center justify-center border border-[#1899D6]/30"
            >
              <FontAwesome5 color="#1899D6" name="share" size={14}/>
            </TouchableOpacity>
          </View>
        </Animated.View>

      <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 80, paddingTop: Math.max(insets.top, 15) + 60 }} 
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
           <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#D47B00']} 
            tintColor="#D47B00" 
            progressViewOffset={90} 
          />
          }
        >
       {/* 🚀 YouTube Style Header (Intro Section) */}
         {refreshing || isInitialLoading ? <PageIntroSkeleton /> : (
          <View className="bg-[#FFFDF8] border-b border-[#EFE8D6] pb-5 mb-2 shadow-sm">
            {lessonItem?.isFromExplore ? (
               <Image 
                 source={{ uri: lessonItem.banner || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000' }} 
                 className="w-full aspect-video bg-[#EAE4D4]" 
               />
            ) : lessonItem?.thumbnail ? (
               <Image 
                 source={{ uri: lessonItem.thumbnail }} 
                 className="w-full aspect-video bg-[#EAE4D4]" 
               />
            ) : (
               <View className="w-full h-32 bg-[#EAE4D4] items-center justify-center">
                 <FontAwesome5 name={lessonItem?.isFromExplore ? "users" : "book-open"} size={32} color="#D47B00" />
               </View>
            )}
            
          <View className="px-5 mt-4">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-[22px] text-[#3D382F] leading-8 mr-3" style={{ fontFamily: 'BanglaBold' }}>
                 {lessonItem?.notebookName || lessonItem?.creatorName || 'স্মার্ট কমিউনিটি'}
                </Text>
                {/* 🚀 কমিউনিটি টাইটেলের পাশে লাইভ ব্যাজ (যদি কোনো কুইজ লাইভ থাকে) */}
                {communityQuizzes?.some(q => q.targetTimestamp && getEffectiveQuizPhase(q, quizClock, !!quizHistoryMap[q.id || q._id]) === 'live') && (
                  <View className="mt-1"><LiveBadge /></View>
                )}
              </View>
              
      <View className="flex-row items-center mt-4">
                <Image source={{ uri: lessonItem?.creatorAvatar || 'https://i.pravatar.cc/150?img=12' }} className="w-12 h-12 rounded-full border-2 border-[#EFE8D6]" />
                <View className="ml-3 flex-1" style={{ minWidth: 0 }}>
                  <Text className="text-[15px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1} ellipsizeMode="tail">
                   {(lessonItem?.creatorEmail === currentUserEmail || lessonItem?.channelId === currentUserEmail) ? currentUserName : (realAdminName || lessonItem?.creatorName || 'অ্যাডমিন')}
                  </Text>
                  <Text className="text-[12px] text-[#827B6E] mt-0.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                    {lessonItem?.isFromExplore ? `${channelGuides.length || 1} টি বই` : `${lessonItem?.views || 0} জন পড়েছে`}
                  </Text>
                </View>
              </View>

              <View className="flex-row mt-4">
                {/* 🚀 রেটিং ও রিভিউ বাটন */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setIsReviewModalVisible(true)} className="flex-1 mr-2">
                  <View className="rounded-[16px] pb-[4px] bg-[#D47B00]">
                    <View className="w-full justify-center px-4 py-2 rounded-[16px] flex-row items-center bg-[#FF9600]">
                      <FontAwesome5 name="star" size={13} color="#FFFFFF" solid />
                      <Text className="text-white text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                        {averageRating > 0 ? toEnglishNumber(averageRating) : '0.0'} ({toEnglishNumber(reviews.length)})
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 🚀 Join / Community Button */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  disabled={isBanned}
                  onPress={() => {
                    if (isMember) {
                      openDiscussion(null);
                    } else if (joinRequestPending) {
                      Alert.alert("রিকোয়েস্ট বাতিল", "আপনি কি জয়েন রিকোয়েস্ট ক্যানসেল করতে চান?", [
                        { text: "না", style: "cancel" },
                        { text: "হ্যাঁ", style: "destructive", onPress: async () => {
                           setJoinRequestPending(false);
                           try {
                             const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
                             await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                               body: JSON.stringify({ action: 'cancel_join_request', guideId, userEmail: currentUserEmail })
                             });
                           } catch(e) {}
                        }}
                      ]);
                    } else {
                      handleJoinCommunity();
                    }
                  }} 
                  className="flex-1 ml-2"
                >
                  <View className={`rounded-[16px] pb-[4px] ${isBanned ? 'bg-[#AFAFAF]' : isMember ? 'bg-[#1073A4]' : (joinRequestPending ? 'bg-[#D63939]' : 'bg-[#D47B00]')}`}>
                    <View className={`w-full justify-center px-4 py-2 rounded-[16px] flex-row items-center ${isBanned ? 'bg-[#D7D7D7]' : isMember ? 'bg-[#1CB0F6]' : (joinRequestPending ? 'bg-[#FF4B4B]' : 'bg-[#FF9600]')}`}>
                      <FontAwesome5 name={isBanned ? "ban" : isMember ? "users" : (joinRequestPending ? "times" : "user-plus")} size={13} color={isBanned ? "#777777" : "#FFFFFF"} />
                      <Text className={`text-[14px] ml-2 pt-0.5 ${isBanned ? 'text-[#777777]' : 'text-white'}`} style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                        {isBanned ? 'ব্যানড' : isMember ? 'কমিউনিটি' : (joinRequestPending ? 'ক্যানসেল' : 'জয়েন করুন')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {isBanned && (
                <View className="mt-4 w-full bg-[#FF4B4B]/10 p-4 rounded-2xl border border-[#FF4B4B]/30 flex-row items-start">
                  <FontAwesome5 name="ban" size={16} color="#FF4B4B" style={{ marginTop: 4 }} />
                  <View className="ml-3 flex-1">
                    <Text className="text-[#D63939] text-[15px]" style={{ fontFamily: 'BanglaBold', lineHeight: 22 }}>আপনাকে এই কমিউনিটি থেকে ব্যান করা হয়েছে</Text>
                    <Text className="text-[#D63939]/70 text-[12px] mt-1" style={{ fontFamily: 'BanglaRegular' }}>আপনি আর জয়েন রিকোয়েস্ট পাঠাতে বা রিভিউ দিতে পারবেন না।</Text>
                  </View>
                </View>
              )}

              {/* Bio or Description (With See More) */}
              {(lessonItem?.bio || lessonItem?.description) ? (
                <View className="mt-5 bg-[#FDF6E3] p-4 rounded-[16px] border border-[#EFE8D6]">
                  <Text 
                    className="text-[14px] text-[#4B4B4B] leading-6" 
                    style={{ fontFamily: 'BanglaRegular' }}
                    numberOfLines={isDescriptionExpanded ? undefined : 3}
                  >
                    {lessonItem?.isFromExplore ? lessonItem.bio : lessonItem.description}
                  </Text>
                  
                  {((lessonItem?.isFromExplore ? lessonItem.bio : lessonItem.description)?.length > 80) && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="mt-2 self-start">
                      <Text className="text-[#D47B00] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>
                        {isDescriptionExpanded ? 'See less' : 'See more'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          </View>
          )}

 {currentUserEmail === 'rumontrader662@gmail.com' && lessonItem?.channelId !== 'rumontrader662@gmail.com' && (
              <View className="px-5 mt-4">
                <View className="bg-white p-4 rounded-[20px] border-2 border-[#1899D6]/30 shadow-sm">
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 bg-[#1899D6]/10 rounded-full items-center justify-center mr-2">
                      <FontAwesome5 name="shield-alt" size={12} color="#1899D6" />
                    </View>
                    <View>
                      <Text className="text-[16px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>মাস্টার কন্ট্রোল</Text>
                      <Text className="text-[12px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }}>শুধু আপনি এটা দেখতে পাচ্ছেন</Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    <TouchableOpacity onPress={() => { setCaSearchQuery(''); setSelectedCa(null); setCaCandidates([]); setIsCaSelectModalVisible(true); searchCandidates(''); }} className="flex-1 mr-2">
                      <View className="rounded-[16px] pb-[4px] bg-[#1073A4]">
                        <View className="w-full justify-center px-2 py-2.5 rounded-[16px] flex-row items-center bg-[#1CB0F6]">
                          <FontAwesome5 name="exchange-alt" size={12} color="#FFF" />
                          <Text className="text-white text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>সিএ পরিবর্তন</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      Alert.alert("সতর্কতা", "এই কমিউনিটির সব মেম্বার, মেসেজ, রিভিউ ও ডাটা চিরতরে মুছে যাবে। এটা ফেরানো যাবে না।", [
                        { text: "বাতিল", style: "cancel" },
                        { text: "মুছে ফেলুন", style: "destructive", onPress: async () => {
                          const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
                          try {
                            const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                              body: JSON.stringify({ action: 'delete_whole_community', channelId: guideId })
                            });
                            const data = await res.json();
                            if(data.success) {
                              closePageWithAnimation();
                              DeviceEventEmitter.emit('FORCE_REFRESH_HOME_DATA');
                            } else {
                              Alert.alert("দুঃখিত", data.error || "ডিলিট করা যায়নি।");
                            }
                          } catch(e) {
                            Alert.alert("দুঃখিত", "ইন্টারনেট কানেকশন চেক করুন।");
                          }
                        }}
                      ]);
                    }} className="flex-1 ml-2">
                      <View className="rounded-[16px] pb-[4px] bg-[#D63939]">
                        <View className="w-full justify-center px-2 py-2.5 rounded-[16px] flex-row items-center bg-[#FF4B4B]">
                          <FontAwesome5 name="trash-alt" size={12} color="#FFF" />
                          <Text className="text-white text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>কমিউনিটি ডিলিট</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

                 {/* 🚀 Books List (Study Packs) */}
          <View className="px-5 pt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>📚 স্টাডি প্যাক সমুহ ({channelGuides.length})</Text>
      {/* 🚀 শুধুমাত্র মেইন অ্যাডমিন হলে নতুন সাবজেক্ট বানানোর বাটন দেখাবে */}
              {currentUserEmail === 'rumontrader662@gmail.com' && channelGuides.length > 0 && (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setIsSubjectCreateVisible(true)}
                  className="bg-[#1899D6]/10 px-3 py-1.5 rounded-full border border-[#1899D6]/30 flex-row items-center"
                >
                  <FontAwesome5 name="plus" size={12} color="#1899D6" />
                  <Text className="text-[#1899D6] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>নতুন সাবজেক্ট</Text>
                </TouchableOpacity>
              )}
            </View>
            
      {isLoadingGuides || refreshing || isInitialLoading ? (
              <View className="flex-row flex-wrap justify-between mt-2">
                <GuideSkeleton />
                <GuideSkeleton />
                <GuideSkeleton />
                <GuideSkeleton />
              </View>
           ) : (
              <View className="flex-row flex-wrap justify-between mt-2">
               {[...channelGuides].sort((a, b) => (b.views || 0) - (a.views || 0)).map((guide, idx) => (
                  <View key={idx} className="bg-white rounded-[20px] mb-4 border border-[#EFE8D6] shadow-sm overflow-hidden" style={{ width: '48%' }}>
            {/* 🚀 Pinterest Style Card (Two-Column) */}
               <TouchableOpacity activeOpacity={0.9} onPress={() => {
                    if (isBanned) {
                      setCustomAlert({
                        visible: true,
                        title: "ব্যানড!",
                        message: "আপনাকে এই কমিউনিটি থেকে ব্যান করা হয়েছে।",
                        type: "error"
                      });
                      return;
                    }
                    if (!isMember && lessonItem?.creatorEmail !== currentUserEmail) {
                      setCustomAlert({
                        visible: true,
                        title: "অ্যাক্সেস নেই!",
                        message: "এই স্টাডি প্যাকটি দেখতে হলে আপনাকে অবশ্যই এই কমিউনিটির মেম্বার হতে হবে।",
                        type: "error"
                      });
                      return;
                    }
                    setSelectedSubject(guide); 
                    setIsSubjectViewVisible(true); 
                  }}>
                    {/* কভার ইমেজ (Square aspect ratio 1:1) */}
                    <View className="w-full aspect-square bg-[#F0F2F5] relative border-b border-[#EFE8D6]">
                      {guide.thumbnail ? (
                        <Image source={{ uri: guide.thumbnail }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-[#1899D6]/10">
                          <FontAwesome5 name="book-open" size={32} color="#1899D6" />
                        </View>
                      )}
                    </View>
                    
                    {/* কার্ডের টেক্সট অংশ (ছবির নিচে ক্লিন ব্যাকগ্রাউন্ডে) */}
                    <View className="p-3">
                       <Text className="text-[#3D382F] text-[14px] leading-[20px] mb-1.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>{guide.notebookName}</Text>
                       <Text className="text-[#827B6E] text-[11px]" style={{ fontFamily: 'BanglaRegular' }}>{guide.failedItems?.length || 0} টি প্যাক • {guide.views || 0} ভিউ</Text>
                    </View>
                  </TouchableOpacity>

             {/* 🚀 শুধুমাত্র মেইন অ্যাডমিনের জন্য এডিট ও ডিলিট অপশন (ছোট আইকন) */}
                  {currentUserEmail === 'rumontrader662@gmail.com' && (
                    <View className="flex-row justify-between px-3 pb-3">
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleEditGuideClick(guide)} className="w-8 h-8 rounded-full bg-[#FDF6E3] border border-[#EFE8D6] items-center justify-center">
                        <FontAwesome5 name="pen" size={10} color="#D47B00" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleDeleteChannelGuide(guide)} className="w-8 h-8 rounded-full bg-[#FFF4E5] border border-[#FFDDAA] items-center justify-center">
                        <FontAwesome5 name="trash" size={10} color="#FF4B4B" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              </View>
            )}
            
           {channelGuides.length === 0 && !isLoadingGuides && (
              <View className="py-2">
             {/* 🚀 চেক করা হচ্ছে ইউজার নিজে মেইন অ্যাডমিন কিনা */}
                {currentUserEmail === 'rumontrader662@gmail.com' ? (
                  <>
                    {/* 🚀 ভিডিও টিউটোরিয়াল কার্ড */}
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                     onPress={() => setIsVideoModalVisible(true)}
                      className="bg-[#FFF4E5] p-4 rounded-[20px] border border-[#FFDDAA] flex-row items-center mb-5 shadow-sm"
                    >
                      <View className="w-12 h-12 bg-[#FF9600] rounded-full items-center justify-center mr-4">
                        <FontAwesome5 name="play" size={16} color="#FFF" style={{ marginLeft: 3 }} />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="text-[17px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>যেভাবে নিজের কমিউনিটি সাজাবে!</Text>
                      </View>
                    </TouchableOpacity>

                 {/* 🚀 প্রথম সাবজেক্ট পাবলিশ করার কার্ড */}
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => setIsSubjectCreateVisible(true)}
                      className="bg-white p-6 rounded-[20px] border-2 border-[#1899D6]/30 border-dashed items-center justify-center shadow-sm"
                    >
                      <View className="w-16 h-16 bg-[#1899D6]/10 rounded-full items-center justify-center mb-4">
                        <FontAwesome5 name="plus" size={24} color="#1899D6" />
                      </View>
                      <Text className="text-[18px] text-[#3D382F] mb-2" style={{ fontFamily: 'BanglaBold' }}>প্রথম সাবজেক্ট তৈরি করুন</Text>
                      <Text className="text-[13px] text-[#777777] text-center px-4 leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                        আপনার স্কোয়াড মেম্বারদের জন্য নতুন সাবজেক্ট তৈরি করে তার ভেতরে কোশ্চেন ব্যাংক অ্যাড করুন।
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // 🚀 সাধারণ স্টুডেন্টদের জন্য এম্পটি স্টেট
                  <View className="items-center justify-center py-10">
                    <FontAwesome5 name="box-open" size={40} color="#EAE4D4" />
                    <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>এখনো কোনো গাইড পাবলিশ করা হয়নি!</Text>
                  </View>
                )}
           </View>
            )}
          </View>

        {/* ==========================================
              🏆 কুইজ সেকশন (Pinterest & Duolingo Minimalist Style)
              ========================================== */}
          <View className="px-5 pt-8 pb-16">
            
            <View className="flex-row items-center justify-between mb-5 mt-2">
              <Text className="text-[19px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>🏆 কুইজ প্রতিযোগিতা</Text>
              
       {/* শুধুমাত্র মেইন অ্যাডমিনের জন্য কুইজ অ্যাড করার বাটন */}
              {currentUserEmail === 'rumontrader662@gmail.com' && (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    // 🚀 নতুন কুইজের জন্য ফিল্ড ক্লিয়ার রাখা
                setEditingQuizId(null);
                    setQuizTitle('');
                    setQuizBanner('');
                    setQuizDate('');
                    setQuizTime('');
                    setQuizLiveDuration('60'); // 🚀 ডিফল্ট ৬০ মিনিট
                    setquizSelectedRules([]);
                    setQuizTimestamp(null);
                    setTempDate(new Date());
                    setQuizJsonInput('');
                    setTempGeneratedQuestions([]);
                    setIsQuizCreateModalVisible(true);
                  }}
                  className="bg-[#D47B00]/10 px-3.5 py-1.5 rounded-full flex-row items-center"
                >
                  <FontAwesome5 name="plus" size={12} color="#D47B00" />
                  <Text className="text-[#D47B00] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>নতুন</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quiz Tabs (Borderless, minimal pill indicator style) */}
            <View className="flex-row mb-6">
              <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveQuizTab('upcoming')} className="mr-5 relative pb-1">
                <Text className={`text-[16px] pt-1 ${activeQuizTab === 'upcoming' ? 'text-[#3D382F]' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>আপকামিং</Text>
                {activeQuizTab === 'upcoming' && <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3D382F] rounded-t-full" />}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveQuizTab('past')} className="relative pb-1">
                <Text className={`text-[16px] pt-1 ${activeQuizTab === 'past' ? 'text-[#3D382F]' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>অতীতের কুইজ</Text>
                {activeQuizTab === 'past' && <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3D382F] rounded-t-full" />}
              </TouchableOpacity>
            </View>

     {/* 🚀 Dynamic Quizzes (Upcoming / Past Auto Shifted) */}
            {displayQuizzes.length > 0 ? (
              displayQuizzes.map((quiz, idx) => (
                <View key={idx} className="mb-8">
            {/* Edge-to-edge rounded image (Pinterest style) */}
                 <View className="w-full aspect-[16/9] bg-[#EAE4D4] rounded-[24px] overflow-hidden mb-4 shadow-sm relative">
                    <Image source={{ uri: quiz.banner || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000' }} className="w-full h-full" resizeMode="cover" />
                    {/* রিসোর্সের পরিমাণ দেখানোর জন্য ছোট্ট একটি ব্যাজ */}
                    <View className="absolute top-3 left-3 bg-black/60 px-3 py-1.5 rounded-full z-10 backdrop-blur-md">
                       <Text className="text-white text-[11px]" style={{ fontFamily: 'BanglaBold' }}>
                         {quiz.resources?.length || 0} টি প্যাক
                       </Text>
                    </View>
                    {/* 🚀 লাইভ কুইজ ব্যাজ (শর্ত: targetTimestamp আছে এবং ইউজারের জন্য এখনো লাইভ) */}
                    {quiz.targetTimestamp && getEffectiveQuizPhase(quiz, quizClock, !!quizHistoryMap[quiz.id || quiz._id]) === 'live' && (
                      <View className="absolute top-3 right-3 z-10">
                        <LiveBadge />
                      </View>
                    )}
                  </View>

                  {/* Details Area */}
                  <View className="px-1">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-[#3D382F] text-[20px] leading-7 flex-1 pr-2" style={{ fontFamily: 'BanglaBold' }}>{quiz.title}</Text>
                      
          {/* 🚀 শুধুমাত্র মেইন অ্যাডমিনের জন্য এডিট ও ডিলিট বাটন (টাইটেলের পাশে ক্লিন UI) */}
                      {currentUserEmail === 'rumontrader662@gmail.com' && (
                        <View className="flex-row space-x-2 mt-1">
                          <TouchableOpacity activeOpacity={0.7} onPress={() => {
                            const currentQuizId = quiz._id || quiz.id;
                        setEditingQuizId(currentQuizId);
                            setQuizTitle(quiz.title || '');
                            setQuizBanner(quiz.banner || '');
                        setQuizDate(quiz.dateText !== 'শীঘ্রই' ? quiz.dateText : '');
                            setQuizTime(quiz.timeText !== '--:--' ? quiz.timeText : '');
                            setQuizLiveDuration(quiz.liveDuration ? String(quiz.liveDuration) : '60'); // 🚀 পুরনো টাইম লোড
                            setquizSelectedRules(quiz.resources || []);
                            setQuizTimestamp(quiz.targetTimestamp || null);
                            if (quiz.targetTimestamp) setTempDate(new Date(quiz.targetTimestamp));
                            
                            // 🚀 আগের প্রশ্নগুলো মডেলে লোড করা হচ্ছে যাতে হারিয়ে না যায়
                            const existingQ = quiz.questions || [];
                            setTempGeneratedQuestions(existingQ);
                            setQuizJsonInput(existingQ.length > 0 ? JSON.stringify(existingQ, null, 2) : '');
                            
                            setIsQuizCreateModalVisible(true);
                          }} className="w-8 h-8 rounded-full bg-[#FDF6E3] border border-[#EFE8D6] items-center justify-center shadow-sm">
                            <FontAwesome5 name="pen" size={11} color="#D47B00" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity activeOpacity={0.7} onPress={() => {
                            Alert.alert("কুইজ ডিলিট", "আপনি কি সত্যিই এই কুইজটি ডিলিট করতে চান?", [
                              { text: "না", style: "cancel" },
                              { text: "হ্যাঁ, মুছুন", style: "destructive", onPress: async () => {
                                  const currentQuizId = quiz._id || quiz.id;
                                  setCommunityQuizzes(prev => prev.filter(q => (q._id || q.id) !== currentQuizId)); 
                                  try {
                                    await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                                      body: JSON.stringify({ action: 'delete_quiz', channelId: lessonItem?.channelId || currentUserEmail, quizId: currentQuizId })
                                    });
                                  } catch(e) {}
                              }}
                            ]);
                          }} className="w-8 h-8 rounded-full bg-[#FFF4E5] border border-[#FFDDAA] items-center justify-center shadow-sm">
                            <FontAwesome5 name="trash" size={11} color="#FF4B4B" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    <View className="flex-row items-center mb-5">
                      <FontAwesome5 name="calendar-alt" size={12} color="#827B6E" />
                      <Text className="text-[#827B6E] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaRegular' }}>{quiz.dateText || 'শীঘ্রই আসছে'}</Text>
                      <Text className="text-[#D7D7D7] mx-2.5">•</Text>
                      <FontAwesome5 name="clock" size={12} color="#827B6E" />
                      <Text className="text-[#827B6E] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaRegular' }}>{quiz.timeText || '--:--'}</Text>
                    </View>
                    
   {/* Action Buttons */}
                <View className="flex-row items-center justify-between w-full space-x-3">
                  {(() => {
                    const history = quizHistoryMap[quiz.id || quiz._id];
                    const hasTaken = !!history; 
                    const hasMistakes = history?.failedItems && history.failedItems.length > 0;
                    const phase = getEffectiveQuizPhase(quiz, quizClock, hasTaken);
                    const questionCount = quiz.questionCount !== undefined ? quiz.questionCount : (quiz.questions ? quiz.questions.length : 0);

                    // বাঁ পাশের বাটন: রিসোর্স বা রিভিশন
                    const ResourceButton = (
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => {
                          if (hasTaken) {
                            if (hasMistakes) {
                              openBookInReader({
                                id: 'revision_' + Date.now(),
                                notebookName: quiz.title + ' (রিভিশন)',
                                failedItems: history.failedItems,
                                channelId: lessonItem?.channelId,
                                creatorName: 'Smart AI Revision',
                                isQuizResourceMode: true 
                              });
                            } else {
                              Alert.alert("অভিনন্দন!", "আপনার কোনো ভুল নেই, রিভিশন করার দরকার নেই!");
                            }
                          } else {
                            handleOpenQuizResources(quiz);
                          }
                        }}
                        className={`w-[52px] ${
                          hasTaken ? (hasMistakes ? 'bg-[#1073A4]' : 'bg-[#D7D7D7]') : 'bg-[#4A8C00]'
                        } rounded-[16px] pb-[4px]`}
                      >
                      <View className={`w-full h-[46px] rounded-[16px] items-center justify-center border-2 border-b-0 ${
                            hasTaken ? (hasMistakes ? 'bg-[#1CB0F6] border-[#1899D6]' : 'bg-[#F9F9F9] border-[#E5E5E5]') : 'bg-[#58CC02] border-[#58A700]'
                          }`}>
                            <FontAwesome5 name={hasTaken ? (hasMistakes ? "sync-alt" : "check-double") : "book-reader"} size={16} color={hasTaken && !hasMistakes ? "#AFAFAF" : "#FFF"} />
                          </View>
                        </TouchableOpacity>
                      );

                      const PastResourceButton = (
                        <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => handleOpenQuizResources(quiz)}
                          className="w-[52px] bg-[#4A8C00] rounded-[16px] pb-[4px]"
                        >
                          <View className="w-full h-[46px] rounded-[16px] items-center justify-center border-2 border-b-0 bg-[#58CC02] border-[#58A700]">
                            <FontAwesome5 name="book-reader" size={16} color="#FFF" />
                          </View>
                        </TouchableOpacity>
                      );

                      // Phase A: Not Started
                    if (phase === 'upcoming') {
                      return (
                        <>
                          {ResourceButton}
                          <View className="flex-1 h-[50px] bg-[#F5F5F5] rounded-[16px] flex-row items-center justify-center border-2 border-[#E5E5E5] px-2">
                            <FontAwesome5 name="clock" size={12} color="#AFAFAF" />
                            {quiz.targetTimestamp ? (
                              <LiveCountdown targetTimestamp={quiz.targetTimestamp} />
                            ) : (
                              <Text className="text-[#AFAFAF] text-[12px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>টাইম সেট হয়নি</Text>
                            )}
                          </View>
                        </>
                      );
                    }

               // Phase B: Live Window
                    if (phase === 'live') {
                      return (
                        <>
                          {ResourceButton}
                          {questionCount === 0 ? (
                            <View className="flex-1 bg-[#F5F5F5] rounded-[16px] pb-[4px]">
                              <View className="w-full h-[46px] bg-[#EAE4D4] rounded-[16px] items-center justify-center border-2 border-b-0 border-[#D7D7D7] flex-row">
                                <FontAwesome5 name="lock" size={14} color="#AFAFAF" />
                                <Text className="text-[#AFAFAF] text-[16px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রশ্ন সেট হয়নি</Text>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setLiveQuizActiveQuiz(quiz);
                                setParsedQuizData(quiz.questions);
                                setCurrentQuizIndex(0);
                                setQuizAnswers({});
                                setIsQuizFinished(false);
                                setQuizStartTime(Date.now());
                                setQuizTimeLeft(quiz.questions.length * 60); 
                                setIsLiveQuizModalVisible(true);
                              }}
                              className="flex-1 bg-[#1073A4] rounded-[16px] pb-[4px]"
                            >
                              <View className="w-full h-[46px] bg-[#1CB0F6] rounded-[16px] items-center justify-center border-2 border-b-0 border-[#1899D6] flex-row">
                                <FontAwesome5 name="play" size={14} color="#FFF" />
                                <Text className="text-white text-[16px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>এন্ট্রি নিন</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </>
                      );
                    }

                  // Phase C: Past Quiz
                      return (
                        <>
                          {PastResourceButton}
                          <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={() => openLeaderboard(quiz)}
                          className="flex-1 bg-[#D47B00] rounded-[16px] pb-[4px]"
                        >
                          <View className="w-full h-[46px] bg-[#FFC800] rounded-[16px] flex-row items-center justify-center border-2 border-b-0 border-[#FF9600]">
                            <FontAwesome5 name="crown" size={16} color="#FFFFFF" solid />
                            <Text className="text-white text-[16px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>লিডারবোর্ড</Text>
                          </View>
                        </TouchableOpacity>

                     <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => {
                            if (questionCount === 0) {
                              return Alert.alert("দুঃখিত", "এই কুইজে কোনো প্রশ্ন নেই।");
                            }
                            
                            if (hasTaken) {
                              setPickedQuizForAction(quiz);
                            } else {
                              setLiveQuizActiveQuiz(quiz);
                              setParsedQuizData(quiz.questions);
                              setCurrentQuizIndex(0);
                              setQuizAnswers({});
                              setIsQuizFinished(false);
                              setQuizStartTime(Date.now());
                              setQuizTimeLeft(quiz.questions.length * 60); 
                              setIsLiveQuizModalVisible(true);
                            }
                          }}
                          className={`w-[52px] ${hasTaken ? 'bg-[#D7D7D7]' : 'bg-[#1073A4]'} rounded-[16px] pb-[4px]`}
                        >
                          <View className={`w-full h-[46px] ${hasTaken ? 'bg-[#F9F9F9] border-[#E5E5E5]' : 'bg-[#1CB0F6] border-[#1899D6]'} rounded-[16px] items-center justify-center border-2 border-b-0`}>
                            <FontAwesome5 name={hasTaken ? "redo-alt" : "play"} size={16} color={hasTaken ? "#AFAFAF" : "#FFF"} style={!hasTaken ? { marginLeft: 3 } : {}} />
                          </View>
                        </TouchableOpacity>
                   </>
                    );
                  })()}
                </View>
                  </View>
                </View>
          ))
            ) : (
              <View className="items-center justify-center py-12 mt-2">
                {activeQuizTab === 'upcoming' && takenLiveCount > 0 ? (
                  <>
                    <FontAwesome5 name="check-circle" size={36} color="#58A700" solid />
                    <Text className="text-[#3D382F] text-[18px] mt-4 pt-1" style={{ fontFamily: 'BanglaBold' }}>তুমি ইতিমধ্যে কুইজ দিয়েছো! 🎉</Text>
                    <Text className="text-[#827B6E] text-[13px] mt-2 px-6 text-center leading-5" style={{ fontFamily: 'BanglaRegular' }}>এখানে আর কোনো কুইজ পাওয়া যায়নি। তোমার কুইজের রেজাল্ট ও লিডারবোর্ড দেখো অতীতের কুইজে।</Text>
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setActiveQuizTab('past');
                      }} 
                      className="mt-6 w-[200px] bg-[#1073A4] rounded-[16px] pb-[4px]"
                    >
                      <View className="w-full py-3 bg-[#1CB0F6] rounded-[16px] items-center justify-center border-2 border-b-0 border-[#1899D6]">
                        <Text className="text-white text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>অতীতের কুইজ দেখো</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <FontAwesome5 name={activeQuizTab === 'upcoming' ? "clock" : "trophy"} size={36} color="#EAE4D4" />
                    <Text className="text-[#827B6E] text-[15px] mt-4 pt-1" style={{ fontFamily: 'BanglaBold' }}>
                      {activeQuizTab === 'upcoming' ? 'আপকামিং কোনো কুইজ নেই' : 'কোনো অতীতের কুইজ নেই'}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
          
        </ScrollView>
      </View>

{/* {/* 🚀 YouTube Video Popup Modal - Premium Design */}
      <Modal visible={isVideoModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsVideoModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/70 px-5">
          
          <View className="w-full bg-[#FFFDF8] rounded-[24px] overflow-hidden border-2 border-[#EFE8D6] shadow-lg pb-1">
            
            {/* 🚀 Header Area */}
            <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-[#EFE8D6]">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-[#FF9600]/10 rounded-full items-center justify-center mr-2">
                  <FontAwesome5 name="youtube" size={14} color="#FF9600" />
                </View>
                <Text className="text-[16px] text-[#3D382F] pt-1" style={{ fontFamily: 'BanglaBold' }}>যেভাবে নিজের কমিউনিটি সাজাবে</Text>
              </View>
              
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={() => setIsVideoModalVisible(false)} 
                className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center"
              >
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            {/* 🚀 Video Player Area */}
            <View className="w-full bg-black">
              <YoutubeIframe
                height={210}
                play={isVideoModalVisible}
                videoId={"dQw4w9WgXcQ"} // 💡 Ekhane tomar ashol video ID boshabe
                initialPlayerParams={{
                  preventFullScreen: false,
                  modestbranding: 1,
                  rel: 0
                }}
              />
            </View>

           

          </View>
        </View>
      </Modal>
      
   {/* 🚀 Custom Alert Popup (In-App Styling) */}
      <Modal visible={customAlert.visible} transparent={true} animationType="fade" onRequestClose={() => setCustomAlert(prev => ({...prev, visible: false}))}>
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-[#FFFDF8] w-full max-w-[340px] rounded-[32px] p-6 items-center border-b-4 border-[#EFE8D6] shadow-lg">
            
            {customAlert.type === 'success' ? (
              <View className="w-20 h-20 bg-[#D7FFB8] rounded-full items-center justify-center mb-5 border-4 border-[#8BA85E]">
                <FontAwesome5 name="check" size={36} color="#58A700" solid />
              </View>
            ) : (
              <View className="w-20 h-20 bg-[#FFF4E5] rounded-full items-center justify-center mb-5 border-4 border-[#FFC800]">
                <FontAwesome5 name="exclamation" size={36} color="#D47B00" solid />
              </View>
            )}
            
            <Text className="text-[22px] text-[#3D382F] text-center mb-3" style={{ fontFamily: 'BanglaBold' }}>{customAlert.title}</Text>
            <Text className="text-[14px] text-[#6B655B] text-center px-2 leading-6 mb-8" style={{ fontFamily: 'BanglaRegular' }}>{customAlert.message}</Text>
            
            <View className="flex-row w-full space-x-3">
              {customAlert.showCancel && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setCustomAlert(prev => ({...prev, visible: false}))} className="flex-1">
                  <View className="bg-[#EAE4D4] rounded-[20px] pb-[6px]">
                    <View className="bg-[#F5F5F5] rounded-[20px] py-3.5 flex-row justify-center items-center">
                      <Text className="text-[#6B655B] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={0.8} onPress={() => {
                if (customAlert.onConfirm) customAlert.onConfirm();
                else setCustomAlert(prev => ({...prev, visible: false}));
              }} className={customAlert.showCancel ? "flex-1" : "w-full"}>
                <View className={`${customAlert.type === 'success' ? 'bg-[#58A700]' : 'bg-[#D47B00]'} rounded-[20px] pb-[6px]`}>
                  <View className={`${customAlert.type === 'success' ? 'bg-[#58CC02]' : 'bg-[#FF9600]'} rounded-[20px] py-3.5 flex-row justify-center items-center`}>
                    <Text className="text-white text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>{customAlert.showCancel ? 'হ্যাঁ' : 'ঠিক আছে'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* 🚀 Custom Share Modal UI */}
      <Modal visible={shareModalVisible} transparent={true} animationType="fade" onRequestClose={() => setShareModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-[#FFFDF8] w-full max-w-[340px] rounded-[32px] p-6 items-center border-b-4 border-[#EFE8D6]">
            
            {shareModalType === 'success' ? (
              <>
                <View className="w-20 h-20 bg-[#D7FFB8] rounded-full items-center justify-center mb-5 border-4 border-[#8BA85E]">
                  <FontAwesome5 name="check" size={36} color="#58A700" solid />
                </View>
                <Text className="text-[22px] text-[#3D382F] text-center mb-2" style={{ fontFamily: 'BanglaBold' }}>কপি হয়েছে! 🎉</Text>
                
     <View className="bg-[#FDF6E3] px-6 py-3 rounded-xl mb-4 border-2 border-[#EFE8D6] border-dashed">
                  <Text className="text-[22px] text-[#D47B00] tracking-[4px]" style={{ fontFamily: 'BanglaBold' }}>
                    {lessonItem?.communityCode || lessonItem?.channelId || ''}
                  </Text>
                </View>

               <Text className="text-[14px] text-[#6B655B] text-center px-2 leading-6 mb-8" style={{ fontFamily: 'BanglaRegular' }}>
                  কোডটি কপি করা হয়েছে। এখন বন্ধুদের মেসেঞ্জার বা হোয়াটসঅ্যাপে পাঠিয়ে দাও! তারা এই কোড দিয়ে তোমার কমিউনিটিতে জয়েন করতে পারবে।
                </Text>
              </>
            ) : (
              <>
                <View className="w-20 h-20 bg-[#FFF4E5] rounded-full items-center justify-center mb-5 border-4 border-[#FFC800]">
                  <FontAwesome5 name="exclamation" size={36} color="#D47B00" solid />
                </View>
                <Text className="text-[22px] text-[#3D382F] text-center mb-3" style={{ fontFamily: 'BanglaBold' }}>কোড নেই!</Text>
<Text className="text-[14px] text-[#6B655B] text-center px-2 leading-6 mb-8" style={{ fontFamily: 'BanglaRegular' }}>
                  এই কমিউনিটিটি এখনো পাবলিশ করা হয়নি বা এর কোনো সিক্রেট শেয়ার কোড জেনারেট হয়নি।
                </Text>
              </>
            )}

            <TouchableOpacity activeOpacity={0.8} onPress={() => setShareModalVisible(false)} className="w-full">
              <View className="bg-[#58A700] rounded-[20px] pb-[6px]">
                <View className="bg-[#58CC02] rounded-[20px] py-3.5 flex-row justify-center items-center">
                  <Text className="text-white text-[17px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ঠিক আছে</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

{/* 🚀 Members List Modal (Discussion.js Exact Bouncy Copy) */}
      <Modal visible={membersModalVisible} transparent animationType="none" onRequestClose={closeMembersModalSmoothly}>
        <View className="flex-1 justify-end">
          
          {/* পেছনের ডার্ক ফেড অ্যানিমেশন */}
          <Animated.View style={{ opacity: membersFadeAnim }} className="absolute inset-0 bg-black/60" />
          
         {/* 🚀 এই Animated.View টাই রিভিউ মডালের মতো সেম সাইজ এবং স্টাইলে ওপেন হবে! */}
          <Animated.View 
            style={{ transform: [{ translateY: membersSlideAnim }] }}
            className="bg-[#FFFDF8] rounded-t-[32px] h-[85%] overflow-hidden relative"
          >
            {/* Dragger */}
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mt-5 mb-4" />
            
       {/* Header */}
            <View className="flex-row justify-between items-center px-6 pb-3 border-b border-[#EFE8D6]">
              <View className="flex-1 pr-2">
                <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>স্টাডি স্কোয়াড 🎯</Text>
                <Text className="text-[13px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={1}>মোট {toEnglishNumber(totalMemberCount)} জন মেম্বার যুক্ত আছেন</Text>
              </View>
              <View className="flex-row space-x-2 flex-shrink-0">
                {isStaff && (
                  <TouchableOpacity onPress={() => { 
                    closeMembersModalSmoothly();
                    setTimeout(() => {
                      fetchBannedList();
                      setIsBannedModalVisible(true);
                    }, 300);
                  }} className="bg-[#FFF4E5] w-9 h-9 rounded-full items-center justify-center border border-[#FFDDAA]">
                    <FontAwesome5 name="ban" size={14} color="#D47B00" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={closeMembersModalSmoothly} className="bg-[#FFF4E5] w-9 h-9 rounded-full items-center justify-center border border-[#FFDDAA]">
                  <FontAwesome5 name="times" size={14} color="#D47B00" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 🔍 Search Bar (Vibe Coder Fix) */}
              <View className="pb-3 border-b border-[#EFE8D6] mb-2 px-6 mt-3">
                <View className="flex-row items-center bg-white rounded-[16px] border border-[#EFE8D6] px-4 py-1.5 shadow-sm">
                  <FontAwesome5 name="search" size={14} color="#AFAFAF" />
                  <TextInput 
                    className="flex-1 ml-3 text-[15px] text-[#3D382F] pt-1" 
                    style={{ fontFamily: 'BanglaRegular' }} 
                    placeholder="মেম্বারদের খুঁজুন..." 
                    placeholderTextColor="#AFAFAF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
              
              <FlatList
                data={members.filter(m => m.userName?.toLowerCase().includes(searchQuery.toLowerCase()))}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: 10 }}
              onEndReached={loadMoreMembers}
              onEndReachedThreshold={0.5}
           ListHeaderComponent={
                <View>
           {/* 🚀 অ্যাডমিন বা CA-এর জন্য পেন্ডিং রিকোয়েস্ট লিস্ট UI */}
                  {(isStaff) && pendingJoinRequests.length > 0 && (
                    <View className="mb-4 pt-2 px-1">
                      <Text className="text-[16px] text-[#3D382F] mb-3" style={{ fontFamily: 'BanglaBold' }}>পেন্ডিং রিকোয়েস্ট ({pendingJoinRequests.length})</Text>
                      {pendingJoinRequests.map((req, idx) => (
                        <View key={idx} className="flex-row items-center justify-between mb-3 bg-[#FFF4E5] p-3.5 rounded-[20px] border border-[#FFDDAA] shadow-sm">
                          <View className="flex-row items-center flex-1">
                            <Image source={{ uri: req.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-12 h-12 rounded-full border-2 border-white bg-[#EAE4D4]" />
                            <View className="ml-3 flex-1 pr-2">
                              <Text className="text-[#3D382F] text-[15px]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>{req.userName}</Text>
                              <Text className="text-[#D47B00] text-[11px] mt-0.5" style={{ fontFamily: 'BanglaRegular' }}>কমিউনিটিতে জয়েন করতে চায়</Text>
                            </View>
                          </View>
                          <View className="flex-row space-x-2">
                            <TouchableOpacity onPress={() => handleJoinAction(req.userEmail, 'accept_join_request')} className="bg-[#1899D6] w-10 h-10 rounded-full items-center justify-center shadow-sm">
                              <FontAwesome5 name="check" size={14} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleJoinAction(req.userEmail, 'reject_join_request')} className="bg-[#FDF6E3] w-10 h-10 rounded-full items-center justify-center border border-[#EFE8D6]">
                              <FontAwesome5 name="times" size={14} color="#FF4B4B" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      <View className="h-[1px] bg-[#EFE8D6] my-2" />
                    </View>
                  )}
                </View>
             }
           ListEmptyComponent={
                isLoadingMembers ? (
                  <View className="pt-2">
                    <MemberSkeleton />
                    <MemberSkeleton />
                    <MemberSkeleton />
                  </View>
                ) : (
                  <View className="items-center py-10 mt-5">
                    <FontAwesome5 name="users" size={40} color="#EAE4D4" />
                    <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>এখনো কোনো মেম্বার যুক্ত হয়নি!</Text>
                  </View>
                )
              }
             ListFooterComponent={
                // 🚀 স্পিনার শুধু তখন দেখাবে যখন লিস্টে আগে থেকে মেম্বার থাকবে (অর্থাৎ নিচে স্ক্রল করে লোড করার সময়)
                (isLoadingMembers && members.length > 0) ? <ActivityIndicator size="small" color="#D47B00" style={{ marginVertical: 10 }} /> : null
              }
    renderItem={({ item, index }) => {
            const targetEmail = item.userEmail || item.id;
              const isMe = targetEmail === currentUserEmail;
              const isFriend = myFriends.some(f => f.email === targetEmail);
              const isPending = pendingRequests.includes(targetEmail);
              const isReceived = receivedRequests.includes(targetEmail);

              const isThisUserOwner = targetEmail === lessonItem?.channelId || targetEmail === lessonItem?.creatorEmail;
              const isThisUserCoAdmin = communityAdmins.includes(targetEmail);

              return (
                <View className="mb-4 bg-white rounded-[24px] border-2 border-[#EFE8D6] shadow-sm p-4 mx-1">
                <View className="flex-row items-center justify-between mb-3">
                    <TouchableOpacity 
                      activeOpacity={0.7} 
                      onPress={() => openMemberProfile(item)} 
                      className="flex-row items-center flex-1"
                    >
                      <View className="relative">
                        <Image source={{uri: item.userAvatar && item.userAvatar !== 'null' ? item.userAvatar : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}} className="w-12 h-12 rounded-full border-2 border-[#EFE8D6] bg-[#F9F9F9]" />
                        {index < 3 && (
                          <View className="absolute -top-1 -right-1 bg-[#FF9600] w-5 h-5 rounded-full items-center justify-center border-2 border-white shadow-sm">
                            <Text className="text-[9px] text-white" style={{ fontFamily: 'BanglaBold' }}>{index + 1}</Text>
                          </View>
                        )}
                      </View>
                      <View className="ml-3 flex-1 pr-2">
                      <View className="flex-row items-center">
                          <Text className="text-[#3D382F] text-[15px] pt-0.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>{item.userName || 'শিক্ষার্থী'}</Text>
                          {(isThisUserOwner || isThisUserCoAdmin) && (
                            <View className="ml-2 bg-[#FF9600]/10 border border-[#FF9600]/30 px-2 py-0.5 rounded">
                              <Text className="text-[#D47B00] text-[9px]" style={{ fontFamily: 'BanglaBold' }}>
                                {isThisUserOwner ? (targetEmail === 'rumontrader662@gmail.com' ? 'অ্যাডমিন' : 'সিএ') : 'কো-অ্যাডমিন'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[#827B6E] text-[11px] mt-0.5" style={{ fontFamily: 'BanglaRegular' }}>স্টাডি স্কোয়াড মেম্বার</Text>
                      </View>
                    </TouchableOpacity>
                    
             {/* 🚀 রিমুভ করার অপশন */}
                    {(isStaff && targetEmail !== currentUserEmail && !isThisUserOwner && targetEmail !== 'rumontrader662@gmail.com' && (currentUserEmail === 'rumontrader662@gmail.com' || (!isThisUserCoAdmin || isOwner))) && (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleRemoveMember(targetEmail, item.userName || item.name)} className="bg-[#FFF4E5] w-8 h-8 rounded-full items-center justify-center border border-[#FFDDAA] ml-2">
                        <FontAwesome5 name="user-minus" size={10} color="#FF4B4B" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 🚀 Admin Controls for Owner */}
                  {(isOwner && !isThisUserOwner) && (
                    <TouchableOpacity activeOpacity={0.8} onPress={async () => {
                      if (!isThisUserCoAdmin && communityAdmins.length >= 5) {
                        return Alert.alert("সতর্কতা", "আপনি সর্বোচ্চ ৫ জন কো-অ্যাডমিন বানাতে পারবেন।");
                      }
                      const actionType = isThisUserCoAdmin ? 'remove_community_admin' : 'add_community_admin';
                      if (isThisUserCoAdmin) {
                        setCommunityAdmins(prev => prev.filter(e => e !== targetEmail));
                        setCommunityAdminList(prev => prev.filter(a => a.email !== targetEmail));
                      } else {
                        setCommunityAdmins(prev => [...prev, targetEmail]);
                        setCommunityAdminList(prev => [...prev, { email: targetEmail, name: item.userName }]);
                      }
                      try {
                        const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
                        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                          body: JSON.stringify({ action: actionType, guideId, actorEmail: currentUserEmail, targetEmail })
                        });
                      } catch(e) {}
                    }} className={`w-full py-2.5 rounded-[16px] flex-row justify-center items-center shadow-sm border mb-2 ${isThisUserCoAdmin ? 'bg-[#FFF4E5] border-[#FFDDAA]' : 'bg-[#EAF2D7] border-[#8BA85E]'}`}>
                      <FontAwesome5 name="user-shield" size={14} color={isThisUserCoAdmin ? "#D47B00" : "#58A700"} />
                      <Text className={`text-[14px] ml-2 pt-1 ${isThisUserCoAdmin ? 'text-[#D47B00]' : 'text-[#4A632D]'}`} style={{ fontFamily: 'BanglaBold' }}>{isThisUserCoAdmin ? 'অ্যাডমিন সরান' : 'অ্যাডমিন বানান'}</Text>
                    </TouchableOpacity>
                  )}

                  {/* 🚀 বটম সেকশন: ফুল-উইডথ ডাইনামিক বাটন */}
                {isMe ? (
                    <View className="w-full py-3 rounded-[16px] flex-row justify-center items-center shadow-sm border bg-[#F9F9F9] border-[#E5E5E5]">
                      <FontAwesome5 name="user-circle" size={14} color="#AFAFAF" />
                      <Text className="text-[#AFAFAF] text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এটি আপনার প্রোফাইল</Text>
                    </View>
                  ) : isFriend ? (
                    <View className="w-full py-2.5 rounded-[16px] flex-row justify-center items-center bg-[#E6F4FB] border border-[#BCE3F5]">
                      <FontAwesome5 name="user-check" size={14} color="#1073A4" />
                      <Text className="text-[#1073A4] text-[14px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ফ্রেন্ডস</Text>
                    </View>
                  ) : isReceived ? (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => handleAcceptRequest(targetEmail, item.userName, item.userAvatar)} className="w-full py-3 rounded-[16px] flex-row justify-center items-center shadow-sm border bg-[#1899D6] border-[#1899D6]">
                      <FontAwesome5 name="check" size={14} color="#FFF" />
                      <Text className="text-white text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>কনফার্ম করুন</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => handleAddFriend(targetEmail)} className={`w-full py-3 rounded-[16px] flex-row justify-center items-center shadow-sm border ${isPending ? 'bg-[#FFF4E5] border-[#FFC800]' : 'bg-white border-[#20A090]'}`}>
                      {isPending ? (
                        <>
                          <FontAwesome5 name="times-circle" size={14} color="#D47B00" />
                          <Text className="text-[#D47B00] text-[14px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ক্যানসেল করুন</Text>
                        </>
                      ) : (
                        <>
                          <FontAwesome5 name="user-plus" size={14} color="#20A090" />
                          <Text className="text-[#20A090] text-[14px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>অ্যাড ফ্রেন্ড</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
           />

            {/* 🚀 Vibe Coder Magic: Layer 2 Sliding Profile View */}
            <Animated.View 
              style={{ 
                transform: [{ translateX: profileSlideAnim }],
                position: 'absolute',
                top: 0, 
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: profileStack.length > 0 ? '#FFFFFF' : 'transparent',
                zIndex: 10,
                pointerEvents: profileStack.length > 0 ? 'auto' : 'none'
              }}
              className="rounded-t-[32px] overflow-hidden"
            >
              {selectedLiveMember && (
                  <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    
                    {/* ১. কভার ব্যানার ও ব্যাক/ক্লোজ বাটন */}
                    <View className="h-[140px] bg-[#A8B3FF] w-full relative rounded-b-[20px]">
                      <TouchableOpacity onPress={goBackProfile} className="absolute top-5 left-5 bg-black/20 w-9 h-9 rounded-full items-center justify-center z-20">
                        <FontAwesome5 name="arrow-left" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      
                      {profileStack.length > 1 && (
                        <TouchableOpacity onPress={closeMemberProfile} className="absolute top-5 right-5 bg-black/20 w-9 h-9 rounded-full items-center justify-center z-20">
                          <FontAwesome5 name="times" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* ২. অ্যাভাটার ও বেসিক ইনফো */}
                    <View className="items-center -mt-16 px-5 relative z-10">
  <View className="w-[110px] h-[110px] rounded-full border-[5px] border-white shadow-sm bg-[#EAE4D4]">
    <Image source={{ uri: selectedLiveMember.userAvatar || selectedLiveMember.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-full h-full rounded-full" />
  </View>
  <Text className="text-[#3D382F] text-[22px] pt-2 mb-1" style={{ fontFamily: 'BanglaBold' }}>
    {(selectedLiveMember.userEmail === currentUserEmail || selectedLiveMember.email === currentUserEmail || selectedLiveMember.id === currentUserEmail) ? 'আমি' : (selectedLiveMember.userName || selectedLiveMember.name)}
  </Text>
  <Text className="text-[#777777] text-[13px]" style={{ fontFamily: 'BanglaRegular' }}>স্টাডি স্কোয়াড মেম্বার</Text>
</View>

                 {isProfileLoading ? (
                      <View className="px-5 mt-6 w-full">
                        <MemberSkeleton />
                        <MemberSkeleton />
                        <MemberSkeleton />
                      </View>
                    ) : (
                      <>
                        {/* ৩. বন্ধুদের লিস্ট (ইনলাইন ডাইনামিক কার্ড) */}
                        <View className="px-5 mt-8">
                          <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-row space-x-2">
                              <TouchableOpacity activeOpacity={0.7} onPress={() => fetchProfileFriends('all', true)} className={`px-3 py-1.5 rounded-full border ${currentProfileEntry?.inlineFriendsType === 'all' ? 'bg-[#E6F4FB] border-[#BCE3F5]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}>
                                <Text className={`text-[12px] pt-0.5 ${currentProfileEntry?.inlineFriendsType === 'all' ? 'text-[#1073A4]' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                                  বন্ধুসমূহ ({selectedUserProfile?.friendsCount || 0})
                                </Text>
                              </TouchableOpacity>
                              
                              {selectedUserProfile?.mutualFriendsCount > 0 && (
                                <TouchableOpacity activeOpacity={0.7} onPress={() => fetchProfileFriends('mutual', true)} className={`px-3 py-1.5 rounded-full border ${currentProfileEntry?.inlineFriendsType === 'mutual' ? 'bg-[#FFF4E5] border-[#FFDDAA]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}>
                                  <Text className={`text-[12px] pt-0.5 ${currentProfileEntry?.inlineFriendsType === 'mutual' ? 'text-[#D47B00]' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                                    মিউচুয়াল ({selectedUserProfile?.mutualFriendsCount || 0})
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                          
                        <View>
                         {(currentProfileEntry?.inlineFriends || []).map((item, idx) => {
                              const targetEmail = item.email || item.id;
                              const isMe = targetEmail === currentUserEmail;
                              const isFriend = myFriends.some(f => f.email === targetEmail);
                              const isPending = pendingRequests.includes(targetEmail);
                              const isReceived = receivedRequests.includes(targetEmail); // 🚀 নতুন চেক

                              return (
                                <View key={idx} className="mb-4 bg-white rounded-[24px] border-2 border-[#EFE8D6] shadow-sm p-4">
                                  <View className="flex-row items-center justify-between mb-3">
                                    <TouchableOpacity 
                                      activeOpacity={0.7} 
                                      onPress={() => openMemberProfile(item)} 
                                      className="flex-row items-center flex-1"
                                    >
                                      <Image source={{ uri: item.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-12 h-12 rounded-full border-2 border-[#EFE8D6] bg-[#F9F9F9]" />
                                      <View className="ml-3 flex-1 pr-2">
                                        <Text className="text-[#3D382F] text-[15px]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>{item.name || 'শিক্ষার্থী'}</Text>
                                      </View>
                                    </TouchableOpacity>
                                  </View>

                              {isMe ? (
                                    <View className="w-full py-3 rounded-[16px] flex-row justify-center items-center shadow-sm border bg-[#F9F9F9] border-[#E5E5E5]">
                                      <FontAwesome5 name="user-circle" size={14} color="#AFAFAF" />
                                      <Text className="text-[#AFAFAF] text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এটি আপনার প্রোফাইল</Text>
                                    </View>
                                  ) : isFriend ? (
                                    <View className="w-full py-2.5 rounded-[16px] flex-row justify-center items-center bg-[#E6F4FB] border border-[#BCE3F5]">
                                      <FontAwesome5 name="user-check" size={14} color="#1073A4" />
                                      <Text className="text-[#1073A4] text-[14px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ফ্রেন্ডস</Text>
                                    </View>
                                  ) : isReceived ? (
                                    <TouchableOpacity activeOpacity={0.8} onPress={() => handleAcceptRequest(targetEmail, item.name, item.avatar)} className="w-full py-3 rounded-[16px] flex-row justify-center items-center shadow-sm border bg-[#1899D6] border-[#1899D6]">
                                      <FontAwesome5 name="check" size={14} color="#FFF" />
                                      <Text className="text-white text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>কনফার্ম করুন</Text>
                                    </TouchableOpacity>
                            ) : (
                                    <TouchableOpacity activeOpacity={0.8} onPress={() => handleAddFriend(targetEmail)} className={`w-full py-3 rounded-[16px] flex-row justify-center items-center shadow-sm border ${isPending ? 'bg-[#FFF4E5] border-[#FFC800]' : 'bg-white border-[#20A090]'}`}>
                                      {isPending ? (
                                        <>
                                          <FontAwesome5 name="times-circle" size={14} color="#D47B00" />
                                          <Text className="text-[#D47B00] text-[14px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ক্যানসেল করুন</Text>
                                        </>
                                      ) : (
                                        <>
                                          <FontAwesome5 name="user-plus" size={14} color="#20A090" />
                                          <Text className="text-[#20A090] text-[14px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>অ্যাড ফ্রেন্ড</Text>
                                        </>
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                          
                          {currentProfileEntry?.hasMoreInlineFriends && (currentProfileEntry?.inlineFriends || []).length > 0 && (
                            <TouchableOpacity 
                              activeOpacity={0.8} 
                              onPress={() => fetchProfileFriends(currentProfileEntry?.inlineFriendsType, false)} 
                              className="mt-2 mb-4 bg-[#F9F9F9] py-3.5 rounded-[16px] border border-[#EFE8D6] items-center"
                            >
                              {currentProfileEntry?.isFetchingFriends ? (
                                <ActivityIndicator size="small" color="#AFAFAF" />
                              ) : (
                                <Text className="text-[#777777] text-[13px] pt-1" style={{ fontFamily: 'BanglaBold' }}>আরো দেখুন...</Text>
                              )}
                            </TouchableOpacity>
                          )}
                          
                          {(currentProfileEntry?.inlineFriends || []).length === 0 && !currentProfileEntry?.isFetchingFriends && (
                            <View className="bg-[#FDF6E3] p-4 rounded-xl border border-[#EFE8D6] border-dashed items-center justify-center mt-2 mb-4">
                              <Text className="text-[#827B6E] text-[13px] text-center leading-[22px]" style={{ fontFamily: 'BanglaRegular' }}>কোনো বন্ধু পাওয়া যায়নি।</Text>
                            </View>
                          )}
                        {(currentProfileEntry?.inlineFriends || []).length === 0 && currentProfileEntry?.isFetchingFriends && (
                            <View className="mt-2 mb-4">
                              <MemberSkeleton />
                              <MemberSkeleton />
                            </View>
                          )}
                        </View>

                        <View className="w-full h-2 bg-[#F5F5F5] mt-8 mb-6" />

                        {/* ৫. জয়েন করা কমিউনিটি লিস্ট */}
                        <View className="px-5">
                          <Text className="text-[#3C3C3C] text-[16px] mb-4" style={{ fontFamily: 'BanglaBold' }}>যুক্ত হওয়া কমিউনিটি ({selectedUserProfile?.communities?.length || 0})</Text>
                          
                          {selectedUserProfile?.communities && selectedUserProfile.communities.length > 0 ? (
                           selectedUserProfile.communities.map((community, index) => (
                              <View key={index} className="mb-6">
                                <View className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#F0F2F5] border border-[#E5E5E5] relative">
                                  <Image source={{ uri: community.banner }} className="w-full h-full" resizeMode="cover" />
                                  {community.isOwner && (
                                    <View className="absolute top-2 left-2 bg-[#FF9600] px-3 py-1 rounded-full flex-row items-center border border-white shadow-sm">
                                      <FontAwesome5 name="crown" size={10} color="#FFFFFF" solid />
                                      <Text className="text-white text-[10px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>ক্রিয়েটর</Text>
                                    </View>
                                  )}
                                </View>
                                <View className="flex-row mt-3 px-1">
                                  <View className="w-11 h-11 rounded-full border border-[#E5E5E5] bg-[#F9F9F9] mr-3 overflow-hidden">
                                    <Image source={{ uri: community.creatorAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-full h-full" />
                                  </View>
                                  <View className="flex-1 justify-center -mt-1">
                                    <Text className="text-[#3C3C3C] text-[17px] leading-[26px] pt-1 mb-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>{community.notebookName}</Text>
                                    <View className="flex-row items-center pr-2">
                                      <Text className="text-[#777777] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>{community.creatorName || 'শিক্ষার্থী'}</Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            ))
                          ) : (
                            <View className="items-center justify-center py-10 bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] border-dashed">
                              <FontAwesome5 name="users-slash" size={24} color="#D7D7D7" />
                              <Text className="text-[#AFAFAF] text-[14px] mt-3 pt-1" style={{ fontFamily: 'BanglaBold' }}>কোনো কমিউনিটিতে যুক্ত নেই</Text>
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </ScrollView>
              )}
            </Animated.View>
            
          </Animated.View>
        </View>
      </Modal>

<Modal visible={isCaSelectModalVisible} transparent animationType="slide" onRequestClose={() => setIsCaSelectModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#FFFDF8] rounded-t-[32px] h-[85%] overflow-hidden relative" style={{ paddingBottom: insets.bottom }}>
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mt-5 mb-4" />
            <View className="flex-row justify-between items-center px-6 pb-3">
              <Text className="text-[20px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>নতুন সিএ বাছুন</Text>
              <TouchableOpacity onPress={() => setIsCaSelectModalVisible(false)} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>
            <View className="px-6 pb-2 border-b border-[#EFE8D6]">
              <View className="bg-white rounded-[16px] border border-[#EFE8D6] px-4 py-1.5 flex-row items-center shadow-sm">
                <FontAwesome5 name="search" size={14} color="#AFAFAF" />
                <TextInput 
                  className="flex-1 ml-3 text-[15px] pt-1 text-[#3D382F]" 
                  style={{ fontFamily: 'BanglaRegular' }}
                  placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                  placeholderTextColor="#AFAFAF"
                  value={caSearchQuery}
                  onChangeText={searchCandidates}
                />
              </View>
            </View>
            <ScrollView className="flex-1 px-6 pt-3" showsVerticalScrollIndicator={false}>
              {isCaSearching ? (
                <View className="pt-2">
                  <MemberSkeleton />
                  <MemberSkeleton />
                  <MemberSkeleton />
                </View>
              ) : caCandidates.length === 0 ? (
                <View className="items-center justify-center py-10 mt-10">
                  <FontAwesome5 name="search-minus" size={40} color="#EAE4D4" />
                  <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>কোনো যোগ্য ব্যক্তি পাওয়া যায়নি</Text>
                </View>
              ) : caCandidates.map(c => (
                <TouchableOpacity key={c.email} activeOpacity={0.8} onPress={() => setSelectedCa(c)} className={`flex-row items-center p-4 mb-3 border-[2px] rounded-[16px] ${selectedCa?.email === c.email ? 'bg-[#EAF2D7] border-[#8BA85E]' : 'bg-white border-[#EFE8D6]'}`}>
                  <Image source={{ uri: c.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-12 h-12 rounded-full border border-[#EFE8D6] bg-[#EAE4D4]" />
                  <View className="ml-3 flex-1 pr-2">
                    <View className="flex-row items-center">
                      <Text className="text-[15px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>{c.name}</Text>
                      {c.isMember && (
                        <View className="ml-2 bg-[#1899D6]/10 px-1.5 py-0.5 rounded border border-[#1899D6]/30">
                          <Text className="text-[#1899D6] text-[9px]" style={{ fontFamily: 'BanglaBold' }}>মেম্বার</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[11px] text-[#827B6E] mt-0.5" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={1}>{c.email}</Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedCa?.email === c.email ? 'bg-[#58A700] border-[#58A700]' : 'bg-white border-[#D7D7D7]'}`}>
                    {selectedCa?.email === c.email && <FontAwesome5 name="check" size={10} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="px-6 py-4 bg-white border-t border-[#EFE8D6]">
              <TouchableOpacity 
                activeOpacity={0.8}
                disabled={!selectedCa || isTransferring} 
                onPress={() => {
                  const doTransfer = async (banOld) => {
                    setIsTransferring(true);
                    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
                    try {
                      const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                        body: JSON.stringify({ action: 'transfer_community_ownership', channelId: guideId, newOwnerEmail: selectedCa.email, banOldOwner: banOld })
                      });
                      const data = await res.json();
                      setIsTransferring(false);
                      if (data.success) {
                        setIsCaSelectModalVisible(false);
                        Alert.alert("সফল!", "নতুন সিএ নিয়োগ সম্পন্ন হয়েছে।");
                        closePageWithAnimation(); 
                        DeviceEventEmitter.emit('FORCE_REFRESH_HOME_DATA');
                      } else {
                        Alert.alert("দুঃখিত", data.error || "ট্রান্সফার করা যায়নি।");
                      }
                    } catch(e) {
                      setIsTransferring(false);
                      Alert.alert("দুঃখিত", "ইন্টারনেট সমস্যা, আবার চেষ্টা করুন।");
                    }
                  };

                  Alert.alert("সিএ পরিবর্তন", "বর্তমান সিএ-র পজিশন বাতিল হবে এবং নতুন সিএ দায়িত্ব পাবে। আপনি কি শিওর?", [
                    { text: "বাতিল", style: "cancel" },
                    { text: "শুধু সরান", onPress: () => doTransfer(false) },
                    { text: "সরিয়ে ব্যান করুন", style: "destructive", onPress: () => doTransfer(true) }
                  ]);
                }} 
                className={`py-3.5 rounded-[16px] flex-row justify-center items-center shadow-sm ${selectedCa ? 'bg-[#1899D6]' : 'bg-[#EAE4D4]'}`}
              >
                {isTransferring ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text className={`text-[16px] pt-0.5 ${selectedCa ? 'text-white' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>পরবর্তী</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

   <Modal visible={isBannedModalVisible} transparent animationType="slide" onRequestClose={() => {
        setIsBannedModalVisible(false);
        handleMembersBadgeClick();
      }}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#FFFDF8] rounded-t-[32px] h-[85%] overflow-hidden relative" style={{ paddingBottom: insets.bottom }}>
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mt-5 mb-4" />
            <View className="flex-row justify-between items-center px-6 pb-4 border-b border-[#EFE8D6]">
              <View className="flex-1 pr-2">
                <Text className="text-[20px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>ব্যানড লিস্ট</Text>
                <Text className="text-[13px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }}>মোট {toEnglishNumber(bannedList.length)} জন</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsBannedModalVisible(false); handleMembersBadgeClick(); }} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-6 pt-5" showsVerticalScrollIndicator={false}>
              {isBannedLoading ? (
                <View>
                  <MemberSkeleton />
                  <MemberSkeleton />
                  <MemberSkeleton />
                </View>
              ) : bannedList.length === 0 ? (
                <View className="items-center justify-center py-10 mt-10">
                  <FontAwesome5 name="user-slash" size={40} color="#EAE4D4" />
                  <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>কেউ ব্যানড নেই</Text>
                </View>
              ) : bannedList.map(b => (
                <View key={b.userEmail} className="flex-row items-center p-4 mb-3 border-2 border-[#EFE8D6] rounded-[16px] bg-white shadow-sm">
                  <Image source={{ uri: b.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-12 h-12 rounded-full border border-[#EFE8D6] bg-[#EAE4D4]" />
                  <View className="ml-3 flex-1 pr-2">
                    <Text className="text-[15px] text-[#3D382F] pt-0.5" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>{b.userName}</Text>
                    <Text className="text-[12px] text-[#FF4B4B] mt-0.5" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={1}>ব্যান করেছেন: {b.bannedBy}</Text>
                    <Text className="text-[11px] text-[#827B6E] mt-0.5" style={{ fontFamily: 'BanglaRegular' }}>{formatBnDate(new Date(b.bannedAt).getTime())}</Text>
                  </View>
                  {(currentUserEmail === 'rumontrader662@gmail.com' || isOwner) && (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => {
                      Alert.alert("আনব্যান", "আপনি কি সত্যিই এই মেম্বারকে আনব্যান করতে চান?", [
                        { text: "না", style: "cancel" },
                        { text: "হ্যাঁ", onPress: async () => {
                          setBannedList(prev => prev.filter(x => x.userEmail !== b.userEmail));
                          try {
                            const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
                            await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                              method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                              body: JSON.stringify({ action: 'unban_community_member', guideId, userEmail: b.userEmail })
                            });
                          } catch(e) {}
                        }}
                      ]);
                    }} className="bg-[#EAF2D7] px-3 py-2 rounded-xl border border-[#8BA85E] flex-shrink-0">
                      <Text className="text-[#4A632D] text-[13px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আনব্যান</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🚀 Review & Rating Modal */}
      <Modal visible={isReviewModalVisible} transparent animationType="none" onRequestClose={closeReviewModalSmoothly}>
        <View className="flex-1 justify-end">
          
          <Animated.View style={{ opacity: reviewFadeAnim }} className="absolute inset-0 bg-black/60" />
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeReviewModalSmoothly} />
          
        {/* 🚀 মোডাল বডি */}
          <Animated.View 
            style={{ transform: [{ translateY: reviewSlideAnim }] }}
            className="bg-[#FDF6E3] rounded-t-[32px] h-[85%] overflow-hidden relative"
          >
            {/* Dragger */}
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mt-5 mb-4" />
            
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pb-3">
              <Text className="text-[20px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>স্টুডেন্ট রিভিউ ⭐</Text>
              <TouchableOpacity onPress={closeReviewModalSmoothly} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            {/* 🚀 কোর ফোকাস: রিভিউ সামারি (প্লে-স্টোরের মতো) */}
            <View className="flex-row items-center px-6 py-4 bg-white border-y border-[#EFE8D6] mb-2">
              <View className="items-center mr-6">
               <Text className="text-[42px] text-[#3D382F] leading-[50px]" style={{ fontFamily: 'BanglaBold' }}>
  {averageRating > 0 ? toEnglishNumber(averageRating) : '0.0'}
</Text>
                <View className="flex-row space-x-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesome5 key={i} name="star" size={12} color={i < Math.round(averageRating) ? "#FF9600" : "#EAE4D4"} solid={i < Math.round(averageRating)} />
                  ))}
                </View>
               <Text className="text-[12px] text-[#827B6E] mt-1" style={{ fontFamily: 'BanglaRegular' }}>{toEnglishNumber(reviews.length)} টি রিভিউ</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] text-[#6B655B] leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                  এই কমিউনিটি অন্যান্য স্টুডেন্টদের কেমন লেগেছে, তা এখান থেকে দেখে নিতে পারো। 
                </Text>
              </View>
            </View>

         {/* 🚀 অন্যদের রিভিউ লিস্ট (মেইন ফোকাস) */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
              {isLoadingReviews ? (
                <View>
                  <ReviewSkeleton />
                  <ReviewSkeleton />
                  <ReviewSkeleton />
                </View>
              ) : reviews.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <FontAwesome5 name="comment-dots" size={40} color="#EAE4D4" />
                  <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>এখনো কোনো রিভিউ নেই। প্রথম রিভিউটি আপনি দিন!</Text>
                </View>
              ) : (
                reviews.map((item, index) => (
                  <View key={index} className="bg-white p-4 rounded-[20px] border border-[#EFE8D6] mb-3 shadow-sm">
                    <View className="flex-row items-center mb-2">
                      <Image source={{ uri: item.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-10 h-10 rounded-full border-2 border-[#EFE8D6] bg-[#EAE4D4] mr-3" />
                      <View className="flex-1">
                        <Text className="text-[#3D382F] text-[15px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{item.name}</Text>
                        <View className="flex-row space-x-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FontAwesome5 key={i} name="star" size={10} color={i < item.rating ? "#FF9600" : "#EAE4D4"} solid={i < item.rating} />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text className="text-[#5C5549] text-[14px] leading-6" style={{ fontFamily: 'BanglaRegular' }}>{item.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            
     {/* 🚀 ফ্লোটিং অ্যাকশন এরিয়া (নিচে ফিক্সড থাকবে) */}
       <View className="absolute bottom-0 w-full bg-white px-6 py-4 border-t border-[#EFE8D6]">
            {!hasUserReviewed ? (
                !showReviewForm ? (
                  // 🚀 মতামত দেওয়ার বাটন
                  isBanned ? (
                    <View className="w-full px-4 py-3.5 rounded-[16px] flex-row items-center justify-center bg-[#F5F5F5] border-2 border-[#E5E5E5]">
                      <FontAwesome5 name="ban" size={14} color="#AFAFAF" />
                      <Text className="text-[#AFAFAF] text-[15px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                        ব্যানড থাকায় রিভিউ দেওয়া যাবে না।
                      </Text>
                    </View>
                  ) : (
                  <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={() => {
                      if (!isMember && lessonItem?.creatorEmail !== currentUserEmail) {
                        setCustomAlert({
                          visible: true,
                          title: "অ্যাক্সেস নেই!",
                          message: "রেটিং দিতে হলে আপনাকে অবশ্যই এই কমিউনিটির মেম্বার হতে হবে।",
                          type: "error"
                        });
                        return;
                      }
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setUserRating(0);
                      setReviewText('');
                      setShowReviewForm(true);
                    }} 
                    className="w-full px-4 py-3.5 rounded-[16px] flex-row items-center justify-center bg-[#FF9600]"
                  >
                    <FontAwesome5 name="pen" size={14} color="#FFFFFF" />
                    <Text className="text-white text-[16px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                      আপনার মতামত দিন
                    </Text>
                  </TouchableOpacity>
                  )
                ) : (
                  // 🚀 ফর্ম সেকশন
                  <View>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-[#3D382F] text-[15px]" style={{ fontFamily: 'BanglaBold' }}>{isEditingReview ? 'রেটিং আপডেট করুন:' : 'রেটিং দিন:'}</Text>
                      <View className="flex-row space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                            <FontAwesome5 name="star" size={24} color={star <= userRating ? "#FF9600" : "#EAE4D4"} solid={star <= userRating} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    <TextInput
                      className="bg-[#FDF6E3] p-3 rounded-xl border border-[#EFE8D6] text-[#3D382F] text-[14px] min-h-[50px] max-h-[80px]"
                      style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                      placeholder="কী ভালো লেগেছে বা কী উন্নতি করা যায়?"
                      placeholderTextColor="#AFAFAF"
                      multiline
                      value={reviewText}
                      onChangeText={setReviewText}
                    />
                    
                    <View className="flex-row mt-3 space-x-3">
                      {/* বাতিল বাটন */}
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          if (isEditingReview) {
                            setHasUserReviewed(true);
                            setIsEditingReview(false);
                          }
                          setShowReviewForm(false);
                        }}
                        className="flex-1 py-3 rounded-[16px] items-center bg-[#EAE4D4]"
                      >
                        <Text className="text-[14px] text-[#6B655B] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>বাতিল</Text>
                      </TouchableOpacity>

                      {/* সাবমিট / আপডেট বাটন */}
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        disabled={userRating === 0 || isSubmittingReview}
                        onPress={handleSubmitReview}
                        className={`flex-[2] py-3 rounded-[16px] items-center flex-row justify-center ${userRating > 0 ? 'bg-[#FF9600]' : 'bg-[#EAE4D4]'}`}
                      >
                        {isSubmittingReview ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text className={`text-[15px] pt-0.5 ${userRating > 0 ? 'text-white' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                            {isEditingReview ? 'আপডেট করুন' : 'সাবমিট করুন'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              ) : (
                // 🚀 ইউজার রেটিং দিয়ে থাকলে থ্রি-ডট মেনু দেখাবে
                <View className="bg-[#EAF2D7] p-4 rounded-[16px] border border-[#8BA85E] flex-row justify-between items-center relative">
                  <View className="flex-row items-center">
                    <FontAwesome5 name="check-circle" size={16} color="#58A700" solid />
                    <Text className="text-[#4A632D] text-[15px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                      আপনি রেটিং দিয়েছেন!
                    </Text>
                  </View>

                  {/* 🚀 থ্রি-ডট বাটন */}
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowReviewOptions(!showReviewOptions);
                    }} 
                    className="p-2 -mr-2"
                  >
                    <FontAwesome5 name="ellipsis-v" size={16} color="#4A632D" />
                  </TouchableOpacity>

                  {/* 🚀 ড্রপডাউন মেনু (থ্রি-ডটে ক্লিক করলে বের হবে) */}
                  {showReviewOptions && (
                    <View className="absolute right-5 bottom-12 bg-white rounded-xl border border-[#EFE8D6] shadow-sm w-36 overflow-hidden z-50">
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={() => {
                          setShowReviewOptions(false);
                          handleEditClick();
                        }} 
                        className="flex-row items-center px-4 py-3 border-b border-[#EFE8D6]"
                      >
                        <FontAwesome5 name="edit" size={12} color="#6B655B" />
                        <Text className="text-[#6B655B] text-[13px] ml-2.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এডিট করুন</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={() => {
                          setShowReviewOptions(false);
                          handleDeleteReview();
                        }} 
                        className="flex-row items-center px-4 py-3 bg-[#FFF4E5]"
                      >
                        <FontAwesome5 name="trash" size={12} color="#FF4B4B" />
                        <Text className="text-[#FF4B4B] text-[13px] ml-2.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>ডিলিট করুন</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

          </Animated.View>
        </View>
      </Modal>

{/* 🚀 Discussion (Community Chat) Modal */}
      <Discussion
        visible={discussionVisible}
        onClose={() => setDiscussionVisible(false)}
        data={activeDiscussionData}
        guideName={lessonItem?.notebookName}
        guideId={lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode}
        isStaff={isStaff}
      />

      {/* 🚀 Reader Engine Modal (The Actual Reading Mode) */}
      <SmartReaderEngine 
        visible={readerVisible} 
        onClose={() => setReaderVisible(false)} 
        guideData={selectedGuide} 
        onOpenChat={(questionData) => {
           setActiveDiscussionData(questionData);
           setDiscussionVisible(true);
        }}
      />

<Modal visible={isResourceOpening} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center">
          <View className="bg-white p-6 rounded-3xl items-center shadow-lg border-2 border-[#EFE8D6]">
            <ActivityIndicator size="large" color="#FF9600" className="mb-3" />
            <Text className="text-[#3D382F] text-[15px]" style={{ fontFamily: 'BanglaBold' }}>রিসোর্স লোড হচ্ছে...</Text>
          </View>
        </View>
      </Modal>
      
   {/* 🚀 Guide Edit Modal for Community Creators */}
      <Modal visible={isGuideEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsGuideEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#FFFDF8] rounded-t-[32px] p-6 pt-5 w-full">
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mb-5" />
            <View className="flex-row justify-between items-center mb-4 border-b border-[#EFE8D6] pb-3">
              <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>বই এডিট করুন</Text>
              <TouchableOpacity onPress={() => setIsGuideEditModalVisible(false)} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={pickGuideThumbnail} className="mb-6 items-center">
              <View className="w-32 h-32 rounded-[20px] overflow-hidden border-2 border-[#EFE8D6] border-dashed bg-[#F5F5F5] items-center justify-center relative">
                {tempGuideThumbnail ? (
                  <Image source={{ uri: tempGuideThumbnail }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <FontAwesome5 name="image" size={32} color="#D7D7D7" />
                )}
                {isImageUploading && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <ActivityIndicator size="large" color="#FF9600" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>বইয়ের নাম</Text>
            <TextInput
              className="bg-white p-4 rounded-[16px] text-[16px] text-[#3D382F] mb-6 border border-[#EFE8D6]"
              style={{ fontFamily: 'BanglaBold' }}
              value={tempGuideTitle}
              onChangeText={setTempGuideTitle}
            />

          <TouchableOpacity 
              className="bg-[#1899D6] py-3.5 rounded-[16px] items-center shadow-sm" 
              onPress={async () => { 
                if(!newSubjectTitle) return Alert.alert("সতর্কতা", "নাম দিন!");
                
                const newSubjectData = {
                  id: 'guide_' + Date.now(),
                  shareCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                  notebookName: newSubjectTitle,
                  thumbnail: tempGuideThumbnail,
                  isPublic: true,
                  creatorEmail: currentUserEmail,
                  channelId: currentUserEmail,
                  target: lessonItem?.niche || 'এইচএসসি (HSC)', 
                  failedItems: []
                };
                
                             try {
                  console.log('💾 SAVE পাঠানো ডেটা:', JSON.stringify({ id: newSubjectData.id, shareCode: newSubjectData.shareCode, target: newSubjectData.target, channelId: newSubjectData.channelId }));
                  const data = await apiCall('save_guide', { action: 'save_guide', guideData: newSubjectData });

                  if (data?.success) {
                    addedTrackerRef.current.guides[newSubjectData.id] = newSubjectData;

                    const verify = await apiCall('verify_fetch', {
                      action: 'fetch_channel_guides',
                      channelId: 'rumontrader662@gmail.com',
                      targetCategory: lessonItem?.niche,
                    });
                    const exists = verify?.guides?.some(g => g.shareCode === newSubjectData.shareCode);
                    console.log(exists
                      ? '🟢 VERIFY OK: সেভ হয়েছে এবং ফেচেও ফিরছে'
                      : '🔴 VERIFY FAIL: success বলেছে কিন্তু ফেচে ফিরছে না → সমস্যা ব্যাকএন্ডের সেভ/ফিল্টারে');
                    // 🚀 স্টেপ ২: ডাটাবেস থেকে 'success' সিগন্যাল পেলেই কেবল আমরা মডাল ক্লোজ করবো
                    setChannelGuides(prev => [newSubjectData, ...prev]);
                    setIsSubjectCreateVisible(false);
                    setNewSubjectTitle('');
                    setTempGuideThumbnail('');
                    
                    // কনফার্মেশন অ্যালার্ট (চেক করার জন্য)
                    Alert.alert("সফল!", "নতুন সাবজেক্ট ডাটাবেসে সেভ হয়েছে।");
                  } else {
                    Alert.alert("দুঃখিত", "সার্ভারে সেভ হয়নি। আবার চেষ্টা করুন।");
                  }
                } catch (error) {
                  console.log("Subject API Save Error: ", error);
                  Alert.alert("কানেকশন এরর", "ইন্টারনেট কানেকশন চেক করুন।");
                }
              }}
            >
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-[16px] pt-1">সাবজেক্ট তৈরি করুন</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    {/* 🚀 ২. নেস্টেড কোশ্চেন ব্যাংক ভিউ মডাল (Review Modal Style) */}
      <Modal visible={isSubjectViewVisible} transparent animationType="none" onRequestClose={closeSubjectModalSmoothly}>
        <View className="flex-1 justify-end">
          
          {/* পেছনের ডার্ক ফেড অ্যানিমেশন */}
          <Animated.View style={{ opacity: subjectFadeAnim }} className="absolute inset-0 bg-black/60" />
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeSubjectModalSmoothly} />
          
          <Animated.View 
            style={{ transform: [{ translateY: subjectSlideAnim }] }}
            className="bg-[#FFFDF8] rounded-t-[32px] h-[85%] overflow-hidden relative"
          >
            {/* Dragger */}
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mt-5 mb-4" />
            
         
         {/* Header */}
            <View className="flex-row justify-between items-center px-6 pb-3 border-b border-[#EFE8D6]">
              <Text className="text-[18px] text-[#3D382F] pt-1" style={{ fontFamily: 'BanglaBold' }}>{selectedSubject?.notebookName}</Text>
              <TouchableOpacity onPress={closeSubjectModalSmoothly} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

          {/* 🚀 Segmented Tab Bar (Duolingo Style - Fix: Button exact shape and swapped order) */}
            <View className="px-6 py-4 bg-[#FFFDF8]">
              <View className="flex-row bg-[#EAE4D4] p-1.5 rounded-[20px]">
                
                {/* 🚀 Left Tab: Chapter */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => handleTabSwitch('chapter')} 
                  className={`flex-1 items-center justify-center py-2.5 rounded-[16px] border-2 ${subjectActiveTab === 'chapter' ? 'bg-[#1CB0F6] border-[#1899D6] border-b-[4px]' : 'border-transparent'}`}
                >
                  <Text className={`text-[14px] pt-1 ${subjectActiveTab === 'chapter' ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>অধ্যায় ভিত্তিক ব্যাংক</Text>
                </TouchableOpacity>
                
                {/* 🚀 Right Tab: Special */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => handleTabSwitch('special')} 
                  className={`flex-1 items-center justify-center py-2.5 rounded-[16px] border-2 ${subjectActiveTab === 'special' ? 'bg-white border-[#D7D7D7] border-b-[4px]' : 'border-transparent'}`}
                >
                  <Text className={`text-[14px] pt-1 ${subjectActiveTab === 'special' ? 'text-[#3D382F]' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>স্পেশাল সাজেশন 🌟</Text>
                </TouchableOpacity>

              </View>
            </View>
            
           <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              
              {/* ==============================
                  🌟 স্পেশাল সাজেশন ট্যাব 
              ============================== */}
              {subjectActiveTab === 'special' && (
                <View>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[16px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>স্পেশাল সাজেশন 🌟</Text>
                    
                   {(isStaff) && (
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => {
                          const specialSubject = {
                            ...selectedSubject,
                            shareCode: `SPECIAL_${lessonItem?.channelId}_${selectedSubject.shareCode}`
                          };
                          AsyncStorage.setItem('@target_subject', JSON.stringify(specialSubject));
                          setIsSubjectViewVisible(false);
                          DeviceEventEmitter.emit('open_create_guide_modal'); 
                        }} 
                        className="bg-[#1899D6]/10 px-3 py-1.5 rounded-full flex-row items-center"
                      >
                        <FontAwesome5 name="plus" size={10} color="#1899D6" />
                        <Text className="text-[#1899D6] text-[12px] ml-1.5 pt-1" style={{ fontFamily: 'BanglaBold' }}>অ্যাড করুন</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isTabLoading || isLoadingSpecialBanks ? (
                    <View>
                      <SpecialCardSkeleton />
                      <SpecialCardSkeleton />
                    </View>
                  ) : (specialBanks[selectedSubject?.shareCode] || []).length > 0 ? (
                    <View>
                      {(() => {
                        const currentSpecialBanks = specialBanks[selectedSubject?.shareCode] || [];
                        const sortedSpecialBanks = [...currentSpecialBanks].sort((a, b) => {
                          if (a.isPinned && !b.isPinned) return -1;
                          if (!a.isPinned && b.isPinned) return 1;
                          if (a.isPinned && b.isPinned) return (b.pinnedAt || 0) - (a.pinnedAt || 0); // newest first
                          return 0; // maintain existing order
                        });

                        return sortedSpecialBanks.map((bank, idx) => (
                          <View key={`sp_${idx}`} className={`bg-white p-4 rounded-[20px] mb-4 border-2 shadow-sm ${bank.isPinned ? 'border-[#F0D5A3] bg-[#FFF8EB]' : 'border-[#EFE8D6]'}`}>
                            
                            {/* Header of Card */}
                            <View className="flex-row items-center justify-between mb-3">
                              {bank.isPinned ? (
                                <View className="bg-[#FF9600]/10 px-2.5 py-1 rounded-md border border-[#FF9600]/30 flex-row items-center">
                                  <FontAwesome5 name="thumbtack" size={10} color="#D47B00" />
                                  <Text className="text-[#D47B00] text-[11px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>পিনড</Text>
                                </View>
                              ) : <View />}

                              <View className="flex-row items-center space-x-2">
                                {isStaff && (
                                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleTogglePinSpecialBank(bank)} className="w-8 h-8 rounded-full bg-[#FDF6E3] border border-[#EFE8D6] items-center justify-center shadow-sm">
                                    <FontAwesome5 name="thumbtack" size={11} color={bank.isPinned ? "#D47B00" : "#827B6E"} />
                                  </TouchableOpacity>
                                )}
                                {(isStaff) && (
                                  <>
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                      setManagingBank(bank);
                                      setBankHistory([bank.questions || []]);
                                      setHistoryStep(0);
                                      setIsManagingSpecialBank(true);
                                      setIsBankManageModalVisible(true);
                                    }} className="w-8 h-8 rounded-full bg-[#FDF6E3] border border-[#EFE8D6] items-center justify-center shadow-sm">
                                      <FontAwesome5 name="pen" size={11} color="#D47B00" />
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                      Alert.alert("ডিলিট করুন", "আপনি কি সত্যিই এই স্পেশাল ব্যাংকটি ডিলিট করতে চান?", [
                                        { text: "না", style: "cancel" },
                                        { text: "হ্যাঁ, মুছুন", style: "destructive", onPress: async () => {
                                          const updatedBanks = specialBanks[selectedSubject.shareCode].filter(b => b.bankId !== bank.bankId);
                                          setSpecialBanks(prev => ({ ...prev, [selectedSubject.shareCode]: updatedBanks }));
                                          try {
                                            await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                                              body: JSON.stringify({ action: 'delete_special_bank', guideId: selectedSubject.shareCode, communityId: lessonItem?.channelId, bankId: bank.bankId })
                                            });
                                          } catch (e) {}
                                        }}
                                      ]);
                                    }} className="w-8 h-8 rounded-full bg-[#FFF4E5] border border-[#FFDDAA] items-center justify-center shadow-sm">
                                      <FontAwesome5 name="trash" size={11} color="#FF4B4B" />
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
                            </View>

                            <Text className="text-[#3D382F] text-[18px] mb-3 leading-[26px]" style={{ fontFamily: 'BanglaBold' }}>{bank.bankName}</Text>
                            
                            <View className="flex-row items-center mb-4">
                              <View className="bg-[#1899D6]/10 px-2.5 py-1 rounded-md border border-[#1899D6]/30">
                                <Text className="text-[#1899D6] text-[12px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{bank.questions?.length || 0} টি প্রশ্ন 🎯</Text>
                              </View>
                            </View>

                            <TouchableOpacity activeOpacity={0.8} onPress={() => {
                              const now = Date.now();
                              const updatedTimestamps = { ...bankReadTimestamps, [bank.bankId]: now };
                              setBankReadTimestamps(updatedTimestamps);
                              AsyncStorage.setItem('@bank_read_history', JSON.stringify(updatedTimestamps)).catch(()=>{});
                              const tempGuide = { ...selectedSubject, failedItems: bank.questions };
                              openBookInReader(tempGuide);
                            }} className="w-full bg-[#1073A4] rounded-[16px] pb-[4px]">
                              <View className="w-full bg-[#1CB0F6] rounded-[16px] py-3.5 flex-row justify-center items-center border-2 border-b-0 border-[#1899D6]">
                                <FontAwesome5 name="book-reader" size={14} color="#FFFFFF" />
                                <Text className="text-white text-[15px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                                  পড়া শুরু করো
                                </Text>
                              </View>
                            </TouchableOpacity>

                          </View>
                        ));
                      })()}
                    </View>
                  ) : (
                    <View className="items-center justify-center py-10 bg-white rounded-[20px] border-2 border-[#EFE8D6] border-dashed">
                      <FontAwesome5 name="star" size={36} color="#EAE4D4" solid />
                      <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>এখনো কোনো স্পেশাল সাজেশন নেই</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ==============================
                  📚 অধ্যায় ভিত্তিক ব্যাংক ট্যাব 
              ============================== */}
              {subjectActiveTab === 'chapter' && (
                <View>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[16px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>অধ্যায় ভিত্তিক ব্যাংক</Text>
                    {currentUserEmail === 'rumontrader662@gmail.com' && (
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => {
                          AsyncStorage.setItem('@target_subject', JSON.stringify(selectedSubject));
                          setIsSubjectViewVisible(false);
                          DeviceEventEmitter.emit('open_create_guide_modal'); 
                        }} 
                        className="bg-[#58A700]/10 px-3 py-1.5 rounded-full border border-[#58CC02]/30 flex-row items-center"
                      >
                        <FontAwesome5 name="plus" size={12} color="#58A700" />
                        <Text className="text-[#58A700] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>অ্যাড কোশ্চেন ব্যাংক</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isTabLoading ? (
                    <View>
                      <BankCardSkeleton />
                      <BankCardSkeleton />
                      <BankCardSkeleton />
                    </View>
                  ) : selectedSubject?.failedItems?.length > 0 && selectedSubject.failedItems[0].isBank ? (
                    selectedSubject.failedItems.map((bank, idx) => {
                      const chapterColors = ['#1899D6', '#FF9600', '#58A700', '#A559D6', '#FF4B4B'];
                      const activeColor = chapterColors[idx % chapterColors.length];
                      
                      return (
                      <View key={idx} className="bg-white p-4 rounded-[20px] mb-4 border-2 border-[#EFE8D6] border-b-[4px] shadow-sm flex-row items-center justify-between">
                        <TouchableOpacity activeOpacity={0.8} onPress={() => {
                          const now = Date.now();
                          const updatedTimestamps = { ...bankReadTimestamps, [bank.bankId]: now };
                          setBankReadTimestamps(updatedTimestamps);
                          AsyncStorage.setItem('@bank_read_history', JSON.stringify(updatedTimestamps)).catch(()=>{});
                          const tempGuide = { ...selectedSubject, failedItems: bank.questions };
                          openBookInReader(tempGuide);
                        }} className="flex-row items-center flex-1">
                          
                          <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${activeColor}15`, borderColor: `${activeColor}30`, borderWidth: 1 }}>
                            <Text className="text-[16px] pt-1" style={{ color: activeColor, fontFamily: 'BanglaBold' }}>{toEnglishNumber(idx + 1)}</Text>
                          </View>

                          <View className="flex-1 pr-2">
                            <Text className="text-[#3D382F] text-[16px] leading-[24px]" style={{ fontFamily: 'BanglaBold' }}>{bank.bankName}</Text>
                            <View className="flex-row items-center mt-1.5">
                              <Text className="text-[#827B6E] text-[12px]" style={{ fontFamily: 'BanglaRegular' }}>{bank.questions?.length || 0} টি প্রশ্ন</Text>
                              
                              {(() => {
                                const lastRead = bankReadTimestamps[bank.bankId] || 0;
                                const newQCount = bank.questions?.filter(q => 
                                  q.addedAt && 
                                  (Date.now() - q.addedAt) < (7 * 24 * 60 * 60 * 1000) && 
                                  q.addedAt > lastRead
                                ).length || 0;

                                if (newQCount > 0) {
                                  return (
                                    <View className="ml-2 bg-[#FF4B4B]/10 px-1.5 py-0.5 rounded border border-[#FF4B4B]/30">
                                      <Text className="text-[9px] text-[#FF4B4B]" style={{ fontFamily: 'BanglaBold' }}>
                                        {newQCount} টি নতুন 💥
                                      </Text>
                                    </View>
                                  );
                                }
                                return null;
                              })()}
                            </View>
                          </View>
                        </TouchableOpacity>
                        
                     {currentUserEmail === 'rumontrader662@gmail.com' ? (
                          <View className="flex-row items-center space-x-2">
                            <TouchableOpacity activeOpacity={0.7} onPress={() => {
                              setManagingBank(bank);
                              setBankHistory([bank.questions || []]);
                              setHistoryStep(0);
                              setIsManagingSpecialBank(false); // 🚀 normal bank edit
                              setIsBankManageModalVisible(true);
                            }} className="w-8 h-8 rounded-full bg-[#FDF6E3] border border-[#EFE8D6] items-center justify-center">
                              <FontAwesome5 name="pen" size={11} color="#D47B00" />
                            </TouchableOpacity>

                            <TouchableOpacity activeOpacity={0.7} onPress={() => {
                              Alert.alert("ডিলিট করুন", "আপনি কি সত্যিই এই কোশ্চেন ব্যাংকটি ডিলিট করতে চান?", [
                                { text: "না", style: "cancel" },
                                { text: "হ্যাঁ, মুছুন", style: "destructive", onPress: async () => {
                                    const updatedFailedItems = selectedSubject.failedItems.filter(b => b.bankId !== bank.bankId);
                                    const updatedSubject = { ...selectedSubject, failedItems: updatedFailedItems };
                                    setSelectedSubject(updatedSubject);
                                    setChannelGuides(prev => prev.map(g => g.id === updatedSubject.id ? updatedSubject : g));
                                    
                                    try {
                                      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                                        body: JSON.stringify({ action: 'save_guide', guideData: updatedSubject })
                                      });
                                      DeviceEventEmitter.emit('refresh_library');
                                    } catch (e) {}
                                }}
                              ]);
                            }} className="w-8 h-8 rounded-full bg-[#FFF4E5] border border-[#FFDDAA] items-center justify-center ml-1">
                              <FontAwesome5 name="trash" size={11} color="#FF4B4B" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center ml-2">
                            <FontAwesome5 name="chevron-right" size={12} color="#827B6E" />
                          </View>
                        )}
                      </View>
                    )})
                  ) : (
                    <View className="items-center justify-center py-10 bg-white rounded-[20px] border-2 border-[#EFE8D6] border-dashed">
                      <FontAwesome5 name="folder-open" size={36} color="#EAE4D4" />
                      <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>এখনো কোনো কোশ্চেন ব্যাংক নেই</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

 {/* 🚀 ৩. কোশ্চেন ব্যাংক ম্যানেজমেন্ট মডাল (Smart Bulk Management) */}

    <Modal 
        visible={isBankManageModalVisible} 
        animationType="slide" 
        transparent={true} 
        onRequestClose={() => {
          setIsBankManageModalVisible(false);
          setIsManagingSpecialBank(false); // 🚀 Fix 3: Reset on close
          setIsBankSelectionMode(false);
          setSelectedBankQuestions({});
          setBankSearchQuery('');
          setActiveBankFilter('সব');
          setActiveBankTypeFilter('সব'); // 🚀 নতুন রিসেট যুক্ত করা হলো
        }}
      >
        <View className="flex-1 bg-[#FDF6E3]">
      {(() => {
            const allQuestions = managingBank?.questions || [];
            
         // 🚀 ইমেজ আপলোডার লজিক (কোশ্চেনের ভেতরে)
            const pickQuestionImage = async (questionId) => {
              let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8
              });
              
              if (!result.canceled && result.assets[0].uri) {
                setUploadingImageQId(questionId);
                try {
                  const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri, [{ resize: { width: 800 } }],
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                  );
                  
                  if (manipResult.base64) {
                    const imgUrl = await uploadToImgBB(manipResult.base64);
                    if (imgUrl) {
                      const newHistory = bankHistory.slice(0, historyStep + 1);
                      const updatedQuestions = allQuestions.map(q => q.id === questionId ? { ...q, image: imgUrl, needsImage: false } : q);
                      
                      newHistory.push(updatedQuestions);
                      setBankHistory(newHistory);
                      setHistoryStep(newHistory.length - 1);
                      
                      // 🚀 এই ফাংশন কল করার মাধ্যমেই ছবিটা মেইন স্টেটে এবং ডাটাবেসে সেভ হয়ে যাবে
                      await updateBankWithQuestions(updatedQuestions);
                      
                      // 🚀 সাকসেস অ্যালার্ট দেখানো
                      setCustomAlert({
                        visible: true,
                        title: "ছবি সেভ হয়েছে! ✅",
                        message: "আপনার চিত্রটি সফলভাবে প্রশ্নব্যাংকে যুক্ত হয়েছে।",
                        type: "success"
                      });
                    } else {
                      Alert.alert("দুঃখিত", "ছবি আপলোড করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।");
                    }
                  }
                } catch (error) {
                  Alert.alert("ত্রুটি", "ছবি প্রসেস করতে সমস্যা হয়েছে।");
                } finally {
                  setUploadingImageQId(null);
                }
              }
            };

            // 🚀 ১. ডাইনামিক ফিল্টার টপিক ও টাইপ তৈরি
            const uniqueTopics = ['সব', ...new Set(allQuestions.map(q => q.topic).filter(Boolean))];
            const uniqueTypes = ['সব', ...new Set(allQuestions.map(q => q.type).filter(Boolean))]; // 🚀 টাইপ লিস্ট
            
       // 🚀 ২. আনডু/রিডু লজিক (আপডেট মেকানিজম)
            const updateBankWithQuestions = async (questions) => {
              const updatedBank = { ...managingBank, questions };
              setManagingBank(updatedBank);

              // 🚀 যদি এটা স্পেশাল ব্যাংক হয়, তবে ফেক শেয়ারকোড দিয়ে API তে পুশ করবো
              if (isManagingSpecialBank) {
                const currentBanks = specialBanks[selectedSubject.shareCode] || [];
                const updatedBanks = currentBanks.map(b => b.bankId === managingBank.bankId ? updatedBank : b);
                setSpecialBanks(prev => ({ ...prev, [selectedSubject.shareCode]: updatedBanks }));
                
                const fakeSubject = { ...selectedSubject, failedItems: updatedBanks, shareCode: `SPECIAL_${lessonItem?.channelId}_${selectedSubject.shareCode}` };
                try {
                  await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                    body: JSON.stringify({ action: 'save_guide', guideData: fakeSubject })
                  });
                } catch (e) {}
              } else {
                const updatedFailedItems = selectedSubject.failedItems.map(b => b.bankId === managingBank.bankId ? updatedBank : b);
                const updatedSubject = { ...selectedSubject, failedItems: updatedFailedItems };
                setSelectedSubject(updatedSubject);
                setChannelGuides(prev => prev.map(g => g.shareCode === updatedSubject.shareCode ? updatedSubject : g));
                try {
                  await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                    body: JSON.stringify({ action: 'save_guide', guideData: updatedSubject })
                  });
                } catch (e) {}
              }
            };

            const handleUndo = () => {
              if (historyStep > 0) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                const prevStep = historyStep - 1;
                setHistoryStep(prevStep);
                updateBankWithQuestions(bankHistory[prevStep]);
              }
            };

            const handleRedo = () => {
              if (historyStep < bankHistory.length - 1) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                const nextStep = historyStep + 1;
                setHistoryStep(nextStep);
                updateBankWithQuestions(bankHistory[nextStep]);
              }
            };

        // 🚀 ৩. সার্চ ও ফিল্টার লজিক (ট্রিপল ফিল্টার + চিত্র)
            const filteredQuestions = allQuestions.filter(q => {
              const matchSearch = (q.question || q.stem || '').toLowerCase().includes(bankSearchQuery.toLowerCase());
              const matchTopic = activeBankFilter === 'সব' || q.topic === activeBankFilter;
              const matchType = activeBankTypeFilter === 'সব' || q.type === activeBankTypeFilter;
              const matchImage = activeNeedsImageFilter ? q.needsImage === true : true; // 🚀 শুধু চিত্র দরকার এমন প্রশ্নগুলো আনবে
              return matchSearch && matchTopic && matchType && matchImage;
            });

            const selectedCount = Object.keys(selectedBankQuestions).length;
            const isAllFilteredSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selectedBankQuestions[q.id]);

            const toggleSelection = (id) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setSelectedBankQuestions(prev => {
                const newSel = { ...prev };
                if (newSel[id]) delete newSel[id];
                else newSel[id] = true;
                return newSel;
              });
            };

            const toggleSelectAll = () => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              if (isAllFilteredSelected) {
                // ফিল্টার করা আইটেমগুলো আনসিলেক্ট করবে
                setSelectedBankQuestions(prev => {
                  const newSel = { ...prev };
                  filteredQuestions.forEach(q => delete newSel[q.id]);
                  return newSel;
                });
              } else {
                // ফিল্টার করা আইটেমগুলো সিলেক্ট করবে
                setSelectedBankQuestions(prev => {
                  const newSel = { ...prev };
                  filteredQuestions.forEach(q => newSel[q.id] = true);
                  return newSel;
                });
              }
            };

       const handleBulkDelete = () => {
              Alert.alert("বাল্ক ডিলিট", `আপনি কি সত্যিই সিলেক্ট করা ${selectedCount} টি প্রশ্ন ডিলিট করতে চান?`, [
                { text: "না", style: "cancel" },
                { text: "হ্যাঁ, মুছুন", style: "destructive", onPress: async () => {
                    const updatedQuestions = allQuestions.filter(q => !selectedBankQuestions[q.id]);
                    
                    // 🚀 হিস্ট্রি সেভ করা হচ্ছে (যাতে আনডু করা যায়)
                    const newHistory = bankHistory.slice(0, historyStep + 1);
                    newHistory.push(updatedQuestions);
                    setBankHistory(newHistory);
                    setHistoryStep(newHistory.length - 1);

                    // 🚀 Fix 3: Use updateBankWithQuestions to properly handle both normal and special banks
                    await updateBankWithQuestions(updatedQuestions);
                    
                    setIsBankSelectionMode(false);
                    setSelectedBankQuestions({});
                }}
              ]);
            };

            return (
              <>
                {/* 🚀 টপ বার, সার্চ এবং ফিল্টার চিপস */}
                <View style={{ paddingTop: Math.max(insets.top, 15) }} className="px-5 pb-3 bg-[#FFFDF8] border-b border-[#EFE8D6]">
                  <View className="flex-row items-center justify-between mb-3">
             <TouchableOpacity onPress={() => {
                      setIsBankManageModalVisible(false);
                      setIsManagingSpecialBank(false); // 🚀 Fix 3: Reset on close
                      setIsBankSelectionMode(false);
                      setSelectedBankQuestions({});
                      setBankSearchQuery('');
                      setActiveBankFilter('সব');
                      setActiveBankTypeFilter('সব'); // 🚀 নতুন রিসেট যুক্ত করা হলো
                    }} className="bg-[#EAE4D4] w-10 h-10 rounded-full items-center justify-center">
                      <FontAwesome5 name="arrow-left" size={16} color="#6B655B" />
                    </TouchableOpacity>
                    
                    {/* 🚀 ফিক্স: কোশ্চেন ব্যাংকের নাম সরাসরি এডিট করার অপশন */}
                   <TextInput 
                      className="text-[18px] text-[#3D382F] pt-1 flex-1 text-center px-3 border-b-2 border-[#D7D7D7] mx-2 pb-1" 
                      style={{ fontFamily: 'BanglaBold' }} 
                      value={managingBank?.bankName}
                      onChangeText={(text) => setManagingBank(prev => ({...prev, bankName: text}))}
                      onEndEditing={async () => {
                        if (!managingBank?.bankName?.trim()) return;
                        
                        if (isManagingSpecialBank) {
                          const currentBanks = specialBanks[selectedSubject.shareCode] || [];
                          const updatedBanks = currentBanks.map(b => b.bankId === managingBank.bankId ? managingBank : b);
                          setSpecialBanks(prev => ({ ...prev, [selectedSubject.shareCode]: updatedBanks }));
                          const fakeSubject = { ...selectedSubject, failedItems: updatedBanks, shareCode: `SPECIAL_${lessonItem?.channelId}_${selectedSubject.shareCode}` };
                          try {
                            await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                              body: JSON.stringify({ action: 'save_guide', guideData: fakeSubject })
                            });
                          } catch (e) {}
                        } else {
                          const updatedFailedItems = selectedSubject.failedItems.map(b => b.bankId === managingBank.bankId ? managingBank : b);
                          const updatedSubject = { ...selectedSubject, failedItems: updatedFailedItems };
                          setSelectedSubject(updatedSubject);
                          setChannelGuides(prev => prev.map(g => g.shareCode === updatedSubject.shareCode ? updatedSubject : g));
                          try {
                            await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                              body: JSON.stringify({ action: 'save_guide', guideData: updatedSubject })
                            });
                          } catch (e) {}
                        }
                      }}
                    />
                    
                  {/* 🚀 প্লাস আইকন (নতুন প্রশ্ন অ্যাড করার জন্য) */}
                    <TouchableOpacity activeOpacity={0.8} onPress={async () => {
                        const targetSubj = isManagingSpecialBank 
                          ? { ...selectedSubject, shareCode: `SPECIAL_${lessonItem?.channelId}_${selectedSubject.shareCode}`, failedItems: specialBanks[selectedSubject.shareCode] || [] } 
                          : selectedSubject;
                        await AsyncStorage.setItem('@target_subject', JSON.stringify(targetSubj));
                        await AsyncStorage.setItem('@target_bank_to_update', JSON.stringify(managingBank));
                        setIsBankManageModalVisible(false);
                        setIsSubjectViewVisible(false);
                        DeviceEventEmitter.emit('open_create_guide_modal'); 
                    }} className="bg-[#EAF6FE] w-10 h-10 rounded-full items-center justify-center border border-[#1CB0F6]/30">
                        <FontAwesome5 name="plus" size={14} color="#1899D6" />
                    </TouchableOpacity>
                  </View>

              <View className="flex-row items-center bg-white rounded-[16px] border border-[#EFE8D6] px-4 py-1.5 shadow-sm mb-3">
                    <FontAwesome5 name="search" size={14} color="#AFAFAF" />
                    <TextInput 
                      className="flex-1 ml-3 text-[15px] text-[#3D382F] pt-1" 
                      style={{ fontFamily: 'BanglaRegular' }} 
                      placeholder="প্রশ্ন খুঁজুন..." 
                      placeholderTextColor="#AFAFAF"
                      value={bankSearchQuery}
                      onChangeText={setBankSearchQuery}
                    />
                  </View>

            {/* 🚀 ট্রিপল ফিল্টার চিপস: টাইপ, টপিক ও চিত্র */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
                    
                    {/* 🚀 চিত্র দরকার ফিল্টার চিপ */}
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setActiveNeedsImageFilter(!activeNeedsImageFilter);
                      }} 
                      className={`mr-3 px-3 py-1.5 rounded-full border flex-row items-center ${activeNeedsImageFilter ? 'bg-[#FF4B4B] border-[#D63939]' : 'bg-white border-[#EFE8D6]'}`}
                    >
                      <FontAwesome5 name="image" size={12} color={activeNeedsImageFilter ? "#FFF" : "#827B6E"} />
                      <Text className={`text-[12px] pt-1 ml-1.5 ${activeNeedsImageFilter ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>চিত্র দরকার</Text>
                    </TouchableOpacity>

                    <Text className="text-[#AFAFAF] text-[12px] pt-1.5 mx-2" style={{ fontFamily: 'BanglaBold' }}>টাইপ:</Text>
                    {uniqueTypes.map((type, index) => {
                      const isActive = activeBankTypeFilter === type;
                      return (
                        <TouchableOpacity 
                          key={`type_${index}`} 
                          activeOpacity={0.8} 
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setActiveBankTypeFilter(type);
                          }} 
                          className={`mr-2 px-4 py-1.5 rounded-full border ${isActive ? 'bg-[#1899D6] border-[#1899D6]' : 'bg-white border-[#EFE8D6]'}`}
                        >
                          <Text className={`text-[13px] pt-1 ${isActive ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <Text className="text-[#AFAFAF] text-[12px] pt-1.5 mr-2" style={{ fontFamily: 'BanglaBold' }}>টপিক:</Text>
                    {uniqueTopics.map((topic, index) => {
                      const isActive = activeBankFilter === topic;
                      return (
                        <TouchableOpacity 
                          key={`topic_${index}`} 
                          activeOpacity={0.8} 
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setActiveBankFilter(topic);
                          }} 
                          className={`mr-2 px-4 py-1.5 rounded-full border ${isActive ? 'bg-[#FF9600] border-[#FF9600]' : 'bg-white border-[#EFE8D6]'}`}
                        >
                          <Text className={`text-[13px] pt-1 ${isActive ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>
                            {topic}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🚀 সিলেক্ট মোড, আনডু/রিডু টগল ও সিলেক্ট অল */}
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#EFE8D6] bg-[#FFFDF8]">
                {isBankSelectionMode ? (
                    <TouchableOpacity activeOpacity={0.7} onPress={toggleSelectAll} className="flex-row items-center">
                      <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${isAllFilteredSelected ? 'bg-[#58A700] border-[#58A700]' : 'bg-white border-[#D7D7D7]'}`}>
                        {isAllFilteredSelected && <FontAwesome5 name="check" size={10} color="#FFF" />}
                      </View>
                      <Text className="text-[#3D382F] text-[14px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>সব সিলেক্ট করুন</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-row items-center space-x-3">
                      <Text className="text-[#827B6E] text-[13px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{filteredQuestions.length} টি প্রশ্ন</Text>
                      
                      {/* 🚀 আনডু/রিডু বাটন */}
                      <View className="flex-row space-x-1 border-l border-[#EFE8D6] pl-3 ml-1">
                        <TouchableOpacity 
                          activeOpacity={0.7} 
                          onPress={handleUndo} 
                          disabled={historyStep <= 0}
                          className={`w-8 h-8 rounded-full items-center justify-center ${historyStep > 0 ? 'bg-[#FFF4E5] border border-[#FFDDAA]' : 'bg-[#F9F9F9]'}`}
                        >
                          <FontAwesome5 name="undo-alt" size={12} color={historyStep > 0 ? "#D47B00" : "#D7D7D7"} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          activeOpacity={0.7} 
                          onPress={handleRedo} 
                          disabled={historyStep >= bankHistory.length - 1}
                          className={`w-8 h-8 rounded-full items-center justify-center ${historyStep < bankHistory.length - 1 ? 'bg-[#FFF4E5] border border-[#FFDDAA]' : 'bg-[#F9F9F9]'}`}
                        >
                          <FontAwesome5 name="redo-alt" size={12} color={historyStep < bankHistory.length - 1 ? "#D47B00" : "#D7D7D7"} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setIsBankSelectionMode(!isBankSelectionMode);
                      if (isBankSelectionMode) setSelectedBankQuestions({}); 
                    }}
                    className={`px-3 py-1.5 rounded-full border flex-row items-center ${isBankSelectionMode ? 'bg-[#FFF4E5] border-[#FFDDAA]' : 'bg-white border-[#EFE8D6]'}`}
                  >
                    <FontAwesome5 name={isBankSelectionMode ? "times" : "tasks"} size={12} color={isBankSelectionMode ? "#FF4B4B" : "#D47B00"} />
                    <Text className={`text-[12px] ml-1.5 pt-0.5 ${isBankSelectionMode ? 'text-[#FF4B4B]' : 'text-[#D47B00]'}`} style={{ fontFamily: 'BanglaBold' }}>
                      {isBankSelectionMode ? 'ক্যানসেল' : 'সিলেক্ট করুন'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 🚀 FlatList দিয়ে পারফরম্যান্স অপ্টিমাইজড রেন্ডারিং (Map এর বদলে)[cite: 2] */}
                <FlatList
                  data={filteredQuestions}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={10}
                  ListEmptyComponent={
                    <View className="items-center justify-center py-10 mt-10">
                      <FontAwesome5 name="search-minus" size={40} color="#EAE4D4" />
                      <Text className="text-[#827B6E] text-[15px] mt-4" style={{ fontFamily: 'BanglaBold' }}>কোনো প্রশ্ন পাওয়া যায়নি</Text>
                    </View>
                  }
                  renderItem={({ item: q }) => {
                    const isSelected = selectedBankQuestions[q.id];
                    return (
                      <TouchableOpacity 
                        activeOpacity={isBankSelectionMode ? 0.7 : 1}
                        onPress={() => isBankSelectionMode && toggleSelection(q.id)}
                        className={`bg-white p-4 rounded-[16px] mb-3 border shadow-sm flex-row items-center justify-between ${isSelected ? 'border-[#58A700] bg-[#EAF2D7]' : 'border-[#EFE8D6]'}`}
                      >
                        {isBankSelectionMode && (
                          <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${isSelected ? 'bg-[#58A700] border-[#58A700]' : 'bg-white border-[#D7D7D7]'}`}>
                            {isSelected && <FontAwesome5 name="check" size={10} color="#FFF" />}
                          </View>
                        )}
                        
                 <View className="flex-1 pr-3">
                          <View className="bg-[#1CB0F6]/10 self-start px-2 py-0.5 rounded border border-[#1CB0F6]/30 mb-1.5">
                            <Text className="text-[10px] text-[#1899D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{q.type} • {q.topic}</Text>
                          </View>
                          <Text className="text-[#3D382F] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>
                            {q.question === "প্রশ্ন পাওয়া যায়নি" ? (q.stem || q.question) : (q.question || q.stem)}
                          </Text>

                      {/* 🚀 চিত্র প্লেসহোল্ডার / ইমেজ রেন্ডার (শুধু এডিট মোডে) */}
                          {q.image ? (
                            <View className="mt-3 relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[#E5E5E5]">
                              <Image source={{ uri: q.image }} className="w-full h-full bg-[#F9F9F9]" resizeMode="contain" />
                              {!isBankSelectionMode && (
                                <TouchableOpacity activeOpacity={0.8} onPress={() => pickQuestionImage(q.id)} className="absolute bottom-2 right-2 bg-black/60 px-3 py-1.5 rounded-lg flex-row items-center backdrop-blur-md">
                                  {uploadingImageQId === q.id ? <ActivityIndicator size="small" color="#FFF" /> : <><FontAwesome5 name="camera" size={10} color="#FFF" /><Text className="text-white text-[11px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>পরিবর্তন</Text></>}
                                </TouchableOpacity>
                              )}
                            </View>
                        ) : q.needsImage ? (
                            <View className="mt-3">
                              {!isBankSelectionMode && (
                                <View className="bg-[#1073A4]/10 self-start px-3 py-2 rounded-full border border-[#1073A4]/30 mb-2 flex-row items-center">
                                  <FontAwesome5 name="search" size={11} color="#1073A4" />
                                  <Text className="text-[#1073A4] text-[12px] pt-0.5 ml-2" style={{ fontFamily: 'BanglaBold' }}>
                                    সোর্স বইতে খুঁজুন: {q.imageHint || 'এই প্রশ্নটি'}
                                  </Text>
                                </View>
                              )}
                              <TouchableOpacity activeOpacity={0.8} onPress={() => !isBankSelectionMode && pickQuestionImage(q.id)} className="w-full aspect-[16/9] rounded-xl border-2 border-[#FFDDAA] border-dashed bg-[#FFF4E5] items-center justify-center">
                                {uploadingImageQId === q.id ? (
                                  <ActivityIndicator size="large" color="#FF9600" />
                                ) : (
                             <>
                                    <FontAwesome5 name="image" size={24} color="#D47B00" />
                                    <Text className="text-[#D47B00] text-[13px] mt-3 pt-1" style={{ fontFamily: 'BanglaBold' }}>চিত্র যুক্ত করুন (16:9)</Text>
                                    <Text className="text-[#D47B00]/70 text-[11px] mt-1" style={{ fontFamily: 'BanglaRegular' }}>এই প্রশ্নে একটি চিত্র প্রয়োজন</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            </View>
                          ) : (
                            /* 🚀 ম্যানুয়াল ওভাররাইড: এআই ভুলে গেলেও ইউজার নিজে চিত্র প্লেসহোল্ডার আনতে পারবে */
                            !isBankSelectionMode && (
                              <TouchableOpacity 
                                activeOpacity={0.8} 
                                onPress={() => {
                                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                  const updatedQuestions = allQuestions.map(item => item.id === q.id ? { ...item, needsImage: true } : item);
                                  const newHistory = bankHistory.slice(0, historyStep + 1);
                                  newHistory.push(updatedQuestions);
                                  setBankHistory(newHistory);
                                  setHistoryStep(newHistory.length - 1);
                                  updateBankWithQuestions(updatedQuestions);
                                }} 
                                className="mt-3 bg-[#F9F9F9] py-2 rounded-xl border border-[#E5E5E5] items-center flex-row justify-center border-dashed"
                              >
                                <FontAwesome5 name="plus-circle" size={12} color="#AFAFAF" />
                                <Text className="text-[#777777] text-[12px] pt-0.5 ml-2" style={{ fontFamily: 'BanglaBold' }}>চিত্র প্লেসহোল্ডার যুক্ত করুন</Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                        
                   {/* 🚀 সিঙ্গেল ডিলিট বাটন (যদি সিলেক্ট মোড অফ থাকে)[cite: 1] */}
                      {!isBankSelectionMode && (
                          <TouchableOpacity activeOpacity={0.7} onPress={() => {
                            Alert.alert("মুছে ফেলুন", "এই প্রশ্নটি কি মুছে ফেলতে চান?", [
                              { text: "না", style: "cancel" },
                              { text: "হ্যাঁ", style: "destructive", onPress: async () => {
                                  const updatedQuestions = allQuestions.filter(item => item.id !== q.id);
                                  
                                  // 🚀 হিস্ট্রি সেভ করা হচ্ছে (যাতে আনডু করা যায়)
                                  const newHistory = bankHistory.slice(0, historyStep + 1);
                                  newHistory.push(updatedQuestions);
                                  setBankHistory(newHistory);
                                  setHistoryStep(newHistory.length - 1);

                                  // 🚀 Fix 3: Use updateBankWithQuestions to properly handle both normal and special banks
                                  await updateBankWithQuestions(updatedQuestions);
                              }}
                            ]);
                          }} className="w-8 h-8 rounded-full bg-[#FFF4E5] border border-[#FFDDAA] items-center justify-center">
                            <FontAwesome5 name="trash" size={10} color="#FF4B4B" />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />

                {/* 🚀 ফ্লোটিং বাল্ক ডিলিট বাটন (শুধুমাত্র যদি কোনো আইটেম সিলেক্ট করা থাকে) */}
                {selectedCount > 0 && (
                  <View className="absolute bottom-6 left-5 right-5">
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={handleBulkDelete}
                      className="bg-[#FF4B4B] w-full py-4 rounded-[16px] items-center flex-row justify-center shadow-lg border-2 border-[#D63939]"
                    >
                      <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
                      <Text className="text-white text-[16px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                        {selectedCount} টি প্রশ্ন ডিলিট করুন
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
             </>
            );
          })()}
        </View>
      </Modal>

 {/* 🚀 ৪. নতুন কুইজ তৈরির মডাল (Creator Only) */}
      <Modal visible={isQuizCreateModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsQuizCreateModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#FFFDF8] rounded-t-[32px] p-6 pt-5 w-full max-h-[85%]">
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mb-5" />
            <View className="flex-row justify-between items-center mb-4 border-b border-[#EFE8D6] pb-3">
              <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>নতুন কুইজ সেটআপ</Text>
              <TouchableOpacity onPress={() => setIsQuizCreateModalVisible(false)} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কুইজের ব্যানার (16:9)</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={pickQuizBanner} className="mb-5">
                <View className="w-full aspect-[16/9] rounded-[16px] overflow-hidden border-2 border-[#EFE8D6] border-dashed bg-[#F5F5F5] items-center justify-center relative shadow-sm">
                  {quizBanner ? (
                    <Image source={{ uri: quizBanner }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="items-center">
                      <FontAwesome5 name="image" size={32} color="#D7D7D7" />
                      <Text className="text-[#AFAFAF] text-[12px] mt-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ব্যানার সিলেক্ট করুন</Text>
                    </View>
                  )}
                  {isQuizImageUploading && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="large" color="#FF9600" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

         <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কুইজের নাম</Text>
              <TextInput
                className="bg-white p-4 rounded-[16px] text-[16px] text-[#3D382F] mb-5 border border-[#EFE8D6]"
                style={{ fontFamily: 'BanglaBold' }}
                placeholder="যেমন: Weekly Model Test 1"
                value={quizTitle}
                onChangeText={setQuizTitle}
              />

              <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কতক্ষণ লাইভ থাকবে? (মিনিটে)</Text>
              <TextInput
                className="bg-white p-4 rounded-[16px] text-[16px] text-[#3D382F] mb-5 border border-[#EFE8D6]"
                style={{ fontFamily: 'BanglaBold' }}
                placeholder="যেমন: 60"
                keyboardType="numeric"
                value={quizLiveDuration}
                onChangeText={setQuizLiveDuration}
              />

           <View className="flex-row space-x-3 mb-5">
                <View className="flex-1">
                  <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>তারিখ</Text>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)} className="bg-white p-4 rounded-[16px] border border-[#EFE8D6] items-center">
                    <Text className="text-[#3D382F] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>
                      {quizTimestamp ? formatBnDate(quizTimestamp) : 'তারিখ বাছুন'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>সময়</Text>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTimePicker(true)} className="bg-white p-4 rounded-[16px] border border-[#EFE8D6] items-center">
                    <Text className="text-[#3D382F] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>
                      {quizTimestamp ? formatBnTime(quizTimestamp) : 'সময় বাছুন'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🚀 Date & Time Picker Triggers */}
              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const newTime = selectedDate;
                      setTempDate(newTime);
                      setQuizTimestamp(newTime.getTime());
                    }
                  }}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);
                    if (selectedDate) {
                      const newTime = selectedDate;
                      setTempDate(newTime);
                      setQuizTimestamp(newTime.getTime());
                    }
                  }}
                />
              )}

              <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>রিসোর্স ফিল্টার (সিলেবাস)</Text>
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setIsResourcePickerVisible(true)}
                className={`p-4 rounded-[16px] border flex-row justify-between items-center mb-6 border-dashed ${quizSelectedRules.length > 0 ? 'bg-[#EAF2D7] border-[#8BA85E]' : 'bg-[#FDF6E3] border-[#FFDDAA]'}`}
              >
                <Text className={`text-[14px] pt-1 ${quizSelectedRules.length > 0 ? 'text-[#4A632D]' : 'text-[#D47B00]'}`} style={{ fontFamily: 'BanglaBold' }}>
                  {quizSelectedRules.length > 0 ? `${quizSelectedRules.length} টি প্যাক থেকে ফিল্টারড` : 'সিলেবাস ও ফিল্টার সিলেক্ট করুন'}
                </Text>
                <FontAwesome5 name={quizSelectedRules.length > 0 ? "check-circle" : "chevron-right"} size={14} color={quizSelectedRules.length > 0 ? "#58A700" : "#D47B00"} />
              </TouchableOpacity>

              {/* 🚀 AI MCQ Generator (Creator Side) */}
              <View className="bg-[#FFFDF8] border-2 border-[#EFE8D6] rounded-[24px] p-5 mb-5 shadow-sm">
                <View className="items-center mb-4">
                  <View className="w-14 h-14 bg-[#1899D6]/10 rounded-full items-center justify-center mb-3 border border-[#1899D6]/20">
                    <FontAwesome5 name="robot" size={24} color="#1899D6" />
                  </View>
                  <Text className="text-[17px] text-[#3D382F] mb-1" style={{ fontFamily: 'BanglaBold' }}>AI এমসিকিউ জেনারেটর</Text>
                  <Text className="text-[12px] text-[#827B6E] text-center px-2 leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                    নিচের বাটনে ক্লিক করে প্রম্পট কপি করুন এবং ChatGPT বা Claude-এ পেস্ট করে JSON রেসপন্স এখানে দিন।
                  </Text>
                </View>

                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={handleCreatorCopyAIPrompt} 
                  className="bg-[#1899D6] w-full py-3.5 rounded-[16px] flex-row justify-center items-center shadow-sm mb-5"
                >
                  <FontAwesome5 name="copy" size={14} color="#FFFFFF" />
                  <Text className="text-white text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>AI এর জন্য প্রম্পট কপি করুন</Text>
                </TouchableOpacity>

            {tempGeneratedQuestions.length > 0 ? (
                  <View className="bg-[#EAF2D7] p-4 rounded-xl border border-[#8BA85E] flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 pr-2">
                      <FontAwesome5 name="check-circle" size={16} color="#58A700" />
                      <Text className="text-[#4A632D] text-[14px] pt-0.5 ml-2" style={{ fontFamily: 'BanglaBold' }}>{tempGeneratedQuestions.length} টি প্রশ্ন সেট করা আছে</Text>
                    </View>
                    
                    <View className="flex-row space-x-2">
                      {/* 🚀 প্রশ্ন এডিট করার বাটন (টেক্সটবক্স আবার নিয়ে আসবে) */}
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setQuizJsonInput(JSON.stringify(tempGeneratedQuestions, null, 2));
                          setTempGeneratedQuestions([]);
                        }} 
                        className="bg-white w-9 h-9 rounded-full items-center justify-center border border-[#8BA85E]"
                      >
                        <FontAwesome5 name="pen" size={12} color="#58A700" />
                      </TouchableOpacity>

                      {/* 🚀 প্রশ্ন পুরোপুরি ডিলিট করার বাটন */}
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setTempGeneratedQuestions([]);
                          setQuizJsonInput('');
                        }} 
                        className="bg-[#FFF4E5] w-9 h-9 rounded-full items-center justify-center border border-[#FFDDAA]"
                      >
                        <FontAwesome5 name="trash" size={12} color="#FF4B4B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
              <>
                    <Text className="text-[#AFAFAF] text-[12px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>AI এর রেসপন্স পেস্ট করুন:</Text>
                    <TextInput
                      className="bg-white p-3 rounded-xl text-[13px] text-[#3D382F] min-h-[100px] border border-[#EFE8D6] mb-3"
                      style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                      placeholder="AI-র দেওয়া প্রশ্নগুলো এখানে পেস্ট করুন..."
                      multiline
                      value={quizJsonInput}
                      onChangeText={setQuizJsonInput}
                    />
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={handleCreatorParseQuizJson}
                      disabled={!quizJsonInput.trim()}
                      className={`w-full py-3 rounded-[12px] items-center ${quizJsonInput.trim() ? 'bg-[#58A700]' : 'bg-[#EAE4D4]'}`}
                    >
                      <Text className={`text-[14px] pt-0.5 ${quizJsonInput.trim() ? 'text-white' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                        কোশ্চেন পার্স করুন
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>

      <TouchableOpacity 
              activeOpacity={0.8}
              disabled={isQuizImageUploading}
              onPress={async () => {
                if (!quizTitle) return Alert.alert("সতর্কতা", "কুইজের নাম দিন!");

       const quizDataObj = {
                  _id: editingQuizId || 'quiz_' + Date.now(),
                  id: editingQuizId || 'quiz_' + Date.now(),
                  title: quizTitle,
                  banner: quizBanner || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000',
                  dateText: quizTimestamp ? formatBnDate(quizTimestamp) : 'শীঘ্রই',
                  timeText: quizTimestamp ? formatBnTime(quizTimestamp) : '--:--',
                  targetTimestamp: quizTimestamp || null,
                  target: lessonItem?.niche || 'এইচএসসি (HSC)', // 🚀 কুইজে কমিউনিটির টার্গেট ট্যাগ যুক্ত করা হলো!
                  liveDuration: Number(quizLiveDuration) || 60, // 🚀 কাস্টম লাইভ ডিউরেশন
                  isReady: tempGeneratedQuestions.length > 0, 
                  resources: quizSelectedRules,
                  questions: tempGeneratedQuestions 
                };

                // 🚀 এডিট নাকি নতুন কুইজ সেটা চেক করে স্টেটে আপডেট করা
                if (editingQuizId) {
                  setCommunityQuizzes(prev => prev.map(q => (q._id || q.id) === editingQuizId ? quizDataObj : q));
                } else {
                  setCommunityQuizzes(prev => [quizDataObj, ...prev]);
                }
                
                setIsQuizCreateModalVisible(false);
                
                // 🚀 স্টেট রিসেট
                setQuizTitle('');
                setQuizBanner('');
                setQuizDate('');
                setQuizTime('');
                setquizSelectedRules([]);
                setEditingQuizId(null); // 🚀 আইডি ক্লিয়ার করা হলো

        try {
                  await fetch('https://growshelby-api.vercel.app/api/update_coins', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
                    body: JSON.stringify({ 
                      action: editingQuizId ? 'update_quiz' : 'create_quiz', 
                      channelId: currentUserEmail, // 🚀 সবসময় নিজের (Master) অ্যাকাউন্টে সেভ হবে
                      quizId: editingQuizId, // 🚀 আপডেটের জন্য আইডি পাস করা
                      quizData: quizDataObj 
                    })
                  });
                } catch(e) { console.log(e); }
              }}
              className={`${isQuizImageUploading ? 'bg-[#EAE4D4]' : 'bg-[#1899D6]'} py-4 mt-2 rounded-[16px] items-center shadow-sm`}
            >
              <Text style={{ fontFamily: 'BanglaBold' }} className={`${isQuizImageUploading ? 'text-[#827B6E]' : 'text-white'} text-[16px] pt-1`}>
                {isQuizImageUploading ? 'ব্যানার আপলোড হচ্ছে...' : (editingQuizId ? 'কুইজ আপডেট করুন' : 'কুইজ সেভ করুন')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

{/* 🚀 ৫. Smart Resource Picker (Accordion Style) */}
      <Modal visible={isResourcePickerVisible} animationType="fade" transparent={true} onRequestClose={() => setIsResourcePickerVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#FFFDF8] rounded-t-[32px] p-5 pt-3 w-full h-[85%] shadow-lg border-t-4 border-[#EFE8D6] flex flex-col">
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mb-5" />
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-[#EFE8D6]">
              <Text className="text-[17px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>সিলেবাস ও ফিল্টার</Text>
              <TouchableOpacity onPress={() => setIsResourcePickerVisible(false)} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            {/* Segmented Tab Switcher */}
            <View className="mb-4">
              <View className="flex-row bg-[#EAE4D4] p-1.5 rounded-[20px]">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setResourcePickerTab('main'); }}
                  className={`flex-1 items-center justify-center py-2.5 rounded-[16px] border-2 ${resourcePickerTab === 'main' ? 'bg-[#1CB0F6] border-[#1899D6] border-b-[4px]' : 'border-transparent'}`}
                >
                  <Text className={`text-[14px] pt-1 ${resourcePickerTab === 'main' ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>মেইন প্যাক</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setResourcePickerTab('special'); }}
                  className={`flex-1 items-center justify-center py-2.5 rounded-[16px] border-2 ${resourcePickerTab === 'special' ? 'bg-white border-[#D7D7D7] border-b-[4px]' : 'border-transparent'}`}
                >
                  <Text className={`text-[14px] pt-1 ${resourcePickerTab === 'special' ? 'text-[#3D382F]' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>CA স্পেশাল 🌟</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(() => {
              // 🚀 Inline Special Toggles
              const toggleSpecialRuleArray = (group, bank, arrayName, value) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setquizSelectedRules(prev => {
                  let newRules = [...prev];
                  const ruleId = `special_${group.communityId}_${bank.bankId}`;
                  let ruleIdx = newRules.findIndex(r => r.guideId === ruleId);
                  if (ruleIdx === -1) {
                    newRules.push({
                      sourceType: 'special', guideId: ruleId, guideShareCode: group.guideId, communityId: group.communityId,
                      bankId: bank.bankId, bankName: bank.bankName, communityName: group.communityName,
                      allowedTypes: arrayName === 'types' ? [value] : [], allowedTopics: arrayName === 'topics' ? [value] : []
                    });
                  } else {
                    let targetArray = [...newRules[ruleIdx][arrayName === 'types' ? 'allowedTypes' : 'allowedTopics']];
                    if (targetArray.includes(value)) targetArray = targetArray.filter(v => v !== value);
                    else targetArray.push(value);
                    newRules[ruleIdx] = { ...newRules[ruleIdx], [arrayName === 'types' ? 'allowedTypes' : 'allowedTopics']: targetArray };
                  }
                  return newRules;
                });
              };

              const toggleSpecialBank = (group, bank) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setquizSelectedRules(prev => {
                  const ruleId = `special_${group.communityId}_${bank.bankId}`;
                  if (prev.some(r => r.guideId === ruleId)) {
                    return prev.filter(r => r.guideId !== ruleId);
                  } else {
                    return [...prev, {
                      sourceType: 'special', guideId: ruleId, guideShareCode: group.guideId, communityId: group.communityId,
                      bankId: bank.bankId, bankName: bank.bankName, communityName: group.communityName, allowedTypes: [], allowedTopics: []
                    }];
                  }
                });
              };

              return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} className="flex-1">
                  {resourcePickerTab === 'main' ? (
                    channelGuides.length > 0 ? (
                      channelGuides.map((guide, idx) => {
                        let uniqueTypes = new Set();
                        let uniqueTopics = new Set();
                        if (guide.failedItems) {
                          guide.failedItems.forEach(bank => {
                            if (bank.questions) {
                              bank.questions.forEach(q => {
                                if (q.type) uniqueTypes.add(q.type);
                                if (q.topic) uniqueTopics.add(q.topic);
                              });
                            }
                          });
                        }
                        const typesArr = Array.from(uniqueTypes);
                        const topicsArr = Array.from(uniqueTopics);
                        const isExpanded = expandedResourceGuide === guide.id;
                        let currentRule = quizSelectedRules.find(r => r.guideId === guide.id);
                        const isSelected = !!currentRule;
                        
                        const toggleRuleArray = (arrayName, value) => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setquizSelectedRules(prev => {
                            let newRules = [...prev];
                            let ruleIdx = newRules.findIndex(r => r.guideId === guide.id);
                            if (ruleIdx === -1) {
                              newRules.push({ guideId: guide.id, allowedTypes: arrayName === 'types' ? [value] : [], allowedTopics: arrayName === 'topics' ? [value] : [] });
                            } else {
                              let targetArray = [...newRules[ruleIdx][arrayName === 'types' ? 'allowedTypes' : 'allowedTopics']];
                              if (targetArray.includes(value)) targetArray = targetArray.filter(v => v !== value);
                              else targetArray.push(value);
                              newRules[ruleIdx] = { ...newRules[ruleIdx], [arrayName === 'types' ? 'allowedTypes' : 'allowedTopics']: targetArray };
                              
                              if (newRules[ruleIdx].allowedTypes.length === 0 && newRules[ruleIdx].allowedTopics.length === 0) {
                                 newRules.splice(ruleIdx, 1);
                              }
                            }
                            return newRules;
                          });
                        };

                        return (
                          <View key={idx} className={`mb-3 rounded-[20px] border overflow-hidden ${isSelected ? 'border-[#8BA85E]' : 'border-[#EFE8D6]'}`}>
                            <TouchableOpacity 
                              activeOpacity={0.8}
                              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedResourceGuide(isExpanded ? null : guide.id); }}
                              className={`flex-row items-center p-4 ${isSelected ? 'bg-[#EAF2D7]' : 'bg-white'}`}
                            >
                              <View className="flex-1">
                                <Text className={`text-[16px] ${isSelected ? 'text-[#4A632D]' : 'text-[#3D382F]'}`} style={{ fontFamily: 'BanglaBold' }}>{guide.notebookName}</Text>
                                <Text className={`text-[12px] mt-0.5 ${isSelected ? 'text-[#6B8544]' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaRegular' }}>ট্যাপ করে নির্দিষ্ট টপিক ফিল্টার করুন</Text>
                              </View>
                              <FontAwesome5 name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={isSelected ? "#58A700" : "#AFAFAF"} />
                            </TouchableOpacity>
                            {isExpanded && (
                              <View className="bg-[#FFFDF8] p-4 border-t border-[#EFE8D6]">
                                {typesArr.length > 0 && (
                                  <>
                                    <Text className="text-[#AFAFAF] text-[12px] mb-2" style={{ fontFamily: 'BanglaBold' }}>প্রশ্নের ধরন:</Text>
                                    <View className="flex-row flex-wrap mb-4">
                                      {typesArr.map(type => {
                                        const isActive = currentRule?.allowedTypes.includes(type);
                                        return (
                                          <TouchableOpacity 
                                            key={type} activeOpacity={0.7} onPress={() => toggleRuleArray('types', type)}
                                            className={`mr-2 mb-2 px-4 py-2 rounded-full border-2 ${isActive ? 'bg-[#1899D6] border-[#1073A4]' : 'bg-white border-[#EFE8D6]'}`}
                                          >
                                            <Text className={`text-[13px] pt-0.5 ${isActive ? 'text-white' : 'text-[#6B655B]'}`} style={{ fontFamily: 'BanglaBold' }}>{type}</Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  </>
                                )}
                                {topicsArr.length > 0 && (
                                  <>
                                    <Text className="text-[#AFAFAF] text-[12px] mb-2" style={{ fontFamily: 'BanglaBold' }}>অধ্যায় / টপিক:</Text>
                                    <View className="flex-row flex-wrap">
                                      {topicsArr.map(topic => {
                                        const isActive = currentRule?.allowedTopics.includes(topic);
                                        return (
                                          <TouchableOpacity 
                                            key={topic} activeOpacity={0.7} onPress={() => toggleRuleArray('topics', topic)}
                                            className={`mr-2 mb-2 px-4 py-2 rounded-full border-2 ${isActive ? 'bg-[#FF9600] border-[#D47B00]' : 'bg-white border-[#EFE8D6]'}`}
                                          >
                                            <Text className={`text-[13px] pt-0.5 ${isActive ? 'text-white' : 'text-[#6B655B]'}`} style={{ fontFamily: 'BanglaBold' }}>{topic}</Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  </>
                                )}
                                {(typesArr.length === 0 && topicsArr.length === 0) && (
                                  <Text className="text-[#AFAFAF] text-[13px]" style={{ fontFamily: 'BanglaRegular' }}>এই প্যাকে ফিল্টার করার মতো কোনো টপিক নেই।</Text>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <View className="items-center py-10">
                        <Text className="text-[#827B6E] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>কোনো স্টাডি প্যাক পাওয়া যায়নি</Text>
                      </View>
                    )
                  ) : (
                    isSpecialPickerLoading ? (
                      <View>
                        <BankCardSkeleton />
                        <BankCardSkeleton />
                      </View>
                    ) : specialPickerGroups.length === 0 ? (
                      <View className="items-center justify-center py-10 px-6 bg-[#FDF6E3] rounded-2xl border-2 border-dashed border-[#FFDDAA]">
                        <Text className="text-[#D47B00] text-[14px] text-center" style={{ fontFamily: 'BanglaBold' }}>এখনো কোনো CA স্পেশাল সাজেশন আপলোড করেনি</Text>
                      </View>
                    ) : (
                      specialPickerGroups.map((group, gIdx) => (
                        <View key={gIdx} className="mb-6">
                          <View className="flex-row items-center mb-3">
                            <View className="bg-[#1899D6]/10 px-3 py-1.5 rounded-full border border-[#1899D6]/30 flex-row items-center">
                              <FontAwesome5 name="users" size={10} color="#1899D6" />
                              <Text className="text-[#1899D6] text-[12px] pt-0.5 ml-1.5" style={{ fontFamily: 'BanglaBold' }}>{group.communityName}</Text>
                            </View>
                            <Text className="text-[#AFAFAF] text-[12px] pt-1 ml-3" style={{ fontFamily: 'BanglaRegular' }}>{group.creatorName}</Text>
                          </View>
                          {group.banks.map(bank => {
                            const ruleId = `special_${group.communityId}_${bank.bankId}`;
                            const currentRule = quizSelectedRules.find(r => r.guideId === ruleId);
                            const isSelected = !!currentRule;
                            const isExpanded = expandedSpecialBankKey === ruleId;

                            let uniqueTypes = new Set();
                            let uniqueTopics = new Set();
                            if (bank.questions) {
                              bank.questions.forEach(q => {
                                if (q.type) uniqueTypes.add(q.type);
                                if (q.topic) uniqueTopics.add(q.topic);
                              });
                            }
                            const typesArr = Array.from(uniqueTypes);
                            const topicsArr = Array.from(uniqueTopics);

                            return (
                              <View key={bank.bankId} className={`mb-3 rounded-[20px] border-2 border-b-[4px] overflow-hidden ${isSelected ? 'border-[#8BA85E] bg-[#EAF2D7]' : 'border-[#EFE8D6] bg-white'}`}>
                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() => {
                                     if (isSelected) {
                                         LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                         setExpandedSpecialBankKey(isExpanded ? null : ruleId);
                                     } else {
                                        toggleSpecialBank(group, bank);
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setExpandedSpecialBankKey(ruleId);
                                     }
                                  }}
                                  className="flex-row items-center p-4"
                                >
                                  <View className="flex-1 pr-3">
                                    <Text className={`text-[16px] leading-[22px] ${isSelected ? 'text-[#4A632D]' : 'text-[#3D382F]'}`} style={{ fontFamily: 'BanglaBold' }}>{bank.bankName}</Text>
                                    <View className="flex-row items-center mt-1">
                                      <View className={`px-2 py-0.5 rounded ${isSelected ? 'bg-[#58A700]/10 border border-[#58A700]/30' : 'bg-[#EAE4D4]'}`}>
                                        <Text className={`text-[10px] pt-0.5 ${isSelected ? 'text-[#4A632D]' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>{bank.questions?.length || 0} টি প্রশ্ন</Text>
                                      </View>
                                    </View>
                                  </View>

                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => toggleSpecialBank(group, bank)}
                                    className={`w-8 h-8 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-[#58A700] border-[#58A700]' : 'bg-[#F9F9F9] border-[#D7D7D7]'}`}
                                  >
                                    {isSelected && <FontAwesome5 name="check" size={12} color="#FFF" />}
                                  </TouchableOpacity>
                                </TouchableOpacity>

                                {isExpanded && isSelected && (
                                  <View className="p-4 border-t border-[#8BA85E]/30 bg-[#FFFDF8]">
                                    {typesArr.length > 0 && (
                                      <>
                                        <Text className="text-[#6B8544] text-[12px] mb-2" style={{ fontFamily: 'BanglaBold' }}>প্রশ্নের ধরন (ঐচ্ছিক):</Text>
                                        <View className="flex-row flex-wrap mb-4">
                                          {typesArr.map(type => {
                                            const isActive = currentRule?.allowedTypes?.includes(type);
                                            return (
                                              <TouchableOpacity
                                                key={type} activeOpacity={0.7} onPress={() => toggleSpecialRuleArray(group, bank, 'types', type)}
                                                className={`mr-2 mb-2 px-3 py-1.5 rounded-full border-2 ${isActive ? 'bg-[#1899D6] border-[#1073A4]' : 'bg-white border-[#EFE8D6]'}`}
                                              >
                                                <Text className={`text-[12px] pt-0.5 ${isActive ? 'text-white' : 'text-[#6B655B]'}`} style={{ fontFamily: 'BanglaBold' }}>{type}</Text>
                                              </TouchableOpacity>
                                            );
                                          })}
                                        </View>
                                      </>
                                    )}
                                    {topicsArr.length > 0 && (
                                      <>
                                        <Text className="text-[#6B8544] text-[12px] mb-2" style={{ fontFamily: 'BanglaBold' }}>অধ্যায় / টপিক (ঐচ্ছিক):</Text>
                                        <View className="flex-row flex-wrap">
                                          {topicsArr.map(topic => {
                                            const isActive = currentRule?.allowedTopics?.includes(topic);
                                            return (
                                              <TouchableOpacity
                                                key={topic} activeOpacity={0.7} onPress={() => toggleSpecialRuleArray(group, bank, 'topics', topic)}
                                                className={`mr-2 mb-2 px-3 py-1.5 rounded-full border-2 ${isActive ? 'bg-[#FF9600] border-[#D47B00]' : 'bg-white border-[#EFE8D6]'}`}
                                              >
                                                <Text className={`text-[12px] pt-0.5 ${isActive ? 'text-white' : 'text-[#6B655B]'}`} style={{ fontFamily: 'BanglaBold' }}>{topic}</Text>
                                              </TouchableOpacity>
                                            );
                                          })}
                                        </View>
                                      </>
                                    )}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ))
                    )
                  )}
                </ScrollView>
              );
            })()}

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setIsResourcePickerVisible(false)}
              className="bg-[#58A700] py-4 rounded-[16px] items-center shadow-sm"
            >
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-[16px] pt-1">কনফার্ম করুন ({quizSelectedRules.length} টি প্যাক)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
    {/* ==========================================================
          🚀 Smart Live Quiz Engine Modal (Vibe Coder AI Integration)
          ========================================================== */}
      <Modal visible={isLiveQuizModalVisible} animationType="slide" presentationStyle="overFullScreen" statusBarTranslucent={true} onRequestClose={() => setIsLiveQuizModalVisible(false)}>
        <View className="flex-1 bg-[#FDF6E3]">
          {/* Header */}
          <View style={{ paddingTop: Math.max(insets.top, 15) }} className="px-5 pb-3 bg-[#FFFDF8] border-b border-[#EFE8D6] flex-row justify-between items-center shadow-sm">
            <TouchableOpacity onPress={() => setIsLiveQuizModalVisible(false)} className="bg-[#EAE4D4] w-10 h-10 rounded-full items-center justify-center">
              <FontAwesome5 name="times" size={16} color="#6B655B" />
            </TouchableOpacity>
            <Text className="text-[18px] text-[#3D382F] pt-1 flex-1 text-center px-2" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
              {liveQuizActiveQuiz?.title}
            </Text>
            
            {/* 🚀 Dynamic Timer UI */}
            {parsedQuizData && !isQuizFinished ? (
              <View className="bg-[#FFF4E5] px-3 py-1.5 rounded-full border border-[#FFDDAA] flex-row items-center">
                <FontAwesome5 name="clock" size={12} color="#D47B00" />
                <Text className="text-[#D47B00] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                  {formatQuizTime(quizTimeLeft)}
                </Text>
              </View>
            ) : (
              <View className="w-10 h-10" />
            )}
          </View>

      {/* Body */}
          <View className="flex-1 px-5 pt-5">
            {parsedQuizData && !isQuizFinished ? (
              // 🚀 STEP 1: One-Question-at-a-Time UI
              <View className="flex-1">
                {/* Progress Bar */}
                <View className="flex-row items-center justify-between mb-2 px-1">
                  <Text className="text-[#827B6E] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>প্রশ্ন {currentQuizIndex + 1} / {parsedQuizData.length}</Text>
                  <Text className="text-[#1899D6] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>{Math.round(((currentQuizIndex + 1) / parsedQuizData.length) * 100)}%</Text>
                </View>
                <View className="w-full h-2.5 bg-[#EAE4D4] rounded-full mb-6 overflow-hidden">
                  <View className="h-full bg-[#1899D6]" style={{ width: `${((currentQuizIndex + 1) / parsedQuizData.length) * 100}%` }} />
                </View>

                {/* Question */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                  <Text className="text-[#3D382F] text-[19px] leading-[30px] mb-6 px-1" style={{ fontFamily: 'BanglaBold' }}>
                    {parsedQuizData[currentQuizIndex].question}
                  </Text>

                  {/* Options */}
                  {parsedQuizData[currentQuizIndex].options.map((opt, idx) => {
                    const isSelected = quizAnswers[currentQuizIndex] === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => handleQuizOptionSelect(idx)}
                        className={`flex-row items-center p-4 rounded-[16px] mb-3 border-2 shadow-sm ${isSelected ? 'bg-[#EAF2D7] border-[#8BA85E]' : 'bg-white border-[#EFE8D6]'}`}
                      >
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 border-2 ${isSelected ? 'bg-[#58A700] border-[#58A700]' : 'bg-[#F9F9F9] border-[#EFE8D6]'}`}>
                          <Text className={`text-[14px] pt-1 ${isSelected ? 'text-white' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>
                            {String.fromCharCode(2453 + idx)}
                          </Text>
                        </View>
                        <Text className={`flex-1 text-[16px] pt-1 leading-6 ${isSelected ? 'text-[#4A632D]' : 'text-[#5C5549]'}`} style={{ fontFamily: isSelected ? 'BanglaBold' : 'BanglaRegular' }}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Action Footer */}
                <View className="absolute bottom-6 w-full flex-row space-x-3 bg-[#FDF6E3] pt-4">
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={handleNextQuestion}
                    className="flex-1 bg-[#FFF4E5] py-4 rounded-[16px] items-center border-2 border-[#FFDDAA] shadow-sm"
                  >
                    <Text className="text-[#D47B00] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>স্কিপ করুন</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    disabled={quizAnswers[currentQuizIndex] === undefined}
                    onPress={handleNextQuestion}
                    className={`flex-[2] py-4 rounded-[16px] flex-row justify-center items-center shadow-sm ${quizAnswers[currentQuizIndex] !== undefined ? 'bg-[#58CC02] border-b-[4px] border-[#58A700] active:border-b-0 active:mt-[4px]' : 'bg-[#EAE4D4]'}`}
                  >
                    <Text className={`text-[16px] pt-1 ${quizAnswers[currentQuizIndex] !== undefined ? 'text-white' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                      {currentQuizIndex === parsedQuizData.length - 1 ? 'সাবমিট করুন' : 'পরবর্তী প্রশ্ন'}
                    </Text>
                    {quizAnswers[currentQuizIndex] !== undefined && <FontAwesome5 name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // 🚀 STEP 3: Results & Smart Revision Generator
              <View className="flex-1 items-center pt-8">
                <FontAwesome5 name="trophy" size={64} color="#FF9600" solid className="mb-5" />
                <Text className="text-[26px] text-[#3D382F] mb-1" style={{ fontFamily: 'BanglaBold' }}>কুইজ শেষ!</Text>
                <Text className="text-[#827B6E] text-[15px] mb-8" style={{ fontFamily: 'BanglaRegular' }}>আপনার রেটিং ও রেজাল্ট দেখে নিন</Text>

            <View className="w-full flex-row justify-between mb-5 px-2">
                  <View className="items-center bg-[#EAF2D7] p-5 rounded-[20px] flex-1 mr-2 border border-[#8BA85E] shadow-sm">
                    <FontAwesome5 name="check-circle" size={24} color="#58A700" solid className="mb-2" />
                    <Text className="text-[#4A632D] text-[22px]" style={{ fontFamily: 'BanglaBold' }}>{quizResults?.correct}</Text>
                    <Text className="text-[#6B8544] text-[13px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সঠিক</Text>
                  </View>
                  <View className="items-center bg-[#FFF4E5] p-5 rounded-[20px] flex-1 mx-1 border border-[#FFC800] shadow-sm">
                    <FontAwesome5 name="times-circle" size={24} color="#D47B00" solid className="mb-2" />
                    <Text className="text-[#D47B00] text-[22px]" style={{ fontFamily: 'BanglaBold' }}>{quizResults?.wrong}</Text>
                    <Text className="text-[#B56A00] text-[13px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ভুল</Text>
                  </View>
                  <View className="items-center bg-[#FDF6E3] p-5 rounded-[20px] flex-1 ml-2 border border-[#EFE8D6] shadow-sm">
                    <FontAwesome5 name="minus-circle" size={24} color="#AFAFAF" solid className="mb-2" />
                    <Text className="text-[#777777] text-[22px]" style={{ fontFamily: 'BanglaBold' }}>{quizResults?.skipped}</Text>
                    <Text className="text-[#AFAFAF] text-[13px] pt-1" style={{ fontFamily: 'BanglaBold' }}>স্কিপ</Text>
                  </View>
                </View>

                {/* 🚀 Performance Time Stats */}
                <View className="w-full flex-row justify-between mb-8 px-2">
                  <View className="flex-1 bg-white p-4 rounded-[16px] border border-[#EFE8D6] shadow-sm mr-2 items-center flex-row">
                    <View className="w-10 h-10 bg-[#1899D6]/10 rounded-full items-center justify-center mr-3">
                      <FontAwesome5 name="stopwatch" size={16} color="#1899D6" />
                    </View>
                    <View>
                      <Text className="text-[#AFAFAF] text-[11px]" style={{ fontFamily: 'BanglaBold' }}>মোট সময়</Text>
                      <Text className="text-[#3D382F] text-[15px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{formatQuizTime(totalTimeTaken)} মিনিট</Text>
                    </View>
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-[16px] border border-[#EFE8D6] shadow-sm ml-2 items-center flex-row">
                    <View className="w-10 h-10 bg-[#A559D6]/10 rounded-full items-center justify-center mr-3">
                      <FontAwesome5 name="bolt" size={16} color="#A559D6" />
                    </View>
                    <View>
                      <Text className="text-[#AFAFAF] text-[11px]" style={{ fontFamily: 'BanglaBold' }}>গড় সময়/প্রশ্ন</Text>
                      <Text className="text-[#3D382F] text-[15px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{toEnglishNumber(Math.round(totalTimeTaken / quizResults?.total))} সেকেন্ড</Text>
                    </View>
                  </View>
                </View>

                {/* 🚀 স্মার্ট রিভিশন বাটন (Takes failed items and formats them to read mode) */}
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={handleCreateRevisionPack}
                  className="w-full bg-[#1899D6] py-4 rounded-[16px] flex-row justify-center items-center shadow-sm border-b-[4px] border-[#1073A4] active:border-b-0 active:mt-[4px]"
                >
                  <FontAwesome5 name="sync-alt" size={16} color="#FFFFFF" />
                  <Text className="text-white text-[16px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>
                    ভুলগুলোর রিভিশন প্যাক বানান
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setIsLiveQuizModalVisible(false)}
                  className="mt-6 py-3"
                >
                  <Text className="text-[#AFAFAF] text-[15px]" style={{ fontFamily: 'BanglaBold' }}>লবিতে ফিরে যান</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

 {/* 🚀 Quiz Action Modal (Duolingo Style) */}
      <Modal visible={!!pickedQuizForAction} transparent animationType="none" onRequestClose={() => closeQuizActionSheet()}>
        <View className="flex-1 justify-end">
          <Animated.View style={{ opacity: quizActionFadeAnim }} className="absolute inset-0 bg-black/60" />
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => closeQuizActionSheet()} />
          
          <Animated.View 
            style={{ 
              transform: [{ translateY: quizActionSlideAnim }],
              paddingBottom: Math.max(insets.bottom + 20, 20)
            }}
            className="bg-[#FFFDF8] rounded-t-[32px] overflow-hidden relative"
          >
            {/* Dragger */}
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mt-5 mb-4" />
            
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pb-4 border-b border-[#EFE8D6]">
              <View className="flex-1 pr-2">
                <Text className="text-[18px] text-[#3D382F] pt-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                  {pickedQuizForAction?.title}
                </Text>
                <Text className="text-[13px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }}>কী করতে চাও?</Text>
              </View>
              <TouchableOpacity onPress={() => closeQuizActionSheet()} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            {/* Content Cards */}
            <View className="px-6 pt-5">
              {(() => {
                const history = pickedQuizForAction ? quizHistoryMap[pickedQuizForAction.id || pickedQuizForAction._id] : null;
                const mistakeCount = history?.failedItems?.length || 0;

                return (
                  <>
                    {/* Option 1: আবারো কুইজ দাও */}
                    <TouchableOpacity 
                      activeOpacity={0.85} 
                      onPress={() => {
                        closeQuizActionSheet(() => {
                          setLiveQuizActiveQuiz(pickedQuizForAction);
                          setParsedQuizData(pickedQuizForAction.questions);
                          setCurrentQuizIndex(0);
                          setQuizAnswers({});
                          setIsQuizFinished(false);
                          setQuizStartTime(Date.now());
                          setQuizTimeLeft(pickedQuizForAction.questions.length * 60); 
                          setIsLiveQuizModalVisible(true);
                        });
                      }}
                      className="bg-[#EAF6FE] border-2 border-[#1CB0F6] border-b-[4px] rounded-[20px] p-4 mb-4 flex-row items-center"
                    >
                      <View className="w-12 h-12 rounded-full bg-[#1CB0F6] items-center justify-center mr-4">
                        <FontAwesome5 name="redo-alt" size={18} color="#FFF" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className="text-[#1073A4] text-[17px] mb-0.5 pt-1" style={{ fontFamily: 'BanglaBold' }}>আবারো কুইজ দাও</Text>
                        <Text className="text-[#1899D6] text-[12px] leading-[18px]" style={{ fontFamily: 'BanglaRegular' }}>নতুন করে পরীক্ষা দাও, স্কোর লিডারবোর্ডে লক থাকবে</Text>
                      </View>
                      <FontAwesome5 name="chevron-right" size={16} color="#1CB0F6" />
                    </TouchableOpacity>

                    {/* Option 2: ভুলগুলো রিভিশন করো */}
                    <TouchableOpacity 
                      activeOpacity={mistakeCount > 0 ? 0.85 : 1}
                      disabled={mistakeCount === 0}
                      onPress={() => {
                        closeQuizActionSheet(() => {
                          openBookInReader({
                            id: 'revision_' + Date.now(),
                            notebookName: pickedQuizForAction.title + ' (রিভিশন)',
                            failedItems: history.failedItems,
                            channelId: lessonItem?.channelId,
                            creatorName: 'Smart AI Revision',
                            isQuizResourceMode: true 
                          });
                        });
                      }}
                      className={`border-2 border-b-[4px] rounded-[20px] p-4 flex-row items-center ${mistakeCount > 0 ? 'bg-[#FFF4E5] border-[#FF9600]' : 'bg-[#F5F5F5] border-[#E5E5E5]'}`}
                    >
                      <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 relative ${mistakeCount > 0 ? 'bg-[#FF9600]' : 'bg-[#D7D7D7]'}`}>
                        <FontAwesome5 name="sync-alt" size={18} color="#FFF" />
                        {mistakeCount > 0 && (
                          <View className="absolute -top-1 -right-1 bg-[#FF4B4B] w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                            <Text className="text-white text-[9px] pt-[1px]" style={{ fontFamily: 'BanglaBold' }}>{mistakeCount}</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className={`text-[17px] mb-0.5 pt-1 ${mistakeCount > 0 ? 'text-[#D47B00]' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>ভুলগুলো রিভিশন করো</Text>
                        <Text className={`text-[12px] leading-[18px] ${mistakeCount > 0 ? 'text-[#FF9600]' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaRegular' }}>
                          {mistakeCount > 0 ? `${mistakeCount} টি প্রশ্ন রিভিশনের জন্য রেডি` : 'কোনো ভুল নেই, দারুণ! 🎉'}
                        </Text>
                      </View>
                      <FontAwesome5 name="chevron-right" size={16} color={mistakeCount > 0 ? "#FF9600" : "#D7D7D7"} />
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </Animated.View>
        </View>
      </Modal>

   {/* 🚀 Leaderboard Modal (Glorified Top 3) */}
        <Modal visible={isLeaderboardVisible} animationType="slide" transparent={true} onRequestClose={() => setIsLeaderboardVisible(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-[#FFFDF8] rounded-t-[32px] w-full h-[85%] border-t-4 border-[#EFE8D6] overflow-hidden">
              {/* Header */}
              <View className="w-12 h-1.5 bg-[#D7D7D7] rounded-full self-center mt-3 mb-2" />
              <View className="flex-row justify-between items-center px-6 pb-3 border-b border-[#EFE8D6]">
                <View className="flex-1 pr-2">
                  <Text className="text-[18px] text-[#3D382F] pt-1" style={{ fontFamily: 'BanglaBold' }}>লিডারবোর্ড 🏆</Text>
                  <Text className="text-[12px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={1}>{activeLeaderboardQuiz?.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsLeaderboardVisible(false)} className="bg-[#FFF4E5] w-9 h-9 rounded-full items-center justify-center border border-[#FFDDAA]">
                  <FontAwesome5 name="times" size={14} color="#D47B00" />
                </TouchableOpacity>
              </View>

          {/* Leaderboard Content */}
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                {isLeaderboardLoading ? (
                  <LeaderboardSkeleton />
                ) : leaderboardData.length === 0 ? (
                  <View className="items-center justify-center py-20">
                    <FontAwesome5 name="ghost" size={40} color="#EAE4D4" />
                    <Text className="text-[#AFAFAF] text-[15px] mt-4 pt-1" style={{ fontFamily: 'BanglaBold' }}>এখনো কেউ কুইজ দেয়নি!</Text>
                  </View>
                ) : (
                  <View>
                    {/* 🚀 Top 3 Glorified Podium UI */}
                    <View className="flex-row justify-center items-end mb-8 mt-6">
                      {/* 2nd Place (Silver) */}
                      {leaderboardData[1] && (
                        <View className="items-center flex-1">
                          <Text className="text-[12px] text-[#AFAFAF] mb-1" style={{ fontFamily: 'BanglaBold' }}>২য় স্থান</Text>
                          <View className="w-14 h-14 rounded-full border-4 border-[#C0C0C0] bg-[#F5F5F5] mb-2 relative">
                            <Image source={{ uri: leaderboardData[1].userAvatar }} className="w-full h-full rounded-full" />
                            <View className="absolute -bottom-2 -right-2 bg-[#C0C0C0] w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                              <Text className="text-white text-[10px]" style={{ fontFamily: 'BanglaBold' }}>2</Text>
                            </View>
                          </View>
                          <Text className="text-[#3D382F] text-[13px] text-center" numberOfLines={1} style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[1].userName}</Text>
                          <Text className="text-[#58A700] text-[11px]" style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[1].score.correct} সঠিক</Text>
                        </View>
                      )}

                      {/* 1st Place (Gold & Crown) */}
                      {leaderboardData[0] && (
                        <View className="items-center flex-[1.2] -mt-6">
                          <FontAwesome5 name="crown" size={24} color="#FFC800" className="mb-2" />
                          <View className="w-20 h-20 rounded-full border-4 border-[#FFC800] bg-[#FFF4E5] mb-2 relative shadow-md">
                            <Image source={{ uri: leaderboardData[0].userAvatar }} className="w-full h-full rounded-full" />
                            <View className="absolute -bottom-2 -right-2 bg-[#FFC800] w-7 h-7 rounded-full items-center justify-center border-2 border-white">
                              <Text className="text-white text-[12px]" style={{ fontFamily: 'BanglaBold' }}>1</Text>
                            </View>
                          </View>
                          <Text className="text-[#3D382F] text-[15px] text-center" numberOfLines={1} style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[0].userName}</Text>
                          <Text className="text-[#58A700] text-[12px]" style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[0].score.correct} সঠিক</Text>
                          <Text className="text-[#D47B00] text-[10px] bg-[#FFF4E5] px-2 py-0.5 rounded-full mt-1 border border-[#FFDDAA]" style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[0].timeTaken} সেকেন্ড</Text>
                        </View>
                      )}

                      {/* 3rd Place (Bronze) */}
                      {leaderboardData[2] && (
                        <View className="items-center flex-1">
                          <Text className="text-[12px] text-[#AFAFAF] mb-1" style={{ fontFamily: 'BanglaBold' }}>৩য় স্থান</Text>
                          <View className="w-14 h-14 rounded-full border-4 border-[#CD7F32] bg-[#F5F5F5] mb-2 relative">
                            <Image source={{ uri: leaderboardData[2].userAvatar }} className="w-full h-full rounded-full" />
                            <View className="absolute -bottom-2 -right-2 bg-[#CD7F32] w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                              <Text className="text-white text-[10px]" style={{ fontFamily: 'BanglaBold' }}>3</Text>
                            </View>
                          </View>
                          <Text className="text-[#3D382F] text-[13px] text-center" numberOfLines={1} style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[2].userName}</Text>
                          <Text className="text-[#58A700] text-[11px]" style={{ fontFamily: 'BanglaBold' }}>{leaderboardData[2].score.correct} সঠিক</Text>
                        </View>
                      )}
                    </View>

                    {/* 🚀 Rest of the leaderboard list */}
                    <View className="bg-white rounded-3xl border border-[#EFE8D6] shadow-sm p-2">
                      {leaderboardData.slice(3).map((student, idx) => (
                        <View key={idx} className="flex-row items-center justify-between p-3 border-b border-[#F9F9F9]">
                          <View className="flex-row items-center flex-1">
                            <Text className="text-[#AFAFAF] text-[14px] w-6 text-center" style={{ fontFamily: 'BanglaBold' }}>{idx + 4}</Text>
                            <Image source={{ uri: student.userAvatar }} className="w-10 h-10 rounded-full bg-[#EAE4D4] mx-3" />
                            <View className="flex-1">
                              <Text className="text-[#3D382F] text-[14px]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>{student.userName}</Text>
                              <View className="flex-row items-center mt-1 space-x-2">
                                <Text className="text-[#58A700] text-[11px]" style={{ fontFamily: 'BanglaBold' }}>{student.score.correct} সঠিক</Text>
                                <Text className="text-[#D7D7D7]">•</Text>
                                <Text className="text-[#827B6E] text-[11px]" style={{ fontFamily: 'BanglaRegular' }}>{student.timeTaken} সেক</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </Animated.View>
      </>
    </Wrapper>
  );
}
