import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ImposterQuiz({ 
  questionText = "নিচের কোনটি রবীন্দ্রনাথ ঠাকুরের উপন্যাস নয়?", 
  options = ["যোগাযোগ", "গোরা", "বিষাদ-সিন্ধু", "শেষের কবিতা"],
  answerWord = "বিষাদ-সিন্ধু",
  onComplete // (isCorrect) => void
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOptionPress = (option) => {
    if (isProcessing) return;
    
    setSelectedOption(option);
    setIsProcessing(true);

    const isCorrect = option === answerWord;
    
    if (onComplete) {
      // জিরো-ফ্রিকশন: সিলেক্ট করার সাথে সাথেই চেক হবে, কিন্তু কালার ট্রানজিশন দেখার জন্য আধা সেকেন্ড ডிலே দেওয়া হলো
      setTimeout(() => {
        onComplete(isCorrect);
      }, 500);
    }
  };

  return (
    <View className="flex-1 w-full mt-4">
      
      {/* হেডার */}
      <View className="flex-row items-center mb-6">
        <View className="bg-[#FF4B4B] w-8 h-8 rounded-full items-center justify-center mr-3 shadow-sm">
          <FontAwesome5 name="user-secret" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1 flex-1" style={{ fontFamily: 'BanglaBold' }}>
          {questionText}
        </Text>
      </View>

      {/* অপশনস লিস্ট (Imposter Hunt) */}
      <View className="mt-2">
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          let bgColor = 'bg-white';
          let borderColor = 'border-[#E5E5E5] border-b-[#D7D7D7]';
          let textColor = 'text-[#4B4B4B]';

          if (isSelected) {
            if (option === answerWord) {
              // সঠিক ইমপোস্টার ধরতে পেরেছে (Green)
              bgColor = 'bg-[#D7FFB8]'; 
              borderColor = 'border-[#58CC02] border-b-[5px] border-b-[#58CC02]'; 
              textColor = 'text-[#58A700]';
            } else {
              // ভুল অপশন সিলেক্ট করেছে (Red)
              bgColor = 'bg-[#FFD7D7]'; 
              borderColor = 'border-[#FF4B4B] border-b-[5px] border-b-[#FF4B4B]'; 
              textColor = 'text-[#D63939]';
            }
          } else if (selectedOption) {
            // অন্য অপশন সিলেক্ট করার পর বাকিগুলোর কালার ফিডকে যাবে
            bgColor = 'bg-[#F5F5F5]'; 
            borderColor = 'border-[#E5E5E5] border-b-[4px] border-[#D7D7D7]'; 
            textColor = 'text-[#AFAFAF]';
          }

          return (
            <TouchableOpacity 
              key={index} 
              activeOpacity={0.8}
              onPress={() => handleOptionPress(option)}
              disabled={isProcessing}
              className={`mb-4 rounded-2xl border-2 border-b-[5px] p-4 flex-row items-center shadow-sm ${bgColor} ${borderColor}`}
            >
              {/* রেডিও বাটন / চেকমার্ক আইকন */}
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${isSelected ? (option === answerWord ? 'border-[#58CC02] bg-[#58CC02]' : 'border-[#FF4B4B] bg-[#FF4B4B]') : 'border-[#E5E5E5] bg-white'}`}>
                  {isSelected && (
                      <FontAwesome5 name={option === answerWord ? 'check' : 'times'} size={10} color="#FFF" />
                  )}
              </View>

              <Text className={`text-lg pt-1 flex-1 ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}