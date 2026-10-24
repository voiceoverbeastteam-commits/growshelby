import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, LayoutAnimation, TextInput, UIManager, Platform, Image, Animated, Clipboard, Alert, FlatList, ActivityIndicator, Linking, DeviceEventEmitter, RefreshControl, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { KeyboardAvoidingView } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';

// 🚀 Modular Discussion Component
import Discussion from './Discussion';
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
    <Animated.View style={{ opacity: shimmerAnim }} className="flex-row items-center bg-white pl-1.5 pr-4 py-1.5 rounded-full border border-[#EFE8D6] shadow-sm">
      <View className="flex-row -space-x-3 mr-2.5">
        <View className="w-7 h-7 rounded-full bg-[#EAE4D4] border-2 border-white" />
        <View className="w-7 h-7 rounded-full bg-[#EAE4D4] border-2 border-white" />
        <View className="w-7 h-7 rounded-full bg-[#EAE4D4] border-2 border-white" />
      </View>
      <View>
        <View className="w-16 h-3 bg-[#EAE4D4] rounded-full mb-1.5 mt-0.5" />
        <View className="w-12 h-2 bg-[#EAE4D4] rounded-full" />
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
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-white p-3 rounded-[16px] mb-4 border border-[#EFE8D6] flex-row items-center shadow-sm">
      {/* থাম্বনেইল স্কেলেটন */}
      <View className="w-16 h-16 rounded-xl bg-[#EAE4D4] mr-3" />
      
      {/* টেক্সট স্কেলেটন */}
      <View className="flex-1 justify-center py-1">
        <View className="w-3/4 h-4 bg-[#EAE4D4] rounded-full mb-2.5" />
        <View className="w-1/2 h-3 bg-[#EAE4D4] rounded-full mb-2" />
        <View className="w-1/3 h-2 bg-[#EAE4D4] rounded-full" />
      </View>
      
      {/* ডানদিকের অ্যারো বাটন স্কেলেটন */}
      <View className="w-8 h-8 bg-[#EAE4D4] rounded-full ml-2" />
    </Animated.View>
  );
};

const normalizeText = (text) => {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[।.,;:'"()\-\s]/g, '').toLowerCase();
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

      <Text className="text-[#3D382F] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>
      
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
      
      <Text className="text-[#3D382F] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>

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
          {data.explanation && (
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

  if (filteredQuestions.length === 0) return null;
  const showStem = subFilter === 'সব' || subFilter === 'গ ও ঘ';

  useEffect(() => {
    const newState = {};
    filteredQuestions.forEach((_, i) => newState[i] = globalReveal);
    setRevealedAnswers(newState);
  }, [globalReveal, subFilter, data.questions]);

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
          <Text className="text-[#3D382F] text-[16px] leading-8" style={{ fontFamily: 'BanglaRegular' }}>{data.stem}</Text>
        </View>
      )}
      
      <View className={`${showStem ? 'border-t border-[#F0D5A3] pt-4' : ''}`}>
        {filteredQuestions.map((q, index) => (
          <View className="mb-5" key={index}>
            <Text className="text-[#3D382F] text-[16px] mb-2 leading-7" style={{ fontFamily: 'BanglaBold' }}>{q.label}) {q.question}</Text>
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
  const [discussionVisible, setDiscussionVisible] = useState(false);
  const [activeDiscussionData, setActiveDiscussionData] = useState(null);

  const openDiscussion = (questionData = null) => {
    setActiveDiscussionData(questionData);
    setDiscussionVisible(true);
  };

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
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'get_real_user_name', email: adminEmail })
        });
        const data = await res.json();
        if (data.success && data.name) setRealAdminName(data.name);
      } catch (e) {}
    };
    fetchRealAdminName();
  }, [visible, lessonItem]);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
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
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [readerVisible, setReaderVisible] = useState(false);
  // 🚀 Refresh States
  const [refreshing, setRefreshing] = useState(false);

  // 🚀 মাস্টার রিফ্রেশ ফাংশন (সব ডাটা একসাথে আপডেট করবে)
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;
    
    try {
      // একসাথে গাইড, মেম্বার এবং রিভিউ ફેচ করবো
      await Promise.all([
        // ১. গাইড ফেচ
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'fetch_channel_guides', channelId: lessonItem?.channelId })
        }).then(res => res.json()).then(data => { if (data.success) setChannelGuides(data.guides); }),
        
        // ২. মেম্বার ফেচ
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'get_community_members', guideId, limit: 10, skip: 0 })
        }).then(res => res.json()).then(data => { 
          if (data.success) { setMembers(data.members); setTotalMemberCount(data.totalMembers !== null ? data.totalMembers : 0); } 
        }),
        
        // ৩. রিভিউ ফেচ
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'get_reviews', guideId })
        }).then(res => res.json()).then(data => { if (data.success && data.reviews) setReviews(data.reviews); })
      ]);
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
      const res = await fetch(`https://api.imgbb.com/1/upload?key=266dc6accf170af21b0a679770bcd7bb`, { method: "POST", body: formData });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (e) { return null; }
  };

 const pickGuideThumbnail = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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
              headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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
          const res = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
            body: JSON.stringify({ action: 'fetch_channel_guides', channelId: lessonItem.channelId })
          });
          const data = await res.json();
          if (data.success) setChannelGuides(data.guides);
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

 const openBookInReader = async (guide) => {
    const guideWithChannelInfo = { ...guide, channelId: lessonItem?.channelId || lessonItem?.creatorEmail || 'default_channel' };
    
    setSelectedGuide(guideWithChannelInfo);
    setReaderVisible(true);

    // 🚀 ব্যাকগ্রাউন্ডে ভিউ কাউন্ট আপডেট করা (যাতে অ্যাপ স্লো না হয়)
    if (currentUserEmail) {
      try {
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  // 🚀 অরিজিনাল কমিউনিটি বাউন্স অ্যানিমেশন 
  const membersSlideAnim = useRef(new Animated.Value(1000)).current;
  const membersFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (membersModalVisible) {
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
      Animated.timing(membersSlideAnim, { toValue: 1000, duration: 250, useNativeDriver: true })
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
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
            body: JSON.stringify({ action: 'get_community_members', guideId, limit: 10, skip: 0 })
          });
          const data = await res.json();
          if (data.success) {
            setMembers(data.members);
            if (data.totalMembers !== null) setTotalMemberCount(data.totalMembers);
            setIsMember(data.members.some(m => m.userEmail === uid));
            if (data.members.length < 10) setHasMoreMembers(false);
          }
        } catch (e) {} finally {
          setIsLoadingMembers(false); // 🚀 ডেটা লোড শেষ (আসল ছবি দেখাবে)
        }
      } else {
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
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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

  const handleJoinCommunity = async () => {
    const uid = await AsyncStorage.getItem('@current_user_id');
    const name = await AsyncStorage.getItem(`@user_name_${uid}`) || 'শিক্ষার্থী';
    const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const guideId = lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode;

    // 🔴 ডিবাগিং কোড শুরু
    console.log("\n🚀 === JOIN COMMUNITY DEBUG ===");
    console.log("১. আমার ইউজার আইডি (UID):", uid);
    console.log("২. যে কমিউনিটিতে জয়েন করছি তার আইডি (guideId):", guideId);
    console.log("৩. লেসন আইটেমের ডেটা:", JSON.stringify(lessonItem));
    console.log("=================================\n");
    // 🔴 ডিবাগিং কোড শেষ

    setIsMember(true);
    setTotalMemberCount(prev => prev + 1);
    setMembers(prev => [{ userEmail: uid, userName: name, userAvatar: avatar }, ...prev]); // নতুন মেম্বার শুরুতে

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'join_community', guideId, userEmail: uid, userName: name, userAvatar: avatar })
      });

      DeviceEventEmitter.emit('refresh_library');

    } catch (error) {}
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
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'update_review', guideId, userId: uid, rating: userRating, text: reviewText })
        });
      } else {
        // নতুন রিভিউ হলে এড করা
        const newReview = { id: Date.now().toString(), userId: uid, name, avatar, rating: userRating, text: reviewText };
        setReviews([newReview, ...reviews]);
        await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
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

  const handleShareCode = () => {
    // 🚀 কমিউনিটির কোড হিসেবে তার প্রথম গাইডের শেয়ার কোডটি ব্যবহার করা হবে
    const communityCode = channelGuides.length > 0 ? channelGuides[0].shareCode : null;
    
    if (communityCode) {
      Clipboard.setString(communityCode);
      setShareModalType('success');
      setShareModalVisible(true);
    } else {
      setShareModalType('error');
      setShareModalVisible(true);
    }
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

 // 🚀 ফিক্স: এটা নেটিভ স্ক্রিন হলে View হিসেবে রেন্ডার হবে, আর প্রোফাইল থেকে ওপেন হলে Modal হিসেবে!
  const Wrapper = isNativeScreen ? View : Modal;
  const wrapperProps = isNativeScreen 
    ? { style: { flex: 1 } } 
    : { animationType: "none", onRequestClose: closePageWithAnimation, transparent: true, visible: visible, statusBarTranslucent: true };

  return (
    <Wrapper {...wrapperProps}>
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
              onPress={() => setMembersModalVisible(true)} 
              className="flex-row items-center bg-white pl-1.5 pr-4 py-1.5 rounded-full border border-[#EFE8D6] shadow-sm"
            >
              <View className="flex-row -space-x-3 mr-2.5">
                {members.slice(0, 3).map((m, i) => (
               <Image key={i} source={{uri: m.userAvatar && m.userAvatar !== 'null' ? m.userAvatar : undefined}} className="w-7 h-7 rounded-full border-2 border-white bg-[#EAE4D4]" />
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
              
              <View>
                 <Text className="text-[13px] text-[#1F2937]" style={{ fontFamily: 'BanglaBold', lineHeight: 18 }}>
                   {totalMemberCount > 0 ? `${totalMemberCount}+ স্টুডেন্টস` : 'স্টাডি স্কোয়াড'}
                 </Text>
                 <Text className="text-[10px] text-[#6B7280]" style={{ fontFamily: 'BanglaRegular', lineHeight: 12 }}>
                   {totalMemberCount > 0 ? 'যুক্ত আছেন' : 'প্রথম মেম্বার হোন!'}
                 </Text>
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
              <Text className="text-[22px] text-[#3D382F] leading-8" style={{ fontFamily: 'BanglaBold' }}>
               {lessonItem?.notebookName || lessonItem?.creatorName || 'স্মার্ট কমিউনিটি'}
              </Text>
              
              <View className="flex-row items-center justify-between mt-4">
                <View className="flex-row items-center flex-1">
                  <Image source={{ uri: lessonItem?.creatorAvatar || 'https://i.pravatar.cc/150?img=12' }} className="w-12 h-12 rounded-full border-2 border-[#EFE8D6]" />
<View className="ml-3 flex-1">
  <Text className="text-[15px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1} ellipsizeMode="tail">
 {lessonItem?.creatorEmail === currentUserEmail ? 'আমি' : (realAdminName || lessonItem?.creatorName || 'অ্যাডমিন')}
  </Text>
                    <Text className="text-[12px] text-[#827B6E] mt-0.5" style={{ fontFamily: 'BanglaBold' }}>
  {lessonItem?.isFromExplore ? `${channelGuides.length || 1} টি বই` : `${lessonItem?.views || 0} জন পড়েছে`}
</Text>
                  </View>
                </View>

                {/* 🚀 রেটিং ও রিভিউ বাটন */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setIsReviewModalVisible(true)} className="ml-2">
                  <View className="rounded-[16px] pb-[4px] bg-[#D47B00]">
                    <View className="px-4 py-2 rounded-[16px] flex-row items-center justify-center bg-[#FF9600]">
                      <FontAwesome5 name="star" size={13} color="#FFFFFF" solid />
                      <Text className="text-white text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                        {averageRating > 0 ? averageRating : '0.0'} ({reviews.length})
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {/* 🚀 Join / Community Button */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => isMember ? openDiscussion(null) : handleJoinCommunity()} className="ml-2">
                  <View className={`rounded-[16px] pb-[4px] ${isMember ? 'bg-[#1073A4]' : 'bg-[#D47B00]'}`}>
                    <View className={`px-4 py-2 rounded-[16px] flex-row items-center justify-center ${isMember ? 'bg-[#1CB0F6]' : 'bg-[#FF9600]'}`}>
                      <FontAwesome5 name={isMember ? "users" : "user-plus"} size={13} color="#FFFFFF" />
                      <Text className="text-white text-[14px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                        {isMember ? 'কমিউনিটি' : 'জয়েন করুন'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

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
                 {/* 🚀 Books List (Study Packs) */}
          <View className="px-5 pt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>📚 স্টাডি প্যাক সমুহ ({channelGuides.length})</Text>
              
              {/* 🚀 ক্রিয়েটর হলে আনলিমিটেড নতুন গাইড বানানোর বাটন দেখাবে */}
              {lessonItem?.creatorEmail === currentUserEmail && channelGuides.length > 0 && (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => DeviceEventEmitter.emit('open_create_guide_modal')} 
                  className="bg-[#1899D6]/10 px-3 py-1.5 rounded-full border border-[#1899D6]/30 flex-row items-center"
                >
                  <FontAwesome5 name="plus" size={12} color="#1899D6" />
                  <Text className="text-[#1899D6] text-[13px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>নতুন গাইড</Text>
                </TouchableOpacity>
              )}
            </View>
            
         {isLoadingGuides || refreshing || isInitialLoading ? (
              <View className="mt-1">
                <GuideSkeleton />
                <GuideSkeleton />
                <GuideSkeleton />
              </View>
           ) : (
               [...channelGuides].sort((a, b) => (b.views || 0) - (a.views || 0)).map((guide, idx) => (
                  <View key={idx} className="bg-white p-3 rounded-[16px] mb-4 border border-[#EFE8D6] shadow-sm">
                  {/* 🚀 বই ওপেন করার মেইন অংশ */}
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openBookInReader(guide)} className="flex-row items-center">
                    <View className="w-16 h-16 rounded-xl overflow-hidden bg-[#F0F2F5] mr-3 border border-[#E5E5E5]">
                      {guide.thumbnail ? (
                        <Image source={{ uri: guide.thumbnail }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-[#1899D6]/10">
                          <FontAwesome5 name="book-open" size={20} color="#1899D6" />
                        </View>
                      )}
                    </View>

                    <View className="flex-1 justify-center">
                       <Text className="text-[#3D382F] text-[16px] mb-1 leading-6" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>{guide.notebookName}</Text>
                       <Text className="text-[#D47B00] text-[12px] mb-1" style={{ fontFamily: 'BanglaBold' }}>{guide.chapter || 'সাধারণ টপিক'}</Text>
                      <Text className="text-[#827B6E] text-[11px]" style={{ fontFamily: 'BanglaRegular' }}>{guide.failedItems?.length || 0} টি প্রশ্ন • {guide.views || 0} জন পড়েছে</Text>
                    </View>
                    
                    <View className="w-8 h-8 bg-[#FDF6E3] rounded-full items-center justify-center ml-2 border border-[#EFE8D6]">
                      <FontAwesome5 name="chevron-right" size={12} color="#D47B00" />
                    </View>
                  </TouchableOpacity>

                  {/* 🚀 শুধুমাত্র ক্রিয়েটরের জন্য এডিট ও ডিলিট অপশন */}
                  {lessonItem?.creatorEmail === currentUserEmail && (
                    <View className="flex-row justify-end mt-3 pt-3 border-t border-[#EFE8D6] space-x-3">
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleEditGuideClick(guide)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-lg border border-[#EFE8D6]">
                        <FontAwesome5 name="pen" size={10} color="#D47B00" />
                        <Text className="text-[#D47B00] text-[12px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এডিট</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleDeleteChannelGuide(guide)} className="flex-row items-center bg-[#FFF4E5] px-3 py-1.5 rounded-lg border border-[#FFDDAA]">
                        <FontAwesome5 name="trash" size={10} color="#FF4B4B" />
                        <Text className="text-[#FF4B4B] text-[12px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>ডিলিট</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
            
           {channelGuides.length === 0 && !isLoadingGuides && (
              <View className="py-2">
                {/* 🚀 চেক করা হচ্ছে ইউজার নিজে এই কমিউনিটির ক্রিয়েটর কিনা */}
                {lessonItem?.creatorEmail === currentUserEmail ? (
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
                        <Text className="text-[17px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>যেভাবে নিজের কমিউনিটি বানাবে!</Text>
                      </View>
                    </TouchableOpacity>

                    {/* 🚀 প্রথম গাইড পাবলিশ করার কার্ড */}
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                    onPress={() => {
                        // 🚀 কমিউনিটি পেজ বন্ধ না করেই সরাসরি গাইড তৈরির মোডাল ওপেন হবে
                        DeviceEventEmitter.emit('open_create_guide_modal');
                      }}
                      className="bg-white p-6 rounded-[20px] border-2 border-[#1899D6]/30 border-dashed items-center justify-center shadow-sm"
                    >
                      <View className="w-16 h-16 bg-[#1899D6]/10 rounded-full items-center justify-center mb-4">
                        <FontAwesome5 name="plus" size={24} color="#1899D6" />
                      </View>
                      <Text className="text-[18px] text-[#3D382F] mb-2" style={{ fontFamily: 'BanglaBold' }}>প্রথম গাইড পাবলিশ করুন</Text>
                      <Text className="text-[13px] text-[#777777] text-center px-4 leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                        আপনার স্কোয়াড মেম্বারদের জন্য এমসিকিউ বা প্রশ্ন-উত্তরের স্মার্ট গাইড তৈরি করে শেয়ার করুন।
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
                <Text className="text-[16px] text-[#3D382F] pt-1" style={{ fontFamily: 'BanglaBold' }}>যেভাবে নিজের কমিউনিটি বানাবে</Text>
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
                    {channelGuides.length > 0 ? channelGuides[0].shareCode : ''}
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
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeMembersModalSmoothly} />
          
          {/* 🚀 এই Animated.View টাই তোমার কমিউনিটি বাটনের মতো পারফেক্ট লাফ দিয়ে উঠবে! */}
          <Animated.View 
            style={{ transform: [{ translateY: membersSlideAnim }] }}
            className="bg-[#FFFDF8] rounded-t-[32px] h-[65%] p-6 pt-5"
          >
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mb-4" />
            
            <View className="flex-row justify-between items-center mb-2 pb-3 border-b border-[#EFE8D6]">
              <View>
                <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>স্টাডি স্কোয়াড 🎯</Text>
                <Text className="text-[13px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }}>মোট {totalMemberCount} জন বন্ধু যুক্ত আছে</Text>
              </View>
              <TouchableOpacity onPress={closeMembersModalSmoothly} className="bg-[#FFF4E5] w-9 h-9 rounded-full items-center justify-center border border-[#FFDDAA]">
                <FontAwesome5 name="times" size={14} color="#D47B00" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={members}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
              onEndReached={loadMoreMembers}
              onEndReachedThreshold={0.5}
             ListEmptyComponent={
                <View className="pt-2">
                  <MemberSkeleton />
                  <MemberSkeleton />
                  <MemberSkeleton />
                </View>
              }
              ListFooterComponent={
                isLoadingMembers ? <ActivityIndicator size="small" color="#D47B00" style={{ marginVertical: 10 }} /> : null
              }
              renderItem={({ item, index }) => (
                <View className="flex-row items-center mb-3 bg-[#FDF6E3] p-3 rounded-[20px] border border-[#EFE8D6] shadow-sm">
                  <View className="relative">
                    <Image source={{uri: item.userAvatar}} className="w-12 h-12 rounded-full border-2 border-[#FFC800]" />
                    {index < 3 && (
                      <View className="absolute -top-1 -right-1 bg-[#FF9600] w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                        <Text className="text-[9px] text-white" style={{ fontFamily: 'BanglaBold' }}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] text-[#3D382F] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{item.userName}</Text>
                    <Text className="text-[11px] text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }}>আড্ডায় যুক্ত আছেন</Text>
                  </View>
                  <TouchableOpacity className="bg-[#FFFDF8] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
                    <Text className="text-[11px] text-[#D47B00]" style={{ fontFamily: 'BanglaBold' }}>প্রোফাইল</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </Animated.View>
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
                  {averageRating > 0 ? averageRating : '0.0'}
                </Text>
                <View className="flex-row space-x-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesome5 key={i} name="star" size={12} color={i < Math.round(averageRating) ? "#FF9600" : "#EAE4D4"} solid={i < Math.round(averageRating)} />
                  ))}
                </View>
                <Text className="text-[12px] text-[#827B6E] mt-1" style={{ fontFamily: 'BanglaRegular' }}>{reviews.length} টি রিভিউ</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] text-[#6B655B] leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                  এই গাইডটি পড়ে অন্যান্য স্টুডেন্টদের কেমন লেগেছে, তা এখান থেকে দেখে নিতে পারো। 
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
                  // 🚀 মতামত দেওয়ার বাটন
                  <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={() => {
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

      {/* 🚀 Guide Edit Modal for Community Creators */}
      <Modal visible={isGuideEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsGuideEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#FFFDF8] rounded-t-[32px] p-6 pt-5 w-full max-h-[85%]">
            <View className="w-12 h-1.5 bg-[#EAE4D4] rounded-full self-center mb-5" />
            <View className="flex-row justify-between items-center mb-4 border-b border-[#EFE8D6] pb-3">
              <Text className="text-[18px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>বই এডিট করুন</Text>
              <TouchableOpacity onPress={() => setIsGuideEditModalVisible(false)} className="bg-[#EAE4D4] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#6B655B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>বইয়ের কভার ছবি</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={pickGuideThumbnail} className="mb-6">
                <View className="w-full aspect-[16/9] rounded-[16px] border border-[#EFE8D6] overflow-hidden bg-[#F5F5F5] relative shadow-sm">
                  {tempGuideThumbnail ? (
                    <Image source={{ uri: tempGuideThumbnail }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <FontAwesome5 name="image" size={30} color="#D7D7D7" />
                    </View>
                  )}
                  <View className="absolute inset-0 bg-black/40 items-center justify-center">
                    <FontAwesome5 name="camera" size={24} color="#FFFFFF" />
                    <Text className="text-white text-[12px] mt-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>কভার পরিবর্তন</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>বইয়ের নাম (টাইটেল)</Text>
              <TextInput
                className="bg-white p-4 rounded-[16px] text-[16px] text-[#3D382F] mb-5 border border-[#EFE8D6]"
                style={{ fontFamily: 'BanglaBold' }}
                value={tempGuideTitle}
                onChangeText={setTempGuideTitle}
              />
            </ScrollView>

        <TouchableOpacity 
              className={`${isImageUploading ? 'bg-[#EAE4D4]' : 'bg-[#FF9600]'} py-3.5 rounded-[16px] mt-2 items-center shadow-sm`} 
              onPress={saveGuideEdits}
              disabled={isImageUploading}
            >
              <Text style={{ fontFamily: 'BanglaBold' }} className={`${isImageUploading ? 'text-[#827B6E]' : 'text-white'} text-[16px] pt-1`}>
                {isImageUploading ? 'ছবি আপলোড হচ্ছে ⏳' : 'সেভ করুন'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🚀 Discussion Modal */}
      <Discussion 
        key={activeDiscussionData ? activeDiscussionData.question : 'general_community'}
        visible={discussionVisible} 
        onClose={() => setDiscussionVisible(false)} 
        data={activeDiscussionData} 
        guideName={lessonItem?.notebookName}
       guideId={lessonItem?.channelId || lessonItem?.id || lessonItem?.shareCode || 'default_guide'}
      />
</Animated.View>
    </Wrapper>
  );
}