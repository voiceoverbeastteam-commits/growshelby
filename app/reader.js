import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Platform, Image, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import Discussion from '../components/Discussion';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    <View className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#1CB0F6]/10 px-3 py-1 rounded-lg border border-[#1CB0F6]/30">
          <Text className="text-[12px] text-[#1899D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{data.type}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-[#3C3C3C] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>
      
      {showAnswer ? (
        <View className="bg-[#F2F6F9] p-4 rounded-xl border border-[#D7D7D7] mt-2">
          <Text className="text-[#4B4B4B] text-[15px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{data.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
          <TouchableOpacity onPress={toggleAnswer} className="self-end mt-3">
            <Text className="text-[#FF4B4B] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleAnswer} className="bg-[#E5E5E5] p-3 rounded-xl items-center border border-[#D7D7D7] border-dashed">
          <Text className="text-[#777777] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
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
    <View className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#A559D6]/10 px-3 py-1 rounded-lg border border-[#A559D6]/30">
          <Text className="text-[12px] text-[#A559D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এমসিকিউ</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      
      <Text className="text-[#3C3C3C] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>

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
            <View className={`flex-row items-center p-3 rounded-lg border mb-2 ${isHighlighted ? 'bg-[#D7FFB8] border-[#58CC02]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`} key={index}>
              <View className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${isHighlighted ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
                <Text className={`text-[13px] ${isHighlighted ? 'text-white' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>{String.fromCharCode(2453 + index)}</Text>
              </View>
              <Text className={`text-[15px] flex-1 pt-1 ${isHighlighted ? 'text-[#58A700]' : 'text-[#4B4B4B]'}`} style={{ fontFamily: isHighlighted ? 'BanglaBold' : 'BanglaRegular', lineHeight: 24 }}>{option}</Text>
              {isHighlighted && <FontAwesome5 name="check-circle" size={16} color="#58A700" />}
            </View>
          );
        })}
      </View>

      {showAnswer ? (
        <View className="mt-2">
          {data.explanation && (
            <View className="bg-[#F2F6F9] p-4 rounded-xl border border-[#D7D7D7]">
              <Text className="text-[#4B4B4B] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা:</Text>
              <Text className="text-[#6B655B] text-[14px] mt-1 leading-6" style={{ fontFamily: 'BanglaRegular' }}>{data.explanation}</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleAnswer} className="self-end mt-3">
            <Text className="text-[#FF4B4B] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>উত্তর লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleAnswer} className="bg-[#E5E5E5] p-3 rounded-xl items-center border border-[#D7D7D7] border-dashed">
          <Text className="text-[#777777] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সঠিক উত্তর দেখুন <FontAwesome5 name="check-circle" size={12}/></Text>
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
    <View className="bg-[#FFF4E5] p-5 rounded-[20px] border-2 border-[#FFC800] mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#FF9600]/10 px-3 py-1 rounded-lg border border-[#FF9600]/30">
          <Text className="text-[12px] text-[#D47B00] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>সৃজনশীল প্রশ্ন</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-[#FFDDAA]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      
      {showStem && (
        <View className="mb-4 bg-white p-4 rounded-xl border border-[#FFDDAA]">
          <Text className="text-[#D47B00] text-[14px] mb-2" style={{ fontFamily: 'BanglaBold' }}>উদ্দীপক:</Text>
          <Text className="text-[#3C3C3C] text-[16px] leading-8" style={{ fontFamily: 'BanglaRegular' }}>{data.stem}</Text>
        </View>
      )}
      
      <View className={`${showStem ? 'border-t border-[#FFDDAA] pt-4' : ''}`}>
        {filteredQuestions.map((q, index) => (
          <View className="mb-5" key={index}>
            <Text className="text-[#3C3C3C] text-[16px] mb-2 leading-7" style={{ fontFamily: 'BanglaBold' }}>{q.label}) {q.question}</Text>
            {revealedAnswers[index] ? (
              <View className="bg-white p-4 rounded-xl border border-[#FFC800] mt-2">
                <Text className="text-[#4B4B4B] text-[15px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{q.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
                <TouchableOpacity onPress={() => toggleAnswer(index)} className="self-end mt-3">
                  <Text className="text-[#D47B00] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleAnswer(index)} className="bg-white p-3 rounded-xl items-center border border-[#FFC800] border-dashed">
                <Text className="text-[#D47B00] text-[14px] pt-1" style={{ fontFamily: 'BanglaBold' }}>{q.label}-এর উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default function ReaderPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [guideData, setGuideData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState('সব');
  const [cqSubFilter, setCqSubFilter] = useState('সব');
  const [globalReveal, setGlobalReveal] = useState(false);
  
  const [discussionVisible, setDiscussionVisible] = useState(false);
  const [activeDiscussionData, setActiveDiscussionData] = useState(null);

  useEffect(() => {
    const loadGuide = async () => {
      try {
        const storedData = await AsyncStorage.getItem('@temp_reader_guide');
        if (storedData) {
          setGuideData(JSON.parse(storedData));
        }
      } catch (error) {
        console.log("Error loading guide data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGuide();
  }, []);

  const openContextualDiscussion = (questionData) => {
    setActiveDiscussionData(questionData);
    setDiscussionVisible(true);
  };

  const handleCategoryChange = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(cat);
    setGlobalReveal(false); 
    if (cat !== 'সৃজনশীল') setCqSubFilter('সব'); 
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F2F6F9] items-center justify-center">
        <ActivityIndicator size="large" color="#1899D6" />
      </View>
    );
  }

  if (!guideData) {
    return (
      <View className="flex-1 bg-[#F2F6F9] items-center justify-center px-5">
        <FontAwesome5 name="exclamation-triangle" size={40} color="#FF4B4B" />
        <Text className="text-[18px] text-[#3C3C3C] text-center mt-4" style={{ fontFamily: 'BanglaBold' }}>গাইডটি লোড করা সম্ভব হয়নি!</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-[#E5E5E5] px-6 py-3 rounded-full">
          <Text className="text-[#777777] text-[15px]" style={{ fontFamily: 'BanglaBold' }}>ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const extractedData = guideData.failedItems || guideData.data || [];
  const categories = ['সব', ...Array.from(new Set(extractedData.map(item => item.type)))];

  const filteredData = extractedData.filter(item => {
    if (activeCategory === 'সব') return true;
    return item.type === activeCategory;
  });

  return (
    <View className="flex-1 bg-[#F2F6F9]">
      <StatusBar style="dark" backgroundColor="#ffffff" />
      
      {/* 🚀 Header */}
      <View style={{ paddingTop: Math.max(insets.top, 10) }} className="px-5 pb-4 bg-white border-b border-[#E5E5E5] flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="bg-[#F0F0F0] p-3 rounded-full w-11 h-11 items-center justify-center">
          <FontAwesome5 name="arrow-left" size={16} color="#777777" />
        </TouchableOpacity>
        
        <View className="flex-1 px-4 items-center">
          <Text className="text-[18px] text-[#3C3C3C] pt-1 text-center" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
            {guideData.notebookName}
          </Text>
          <Text className="text-[13px] text-[#7B92A5] pt-1" style={{ fontFamily: 'BanglaBold' }}>
            {filteredData.length} টি প্রশ্ন
          </Text>
        </View>

        <TouchableOpacity onPress={() => setDiscussionVisible(true)} className="bg-[#1899D6]/10 w-11 h-11 rounded-full items-center justify-center border border-[#1899D6]/30">
          <FontAwesome5 name="comments" size={16} color="#1899D6" />
        </TouchableOpacity>
      </View>

      {/* 🚀 Categories Tab */}
      <View className="bg-white border-b border-[#E5E5E5]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => handleCategoryChange(cat)} className="mr-3">
                <View className={`${isActive ? 'bg-[#1899D6]' : 'bg-[#E5E5E5]'} rounded-xl pb-[3px]`}>
                  <View className={`${isActive ? 'bg-[#1CB0F6] border-[#1CB0F6]' : 'bg-white border-[#E5E5E5]'} px-5 py-2.5 rounded-xl border flex-row items-center`}>
                    <Text className={`${isActive ? 'text-white' : 'text-[#777777]'} text-[15px] pt-1`} style={{ fontFamily: 'BanglaBold' }}>
                      {cat === 'mcq' ? 'এমসিকিউ' : (cat === 'সব' ? 'সব প্রশ্ন' : cat)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🚀 CQ Sub Filter */}
      {activeCategory === 'সৃজনশীল' && (
        <View className="bg-[#FFF4E5] border-b border-[#FFDDAA] py-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            {['সব', 'ক', 'খ', 'গ ও ঘ'].map((sub, index) => {
              const isSubActive = cqSubFilter === sub;
              return (
                <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCqSubFilter(sub); }} className="mr-3">
                  <View className={`px-4 py-1.5 rounded-full border ${isSubActive ? 'bg-[#FF9600] border-[#FF9600]' : 'bg-white border-[#FFDDAA]'}`}>
                    <Text className={`text-[13px] pt-1 ${isSubActive ? 'text-white' : 'text-[#D47B00]'}`} style={{ fontFamily: 'BanglaBold' }}>
                      {sub === 'সব' ? 'সম্পূর্ণ' : (sub === 'গ ও ঘ' ? 'উদ্দীপক + গ, ঘ' : `শুধু ${sub}`)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
        <Text className="text-[#7B92A5] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>পড়াশোনা শুরু করো</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setGlobalReveal(!globalReveal); }} className="flex-row items-center bg-[#E5E5E5] px-3 py-1.5 rounded-lg border border-[#D7D7D7]">
          <FontAwesome5 name={globalReveal ? "eye-slash" : "eye"} size={12} color="#777777" />
          <Text className="text-[#777777] text-[13px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{globalReveal ? 'সব উত্তর লুকান' : 'সব উত্তর দেখুন'}</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 Main Reading Content */}
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }} showsVerticalScrollIndicator={false}>
        {filteredData.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome5 name="box-open" size={40} color="#D7D7D7" />
            <Text className="text-[16px] text-[#AFAFAF] mt-4 pt-1" style={{ fontFamily: 'BanglaBold' }}>এই ক্যাটাগরিতে কোনো ডেটা নেই।</Text>
          </View>
        ) : (
          filteredData.map((item, index) => {
            if (item.type === 'mcq') return <MCQCard data={item} key={`mcq_${index}`} globalReveal={globalReveal} onOpenDiscussion={openContextualDiscussion} />;
            else if (item.type === 'সৃজনশীল') return <CQCard data={item} key={`cq_${index}`} globalReveal={globalReveal} subFilter={activeCategory === 'সৃজনশীল' ? cqSubFilter : 'সব'} onOpenDiscussion={openContextualDiscussion} />;
            else return <ShortAnswerCard data={item} key={`short_${index}`} globalReveal={globalReveal} onOpenDiscussion={openContextualDiscussion} />;
          })
        )}
      </ScrollView>

      {/* 🚀 Global Community Chat inside Reading Page */}
      <Discussion 
        visible={discussionVisible} 
        onClose={() => setDiscussionVisible(false)} 
        data={activeDiscussionData} 
        guideName={guideData?.creatorName}
        guideId={guideData?.safeChannelId || 'default_channel'} 
      />
    </View>
  );
}