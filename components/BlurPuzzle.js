import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BlurPuzzle({ 
  questionText = "ঢাকা বিশ্ববিদ্যালয়ের প্রথম উপাচার্য ছিলেন ___।", 
  answerWord = "স্যার পি. জে. হার্টগ",
  options = ["লর্ড কার্জন", "স্যার পি. জে. হার্টগ", "রবীন্দ্রনাথ ঠাকুর"],
  onComplete // (isCorrect) => void
}) {
  const [isMemorizing, setIsMemorizing] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parts, setParts] = useState([]);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ইনিশিয়ালাইজেশন
  useEffect(() => {
    setParts(questionText.split('___'));
    
    // মেমোরি টাইমার অ্যানিমেশন (২.৫ সেকেন্ড)
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // ২.৫ সেকেন্ড পর শব্দটি গায়েব হয়ে যাবে এবং অপশন আসবে
    const hideTimer = setTimeout(() => {
      setIsMemorizing(false);
      // অপশনগুলো স্মুথভাবে ভেসে ওঠার অ্যানিমেশন
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2500);

    return () => clearTimeout(hideTimer);
  }, [questionText]);

  // অপশন সিলেক্ট করার লজিক (জিরো-ফ্রিকশন)
  const handleOptionPress = (option) => {
    if (isProcessing || isMemorizing) return;
    
    setSelectedOption(option);
    setIsProcessing(true);

    const isCorrect = option === answerWord;
    
    if (onComplete) {
      setTimeout(() => {
        onComplete(isCorrect);
      }, 600); // কালার দেখার জন্য ৬০০ মি.সে. ডোপামিন ডেকোরেশন!
    }
  };

  // বাক্য এবং ব্লার বক্স রেন্ডার করার লজিক
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
        let boxBg = 'bg-[#1899D6]';
        let boxBorder = 'border-[#1CB0F6]';
        let textColor = 'text-white';
        let displayText = answerWord;

        if (isMemorizing) {
          // ফেজ ১: মুখস্ত করার সময় (নীল হাইলাইট)
          boxBg = 'bg-[#DDF4FF]';
          boxBorder = 'border-[#1CB0F6] border-b-[4px] border-[#1899D6]';
          textColor = 'text-[#1899D6]';
        } else if (!selectedOption) {
          // ফেজ ২: ব্লার বা গায়েব অবস্থা (ধূসর বাক্স)
          boxBg = 'bg-[#E5E5E5]';
          boxBorder = 'border-[#D7D7D7] border-2';
          textColor = 'text-transparent'; // টেক্সট লুকিয়ে ফেলা হলো
          displayText = '??????';
        } else {
          // ফেজ ৩: উত্তর দেওয়ার পর (সঠিক/ভুল রং)
          displayText = selectedOption;
          if (selectedOption === answerWord) {
            boxBg = 'bg-[#D7FFB8]';
            boxBorder = 'border-[#58CC02] border-b-[4px] border-[#58CC02]';
            textColor = 'text-[#58A700]';
          } else {
            boxBg = 'bg-[#FFD7D7]';
            boxBorder = 'border-[#FF4B4B] border-b-[4px] border-[#FF4B4B]';
            textColor = 'text-[#D63939]';
          }
        }

        elements.push(
          <View 
            key={`blurbox_${index}`} 
            className={`mx-1 px-4 h-[40px] justify-center rounded-xl border-2 ${boxBg} ${boxBorder} min-w-[80px] items-center`}
            style={{ transform: [{ translateY: -4 }] }}
          >
            {/* যদি মেমোরি ফেজ না হয় এবং সিলেক্টও না করে থাকে, তবে প্রশ্নবোধক চিহ্ন দেখাবে */}
            {!isMemorizing && !selectedOption ? (
              <FontAwesome5 name="question" size={16} color="#AFAFAF" />
            ) : (
              <Text className={`text-lg pt-1 ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
                {displayText}
              </Text>
            )}
          </View>
        );
      }
    });

    return <View className="flex-row flex-wrap items-center mt-2">{elements}</View>;
  };

  return (
    <View className="flex-1 w-full mt-4">
      
      {/* হেডার */}
      <View className="flex-row items-center mb-6">
        <View className="bg-[#CE82FF] w-8 h-8 rounded-full items-center justify-center mr-3">
          <MaterialCommunityIcons name="eye-off-outline" size={16} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>
          {isMemorizing ? 'মনোযোগ দিয়ে দেখো:' : 'লুকানো শব্দটি কী ছিল?'}
        </Text>
      </View>

      {/* মেইন বাক্য এরিয়া */}
      <View className="bg-[#CE82FF]/10 p-5 rounded-3xl border-2 border-[#CE82FF]/20 mb-6 min-h-[120px]">
        {renderSentence()}
        
        {/* মেমোরি টাইমার (২.৫ সেকেন্ড পর শেষ হবে) */}
        {isMemorizing && (
          <View className="mt-6 flex-row items-center">
            <FontAwesome5 name="stopwatch" size={14} color="#CE82FF" />
            <View className="flex-1 ml-3 h-1.5 bg-[#CE82FF]/20 rounded-full overflow-hidden">
              <Animated.View 
                className="h-full bg-[#CE82FF] rounded-full" 
                style={{ width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} 
              />
            </View>
          </View>
        )}
      </View>

      {/* অপশন এরিয়া (লুকিয়ে থাকা অবস্থা থেকে ভেসে উঠবে) */}
      {!isMemorizing && (
        <Animated.View style={{ opacity: fadeAnim }} className="mt-2 pb-10">
          {options.map((option, index) => {
            const isSelected = selectedOption === option;
            let bgColor = 'bg-white';
            let borderColor = 'border-[#E5E5E5] border-b-[#D7D7D7]';
            let textColor = 'text-[#4B4B4B]';

            if (isSelected) {
              if (option === answerWord) {
                bgColor = 'bg-[#D7FFB8]'; borderColor = 'border-[#58CC02] border-b-[#58CC02]'; textColor = 'text-[#58A700]';
              } else {
                bgColor = 'bg-[#FFD7D7]'; borderColor = 'border-[#FF4B4B] border-b-[#FF4B4B]'; textColor = 'text-[#D63939]';
              }
            } else if (selectedOption) {
              // অন্য অপশন সিলেক্ট করার পর বাকিগুলো হালকা হয়ে যাবে
              bgColor = 'bg-[#F5F5F5]'; borderColor = 'border-[#E5E5E5]'; textColor = 'text-[#AFAFAF]';
            }

            return (
              <TouchableOpacity 
                key={`opt_${index}`} activeOpacity={0.8}
                onPress={() => handleOptionPress(option)}
                disabled={selectedOption !== null} // একবার সিলেক্ট করলে বাকিগুলো ডিসেবল
                className={`mb-3 rounded-2xl border-2 border-b-[5px] p-4 ${bgColor} ${borderColor}`}
              >
                <Text className={`text-lg pt-1 text-center ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      {/* কোনো 'চেক করুন' বাটন নেই, সম্পূর্ণ জিরো ফ্রিকশন! */}

    </View>
  );
}