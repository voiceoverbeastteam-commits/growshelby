import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function DragAndDrop({ 
  questionText = "সাল ও ঘটনা সঠিকভাবে মেলাও:", 
  pairs = [
    { left: "১৯৪৭", right: "দেশভাগ" },
    { left: "১৯৫২", right: "ভাষা আন্দোলন" },
    { left: "১৯৭১", right: "মুক্তিযুদ্ধ" }
  ],
  onComplete 
}) {
  const [slots, setSlots] = useState([]); // To store matched items in the right column
  const [availableChips, setAvailableChips] = useState([]); // Items at the bottom pool
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    // Initialize empty slots
    setSlots(Array(pairs.length).fill(null));

    // Extract right side items and shuffle them for the bottom pool
    const rightItems = pairs.map((p, index) => ({ id: `item_${index}`, text: p.right }));
    const shuffled = [...rightItems].sort(() => Math.random() - 0.5);
    setAvailableChips(shuffled);
  }, [pairs]);

  // Tap a chip from the bottom pool to move it to the first empty slot
  const handleTapPoolChip = (chip) => {
    if (isChecking) return;
    
    const firstEmptyIndex = slots.findIndex(s => s === null);
    if (firstEmptyIndex !== -1) {
      const newSlots = [...slots];
      newSlots[firstEmptyIndex] = chip;
      setSlots(newSlots);
    }
  };

  // Tap a filled slot to send the chip back to the pool
  const handleTapSlot = (index) => {
    if (isChecking) return;
    
    if (slots[index] !== null) {
      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
    }
  };

  const handleCheck = () => {
    setIsChecking(true);
    
    let allCorrect = true;
    for (let i = 0; i < pairs.length; i++) {
      if (!slots[i] || slots[i].text !== pairs[i].right) {
        allCorrect = false;
        break;
      }
    }
    
    setIsCorrect(allCorrect);
    
    // কোনো delay ছাড়াই সরাসরি onComplete কল করা হলো
    if (onComplete) {
      onComplete(allCorrect);
    }
  };

  const isAllFilled = slots.every(slot => slot !== null);

  return (
    <View className="flex-1 w-full mt-4">
      
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <View className="bg-[#CE82FF] w-8 h-8 rounded-full items-center justify-center mr-3">
          <FontAwesome5 name="random" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1 flex-1" style={{ fontFamily: 'BanglaBold' }}>
          {questionText}
        </Text>
      </View>

      {/* Timeline Matching Area */}
      <View className="bg-[#CE82FF]/10 p-4 rounded-3xl border-2 border-[#CE82FF]/20 mb-8">
        {pairs.map((pair, index) => {
          const currentChip = slots[index];
          
          // Dynamic Styling for Slots
          let slotBg = 'bg-[#E5E5E5]';
          let slotBorder = 'border-[#D7D7D7] border-2';
          let textColor = 'text-[#4B4B4B]';

          if (currentChip) {
            slotBg = 'bg-white';
            slotBorder = 'border-[#E5E5E5] border-2 border-b-[4px] border-b-[#D7D7D7]';
          }

          if (isChecking && currentChip) {
            if (currentChip.text === pairs[index].right) {
              slotBg = 'bg-[#D7FFB8]';
              slotBorder = 'border-[#58CC02] border-2 border-b-[4px] border-b-[#58CC02]';
              textColor = 'text-[#58A700]';
            } else {
              slotBg = 'bg-[#FFD7D7]';
              slotBorder = 'border-[#FF4B4B] border-2 border-b-[4px] border-b-[#FF4B4B]';
              textColor = 'text-[#D63939]';
            }
          }

          return (
            <View key={`row_${index}`} className="flex-row items-center mb-3">
              
              {/* Left Side (Fixed Timeline Element) */}
              <View className="flex-1 bg-white border-2 border-[#E5E5E5] rounded-2xl p-3 items-center justify-center mr-2 shadow-sm">
                <Text className="text-[17px] text-[#3C3C3C] pt-1 text-center" style={{ fontFamily: 'BanglaBold' }}>
                  {pair.left}
                </Text>
              </View>

              <FontAwesome5 name="arrow-right" size={14} color="#AFAFAF" className="mx-1" />

              {/* Right Side (Drop Slot) */}
              <TouchableOpacity 
                activeOpacity={isChecking ? 1 : 0.7}
                onPress={() => handleTapSlot(index)}
                className={`flex-1 rounded-2xl p-3 ml-2 items-center justify-center min-h-[54px] ${slotBg} ${slotBorder}`}
              >
                <Text className={`text-[15px] pt-1 text-center ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
                  {currentChip ? currentChip.text : ''}
                </Text>
              </TouchableOpacity>

            </View>
          );
        })}
      </View>

      {/* Draggable/Selectable Pool */}
      <View className="flex-row flex-wrap justify-center gap-3">
        {availableChips.map((chip) => {
          const isUsed = slots.find(s => s?.id === chip.id);

          if (isUsed) {
            // Render disabled placeholder
            return (
              <View key={chip.id} className="bg-[#E5E5E5] border-2 border-[#D7D7D7] rounded-2xl px-4 py-3 items-center min-w-[100px]">
                <Text className="text-[15px] text-transparent pt-1" style={{ fontFamily: 'BanglaBold' }}>{chip.text}</Text>
              </View>
            );
          }

          // Active Chip
          return (
            <TouchableOpacity 
              key={chip.id}
              activeOpacity={0.8}
              onPress={() => handleTapPoolChip(chip)}
              className="bg-white border-2 border-[#E5E5E5] border-b-[4px] border-b-[#D7D7D7] rounded-2xl px-4 py-3 items-center min-w-[100px] shadow-sm"
            >
              <Text className="text-[15px] text-[#4B4B4B] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                {chip.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Check Button */}
      <View className="mt-auto pt-8">
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleCheck} 
          disabled={!isAllFilled || isChecking}
          className="w-full"
        >
          <View className={`rounded-2xl pb-[6px] ${isAllFilled ? (isChecking ? (isCorrect ? 'bg-[#58A700]' : 'bg-[#D63939]') : 'bg-[#58A700]') : 'bg-[#CECECE]'}`}>
            <View className={`rounded-2xl pt-4 pb-3 flex-row justify-center items-center ${isAllFilled ? (isChecking ? (isCorrect ? 'bg-[#58CC02]' : 'bg-[#FF4B4B]') : 'bg-[#58CC02]') : 'bg-[#E5E5E5]'}`}>
              <Text className={`text-lg pt-1 ${isAllFilled ? 'text-white' : 'text-[#AFAFAF]'}`} style={{ fontFamily: 'BanglaBold' }}>
                চেক করুন
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

    </View>
  );
}