import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TapTheMistake({ 
  questionText = "নিচের বাক্য থেকে ভুল শব্দটি খুঁজে বের করে ট্যাপ করো:", 
  sentence = ["বাংলাদেশের", "জাতীয়", "পাখি", "হলো", "দোয়েল,", "যা", "সাধারণত", "পাহাড়ি", "অঞ্চলে", "বেশি", "দেখা", "যায়।"],
  wrongWordIndex = 7, // 'পাহাড়ি' শব্দটির ইনডেক্স
  onComplete // (isCorrect) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWordPress = (index) => {
    if (isProcessing) return;
    
    setSelectedIndex(index);
    setIsProcessing(true);

    const isCorrect = index === wrongWordIndex;
    
    if (onComplete) {
      // জিরো-ফ্রিকশন: ট্যাপ করার পর কালার ট্রানজিশন দেখার জন্য ৬০০ মিলি-সেকেন্ড ডிலே
      setTimeout(() => {
        onComplete(isCorrect);
      }, 600);
    }
  };

  return (
    <View className="flex-1 w-full mt-4">
      
      {/* হেডার */}
      <View className="flex-row items-center mb-6">
        <View className="bg-[#8B46FF] w-8 h-8 rounded-full items-center justify-center mr-3 shadow-sm">
          <FontAwesome5 name="search" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1 flex-1" style={{ fontFamily: 'BanglaBold' }}>
          {questionText}
        </Text>
      </View>

      {/* ইন্টারঅ্যাক্টিভ বাক্য (Interactive Sentence) */}
      <View className="bg-[#8B46FF]/10 p-5 rounded-2xl border-2 border-[#8B46FF]/20 mt-2">
        <View className="flex-row flex-wrap items-center">
          {sentence.map((word, index) => {
            const isSelected = selectedIndex === index;
            
            // ডিফল্ট স্টাইল (নরমাল টেক্সট কিন্তু ট্যাপ করার মত ফিল)
            let bgColor = 'bg-transparent';
            let borderColor = 'border-transparent';
            let textColor = 'text-[#4B4B4B]';
            let borderBottom = '';

            // যদি স্টুডেন্ট এই শব্দটিতে ট্যাপ করে
            if (isSelected) {
              if (index === wrongWordIndex) {
                // সঠিক ভুলটি ধরেছে (Green)
                bgColor = 'bg-[#D7FFB8]'; 
                borderColor = 'border-[#58CC02]'; 
                textColor = 'text-[#58A700]';
                borderBottom = 'border-b-[4px]';
              } else {
                // ভুল শব্দ সিলেক্ট করেছে (Red)
                bgColor = 'bg-[#FFD7D7]'; 
                borderColor = 'border-[#FF4B4B]'; 
                textColor = 'text-[#D63939]';
                borderBottom = 'border-b-[4px]';
              }
            } else if (selectedIndex !== null) {
              // অন্য শব্দ সিলেক্ট করার পর বাকিগুলো হালকা হয়ে যাবে
              textColor = 'text-[#AFAFAF]';
            }

            return (
              <TouchableOpacity 
                key={index}
                activeOpacity={0.7}
                onPress={() => handleWordPress(index)}
                disabled={isProcessing}
                className={`mx-[2px] my-1.5 px-2 py-1.5 rounded-lg border-2 ${bgColor} ${borderColor} ${borderBottom}`}
              >
                <Text className={`text-[19px] pt-1 ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
                  {word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

    </View>
  );
}