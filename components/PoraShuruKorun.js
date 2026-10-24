import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, SafeAreaView, LayoutAnimation, UIManager, Platform, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const normalizeText = (text) => {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[।.,;:'"()\-\s]/g, '').toLowerCase();
};

const ShortAnswerCard = ({ data, globalReveal }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => setShowAnswer(globalReveal), [globalReveal]);

  const toggleAnswer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAnswer(!showAnswer);
  };

  return (
    <View className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm mx-5">
      <View className="bg-[#1CB0F6]/10 self-start px-3 py-1 rounded-lg mb-3 border border-[#1CB0F6]/30">
        <Text className="text-[12px] text-[#1899D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{data.type}</Text>
      </View>
      <Text className="text-[#3C3C3C] text-[17px] mb-4 leading-7" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>
      
      {showAnswer ? (
        <View className="bg-[#F2F6F9] p-4 rounded-xl border border-[#D7D7D7] mt-2">
          <Text className="text-[#4B4B4B] text-[15px] leading-6" style={{ fontFamily: 'BanglaRegular' }}>{data.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
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

const MCQCard = ({ data, globalReveal }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => setShowAnswer(globalReveal), [globalReveal]);

  const toggleAnswer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAnswer(!showAnswer);
  };

  let anyOptionMatched = false;
  const normalizedCorrectText = normalizeText(data.correctAnswer);

  return (
    <View className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm mx-5">
      <View className="bg-[#A559D6]/10 self-start px-3 py-1 rounded-lg mb-3 border border-[#A559D6]/30">
        <Text className="text-[12px] text-[#A559D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এমসিকিউ</Text>
      </View>
      <Text className="text-[#3C3C3C] text-[17px] mb-4 leading-7" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>

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
            <View className={`flex-row items-center p-3 rounded-lg border ${isHighlighted ? 'bg-[#D7FFB8] border-[#58CC02]' : 'bg-[#F9F9F9] border-[#F0F0F0]'}`} key={index}>
              <View className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${isHighlighted ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
                <Text className={`text-[13px] ${isHighlighted ? 'text-white' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>{String.fromCharCode(2453 + index)}</Text>
              </View>
              <Text className={`text-[15px] flex-1 pt-1 ${isHighlighted ? 'text-[#58A700]' : 'text-[#4B4B4B]'}`} style={{ fontFamily: isHighlighted ? 'BanglaBold' : 'BanglaRegular' }}>{option}</Text>
              {isHighlighted && <FontAwesome5 name="check-circle" size={16} color="#58A700" />}
            </View>
          );
        })}
      </View>

      {showAnswer ? (
        <View className="mt-2">
          {!anyOptionMatched && (data.correctAnswer || data.answer !== undefined) && (
            <View className="bg-[#FFF4E5] p-4 rounded-xl border border-[#FFC800] mb-3">
              <Text className="text-[#D47B00] text-[13px] mb-1" style={{ fontFamily: 'BanglaBold' }}><FontAwesome5 name="exclamation-triangle" size={12} /> এআই মেলাতে পারেনি</Text>
              <Text className="text-[#4B4B4B] text-[15px] leading-6" style={{ fontFamily: 'BanglaBold' }}>সঠিক উত্তর: {data.correctAnswer !== undefined ? data.correctAnswer : data.options?.[Number(data.answer)]}</Text>
            </View>
          )}
          {data.explanation && (
            <View className="bg-[#F2F6F9] p-4 rounded-xl border border-[#D7D7D7]">
              <Text className="text-[#4B4B4B] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা:</Text>
              <Text className="text-[#4B4B4B] text-[14px] mt-1" style={{ fontFamily: 'BanglaRegular' }}>{data.explanation}</Text>
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

const CQCard = ({ data, globalReveal, subFilter }) => {
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
    <View className="bg-[#FFF4E5] p-5 rounded-[20px] border-2 border-[#FFC800] mb-5 shadow-sm mx-5">
      <View className="bg-[#FF9600]/10 self-start px-3 py-1 rounded-lg mb-3 border border-[#FF9600]/30">
        <Text className="text-[12px] text-[#D47B00] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>সৃজনশীল প্রশ্ন</Text>
      </View>
      
      {showStem && (
        <View className="mb-4">
          <Text className="text-[#D47B00] text-[14px] mb-1" style={{ fontFamily: 'BanglaBold' }}>উদ্দীপক:</Text>
          <Text className="text-[#3C3C3C] text-[16px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{data.stem}</Text>
        </View>
      )}
      
      <View className={`${showStem ? 'border-t border-[#FFDDAA] pt-4' : ''}`}>
        {filteredQuestions.map((q, index) => (
          <View className="mb-5" key={index}>
            <Text className="text-[#3C3C3C] text-[16px] mb-2 leading-6" style={{ fontFamily: 'BanglaBold' }}>{q.label}) {q.question}</Text>
            {revealedAnswers[index] ? (
              <View className="bg-white p-4 rounded-xl border border-[#FFC800] mt-2">
                <Text className="text-[#4B4B4B] text-[15px] leading-6" style={{ fontFamily: 'BanglaRegular' }}>{q.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
                <TouchableOpacity onPress={() => toggleAnswer(index)} className="self-end mt-3">
                  <Text className="text-[#D47B00] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleAnswer(index)} className="bg-[#FFECCC] p-3 rounded-xl items-center border border-[#FFC800] border-dashed">
                <Text className="text-[#D47B00] text-[14px] pt-1" style={{ fontFamily: 'BanglaBold' }}>{q.label}-এর উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default function PoraShuruKorun({ visible, onClose, lessonItem }) {
  const [activeCategory, setActiveCategory] = useState('সব');
  const [cqSubFilter, setCqSubFilter] = useState('সব');
  const [globalReveal, setGlobalReveal] = useState(false);

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

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent={false} visible={visible}>
      <SafeAreaView className="flex-1 bg-[#F2F6F9]">
        
        {/* Header Options */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-[#E5E5E5] shadow-sm z-10 relative">
          <TouchableOpacity className="bg-[#F0F0F0] w-10 h-10 rounded-full items-center justify-center" onPress={onClose}>
            <FontAwesome5 color="#777777" name="arrow-left" size={16}/>
          </TouchableOpacity>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="bg-[#F0F0F0] w-10 h-10 rounded-full items-center justify-center">
              <FontAwesome5 color="#777777" name="bookmark" size={16}/>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#1899D6]/10 w-10 h-10 rounded-full items-center justify-center border border-[#1899D6]/30">
              <FontAwesome5 color="#1899D6" name="share" size={14}/>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          {/* 🚀 YouTube Style Header (Intro Section) */}
          <View className="bg-white border-b border-[#E5E5E5] pb-5 mb-2 shadow-sm">
            {lessonItem?.thumbnail ? (
               <Image source={{ uri: lessonItem.thumbnail }} className="w-full aspect-video bg-[#E5E5E5]" />
            ) : (
               <View className="w-full h-32 bg-[#1CB0F6]/20 items-center justify-center">
                 <FontAwesome5 name="book-open" size={32} color="#1899D6" />
               </View>
            )}
            
            <View className="px-5 mt-4">
              <Text className="text-[20px] text-[#3C3C3C] leading-8" style={{ fontFamily: 'BanglaBold' }}>
                {lessonItem?.notebookName || 'স্মার্ট গাইডবুক'}
              </Text>
              
              {/* Creator Info */}
              <View className="flex-row items-center mt-4">
                <Image source={{ uri: lessonItem?.creatorAvatar || 'https://i.pravatar.cc/150?img=12' }} className="w-12 h-12 rounded-full border-2 border-[#E5E5E5]" />
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] text-[#3C3C3C]" style={{ fontFamily: 'BanglaBold' }}>{lessonItem?.creatorName || 'আমি'}</Text>
                  <Text className="text-[12px] text-[#7B92A5] mt-0.5" style={{ fontFamily: 'BanglaBold' }}>{lessonItem?.views || 0} ভিউ • {extractedData.length} টি প্রশ্ন</Text>
                </View>
              </View>

              {/* Description */}
              {lessonItem?.description ? (
                <View className="mt-5 bg-[#F9F9F9] p-4 rounded-[16px] border border-[#F0F0F0]">
                  <Text className="text-[14px] text-[#4B4B4B] leading-6" style={{ fontFamily: 'BanglaRegular' }}>
                    {lessonItem.description}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Sticky-like Category Tabs */}
          <View className="bg-white border-b border-[#E5E5E5] py-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {categories.map((cat, index) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => handleCategoryChange(cat)} className="mr-3 my-2">
                    <View className={`${isActive ? 'bg-[#1899D6]' : 'bg-[#E5E5E5]'} rounded-xl pb-[3px]`}>
                      <View className={`${isActive ? 'bg-[#1CB0F6] border-[#1CB0F6]' : 'bg-white border-[#E5E5E5]'} px-4 py-2 rounded-xl border`}>
                        <Text className={`${isActive ? 'text-white' : 'text-[#777777]'} text-[14px] pt-1`} style={{ fontFamily: 'BanglaBold' }}>
                          {cat === 'mcq' ? 'এমসিকিউ' : (cat === 'সব' ? 'সব প্রশ্ন' : cat)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* CQ Sub-Filters */}
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

          {/* Filter Bar */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text className="text-[#7B92A5] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>{filteredData.length} টি প্রশ্ন পাওয়া গেছে</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setGlobalReveal(!globalReveal); }} className="flex-row items-center bg-[#E5E5E5] px-3 py-1.5 rounded-lg">
              <FontAwesome5 name={globalReveal ? "eye-slash" : "eye"} size={12} color="#777777" />
              <Text className="text-[#777777] text-[13px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{globalReveal ? 'সব উত্তর লুকান' : 'সব উত্তর দেখুন'}</Text>
            </TouchableOpacity>
          </View>

          {/* Render Cards */}
          <View className="pt-2">
            {filteredData.length === 0 ? (
              <View className="items-center justify-center py-10">
                <FontAwesome5 color="#D7D7D7" name="box-open" size={40}/>
                <Text className="text-[#AFAFAF] text-[16px] mt-4" style={{ fontFamily: 'BanglaBold' }}>এই ক্যাটাগরিতে কোনো প্রশ্ন নেই</Text>
              </View>
            ) : (
              filteredData.map((item, index) => {
                if (item.type === 'mcq') return <MCQCard data={item} key={`mcq_${index}_${item.id}`} globalReveal={globalReveal} />;
                else if (item.type === 'সৃজনশীল') return <CQCard data={item} key={`cq_${index}_${item.id}`} globalReveal={globalReveal} subFilter={activeCategory === 'সৃজনশীল' ? cqSubFilter : 'সব'} />;
                else return <ShortAnswerCard data={item} key={`short_${index}_${item.id}`} globalReveal={globalReveal} />;
              })
            )}
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}