import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function FillInkKeywords({ 
  questionText = "পলাশীর যুদ্ধ হয় ___ সালের ___।", 
  chips = ["১৭৫৭", "২৩ জুন", "১৯৭১", "২৬ মার্চ"], 
  correctAnswers = ["১৭৫৭", "২৩ জুন"],
  onComplete // (isCorrect) => void
}) {
  
  // ১. useMemo দিয়ে ডেটা প্রসেসিং (এতে বারবার রেন্ডার/লুপ হওয়ার চান্স ০%)
  const parts = useMemo(() => questionText.split('___'), [questionText]);
  const blanksCount = parts.length - 1;
  
  const availableChips = useMemo(() => {
    return chips.map((word, index) => ({ id: `chip_${index}`, word }));
  }, [JSON.stringify(chips)]);

  // ২. স্টেট 
  const [filledBlanks, setFilledBlanks] = useState(() => Array(blanksCount).fill(null));
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  // যদি প্রশ্ন চেঞ্জ হয়, শুধু তখনই ব্ল্যাংকগুলো রিসেট হবে
  useEffect(() => {
    setFilledBlanks(Array(blanksCount).fill(null));
    setIsChecking(false);
    setIsCorrect(null);
  }, [questionText, blanksCount]);

  // ৩. স্মার্ট অটো-চেক লজিক (নিরাপদ)
  useEffect(() => {
    let autoCheckTimer;
    const isAllFilled = filledBlanks.length > 0 && filledBlanks.every(blank => blank !== null);
    
    if (isAllFilled && !isChecking) {
      // আধা সেকেন্ড ওয়েট করবে।
      autoCheckTimer = setTimeout(() => {
        handleCheck();
      }, 500); 
    }

    return () => {
      if (autoCheckTimer) clearTimeout(autoCheckTimer);
    };
  }, [filledBlanks, isChecking]);

  const handleTapAvailableChip = (chip) => {
    if (isChecking) return;
    
    const firstEmptyIndex = filledBlanks.findIndex(b => b === null);
    if (firstEmptyIndex !== -1) {
      const newFilledBlanks = [...filledBlanks];
      newFilledBlanks[firstEmptyIndex] = chip;
      setFilledBlanks(newFilledBlanks);
    }
  };

  const handleTapFilledBlank = (index) => {
    if (isChecking) return;
    
    if (filledBlanks[index] !== null) {
      const newFilledBlanks = [...filledBlanks];
      newFilledBlanks[index] = null;
      setFilledBlanks(newFilledBlanks);
    }
  };

  const handleCheck = () => {
    if (isChecking) return; // ডাবল কল প্রিভেন্ট করা
    setIsChecking(true);
    
    let allCorrect = true;
    for (let i = 0; i < blanksCount; i++) {
      if (!filledBlanks[i] || filledBlanks[i].word !== correctAnswers[i]) {
        allCorrect = false;
        break;
      }
    }
    
    setIsCorrect(allCorrect);
    
    if (onComplete) {
      setTimeout(() => {
        onComplete(allCorrect);
      }, 1000); 
    }
  };

  const renderSentence = () => {
    let elements = [];
    
    parts.forEach((part, index) => {
      if (part) {
        elements.push(
          <Text key={`text_${index}`} className="text-xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold', lineHeight: 40 }}>
            {part}
          </Text>
        );
      }

      if (index < parts.length - 1) {
        const currentChip = filledBlanks[index];
        
        let blankBg = 'bg-[#E5E5E5]';
        let blankBorder = 'border-[#D7D7D7]';
        let textColor = 'text-[#4B4B4B]';
        
        if (currentChip) {
          blankBg = 'bg-white';
          blankBorder = 'border-[#E5E5E5] border-b-[4px] border-b-[#D7D7D7]';
        }
        
        if (isChecking && currentChip) {
          if (currentChip.word === correctAnswers[index]) {
            blankBg = 'bg-[#D7FFB8]';
            blankBorder = 'border-[#58CC02] border-b-[4px] border-b-[#58CC02]';
            textColor = 'text-[#58A700]';
          } else {
            blankBg = 'bg-[#FFD7D7]';
            blankBorder = 'border-[#FF4B4B] border-b-[4px] border-b-[#FF4B4B]';
            textColor = 'text-[#D63939]';
          }
        }

        elements.push(
          <TouchableOpacity 
            key={`blank_${index}`} 
            activeOpacity={isChecking ? 1 : 0.7}
            onPress={() => handleTapFilledBlank(index)}
            className={`mx-1 px-4 h-[42px] justify-center rounded-xl border-2 ${blankBg} ${blankBorder} min-w-[80px] items-center`}
            style={{ transform: [{ translateY: -4 }] }} 
          >
            <Text className={`text-lg pt-1 ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
              {currentChip ? currentChip.word : ''}
            </Text>
          </TouchableOpacity>
        );
      }
    });

    return (
      <View className="flex-row flex-wrap items-center mt-2">
        {elements}
      </View>
    );
  };

  return (
    <View className="flex-1 w-full mt-4">
      
      {/* Instruction Header */}
      <View className="flex-row items-center mb-6">
        <View className="bg-[#1CB0F6] w-8 h-8 rounded-full items-center justify-center mr-3">
          <FontAwesome5 name="pen" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>
          সঠিক শব্দ বসিয়ে শূন্যস্থান পূরণ করো:
        </Text>
      </View>

      {/* Sentence Area (Drop Zone) */}
      <View className="bg-[#1CB0F6]/10 p-5 rounded-2xl border-2 border-[#1CB0F6]/20 mb-8 min-h-[120px]">
        {renderSentence()}
      </View>

      {/* Chips Area (Available Options) */}
      <View className="flex-row flex-wrap justify-center gap-3">
        {availableChips.map((chip) => {
          const isUsed = filledBlanks.find(b => b?.id === chip.id);
          
          if (isUsed) {
            return (
              <View key={chip.id} className="bg-[#E5E5E5] border-2 border-[#D7D7D7] rounded-xl px-5 py-3 min-w-[90px] items-center">
                <Text className="text-lg text-transparent pt-1" style={{ fontFamily: 'BanglaBold' }}>{chip.word}</Text>
              </View>
            );
          }

          return (
            <TouchableOpacity 
              key={chip.id}
              activeOpacity={0.8}
              onPress={() => handleTapAvailableChip(chip)}
              className="bg-white border-2 border-[#E5E5E5] border-b-[5px] border-b-[#D7D7D7] rounded-xl px-5 py-3 min-w-[90px] items-center shadow-sm"
            >
              <Text className="text-lg text-[#4B4B4B] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                {chip.word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}