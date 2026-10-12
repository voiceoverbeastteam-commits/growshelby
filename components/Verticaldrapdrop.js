import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Verticaldrapdrop({ 
  questionText = "ঘটনাগুলো সঠিক ক্রমানুসারে সাজাও:", 
  correctOrder = [],
  onComplete
}) {
  const [slots, setSlots] = useState([]);
  const [pool, setPool] = useState([]);
  const [slotStates, setSlotStates] = useState([]); // ট্র্যাক করবে কোন বক্স 'default', 'success', নাকি 'error'
  const [isChecking, setIsChecking] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSlots(Array(correctOrder.length).fill(null));
    setSlotStates(Array(correctOrder.length).fill('default'));
    const items = correctOrder.map((text, index) => ({ id: `item_${index}`, text }));
    setPool([...items].sort(() => Math.random() - 0.5));
    setIsChecking(false);
  }, [correctOrder]);

  useEffect(() => {
    const nextEmptyIndex = slots.findIndex(s => s === null);
    if (nextEmptyIndex !== -1 && !isChecking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [slots, isChecking]);

  // ইন্সট্যান্ট চেকিং লজিক (ক্লিক করার সাথে সাথেই চেক হবে)
  const handleTapPoolItem = (item) => {
    if (isChecking) return;
    const nextEmptyIndex = slots.findIndex(s => s === null);
    if (nextEmptyIndex === -1) return;

    setIsChecking(true); // অ্যানিমেশন চলাকালীন অন্য ক্লিক বন্ধ
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    // ১. প্রথমে আইটেমটি হাওয়ায় উড়ে বক্সে গিয়ে বসবে
    const newSlots = [...slots];
    newSlots[nextEmptyIndex] = item;
    setSlots(newSlots);
    setPool(prev => prev.filter(p => p.id !== item.id));

    // ২. চেক করা হবে এটি এই পজিশনের জন্য সঠিক কি না
    if (item.text === correctOrder[nextEmptyIndex]) {
      // সঠিক হলে বক্সটি পার্মানেন্টলি সবুজ হয়ে যাবে
      const newStates = [...slotStates];
      newStates[nextEmptyIndex] = 'success';
      setSlotStates(newStates);

      if (nextEmptyIndex === correctOrder.length - 1) {
        // যদি এটি একদম শেষের অপশন হয়, তাহলে সাকসেস পপ-আপ ট্রিগার করবে
        setTimeout(() => {
          if (onComplete) onComplete(true);
        }, 500);
      } else {
        setIsChecking(false); // পরের ক্লিকের জন্য ওপেন করে দেবে
      }
    } else {
      // ভুল হলে বক্সটি লাল হবে এবং শেক (কাঁপানো) অ্যানিমেশন হবে
      const newStates = [...slotStates];
      newStates[nextEmptyIndex] = 'error';
      setSlotStates(newStates);

      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true })
      ]).start(() => {
        
        // কাঁপার পর আইটেমটি স্প্রিং বাউন্স করে আগের জায়গায় ফেরত আসবে
        setTimeout(() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          
          const revertedSlots = [...newSlots];
          revertedSlots[nextEmptyIndex] = null;
          setSlots(revertedSlots);

          const revertedStates = [...newStates];
          revertedStates[nextEmptyIndex] = 'default';
          setSlotStates(revertedStates);

          setPool(prev => [...prev, item].sort(() => Math.random() - 0.5));

          // আগের মত কুইজ ফেইল না করে ইউজারকে আবার সুযোগ দেওয়া হলো
          setIsChecking(false); 
        }, 300);
      });
    }
  };

  return (
    <View className="w-full mt-4 pb-10">
      <View className="flex-row items-center mb-6">
        <View className="bg-[#1CB0F6] w-8 h-8 rounded-full items-center justify-center mr-3 shadow-sm">
          <FontAwesome5 name="sort-numeric-down" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1 flex-1" style={{ fontFamily: 'BanglaBold' }}>
          {questionText}
        </Text>
      </View>

      <Animated.View 
        style={{ transform: [{ translateX: shakeAnim }] }}
        className="bg-[#1CB0F6]/10 p-4 rounded-3xl border-2 border-[#1CB0F6]/20 mb-6 z-0"
      >
        {slots.map((slotItem, index) => {
          const isNextEmpty = slots.findIndex(s => s === null) === index;
          
          let slotBg = 'bg-[#F5F5F5]';
          let slotBorder = 'border-[#D7D7D7] border-dashed border-2';
          let textColor = 'text-[#4B4B4B]';
          let numberBg = 'bg-white border-[#1CB0F6]/30';
          let numberColor = 'text-[#1899D6]';

          if (slotItem) {
            if (slotStates[index] === 'success') {
              slotBg = 'bg-[#D7FFB8]'; slotBorder = 'border-[#58CC02] border-solid border-2 border-b-[4px] border-b-[#58CC02]';
              textColor = 'text-[#58A700]'; numberBg = 'bg-[#58CC02] border-[#58CC02]'; numberColor = 'text-white';
            } else if (slotStates[index] === 'error') {
              slotBg = 'bg-[#FFD7D7]'; slotBorder = 'border-[#FF4B4B] border-solid border-2 border-b-[4px] border-b-[#FF4B4B]';
              textColor = 'text-[#D63939]'; numberBg = 'bg-[#FF4B4B] border-[#FF4B4B]'; numberColor = 'text-white';
            }
          } else if (isNextEmpty && !isChecking) {
            slotBorder = 'border-[#1CB0F6] border-solid border-2'; slotBg = 'bg-[#DDF4FF]/60';
          }

          return (
            <Animated.View 
              key={`slot_${index}`} 
              className="flex-row items-center mb-3"
              style={isNextEmpty && !isChecking ? { transform: [{ scale: pulseAnim }] } : {}}
            >
              <View className={`border-2 w-8 h-8 rounded-full items-center justify-center mr-3 shadow-sm ${numberBg}`}>
                <Text className={`text-[15px] pt-1 ${numberColor}`} style={{ fontFamily: 'BanglaBold' }}>
                  {index + 1}
                </Text>
              </View>

              <View className="flex-1">
                <View className={`w-full rounded-2xl shadow-sm p-3 min-h-[56px] items-center justify-center ${slotBg} ${slotBorder}`}>
                  <Text className={`text-[16px] pt-1 text-center ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
                    {slotItem ? slotItem.text : ''}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </Animated.View>

      <View className="flex-row flex-wrap justify-center mt-2 relative z-10 px-2 min-h-[120px]">
        {pool.map((item) => (
          <TouchableOpacity
            key={item.id} activeOpacity={0.7} disabled={isChecking}
            onPress={() => handleTapPoolItem(item)}
            className="bg-white border-2 border-solid border-[#E5E5E5] border-b-[4px] border-b-[#D7D7D7] rounded-xl py-2.5 px-4 items-center shadow-sm mx-2 my-2.5"
          >
            <Text className="text-[15px] text-[#4B4B4B] pt-1 text-center" style={{ fontFamily: 'BanglaBold' }}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}