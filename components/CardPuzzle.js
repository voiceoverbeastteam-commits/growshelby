import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CardPuzzle({ 
  questionText = "সঠিক জোড়া মেলাও:", 
  pairs = [],
  onComplete 
}) {
  const [cards, setCards] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [matchedMatchIds, setMatchedMatchIds] = useState([]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // ১. কার্ডগুলো তৈরি এবং এলোমেলো (Shuffle) করা
  useEffect(() => {
    if (!pairs || pairs.length === 0) return;
    
    let initialCards = [];
    pairs.forEach((p, index) => {
      initialCards.push({ id: `L_${index}`, matchId: index, text: p.left });
      initialCards.push({ id: `R_${index}`, matchId: index, text: p.right });
    });
    
    initialCards.sort(() => Math.random() - 0.5);
    setCards(initialCards);
  }, [pairs]);

  // ২. অটোমেটিক সাবমিট লজিক (সবগুলো কার্ড মিলে গেলে)
  useEffect(() => {
    if (pairs && pairs.length > 0 && matchedMatchIds.length === pairs.length) {
      const timer = setTimeout(() => {
        if (onComplete) {
          // যেহেতু স্টুডেন্ট সবগুলো মিলিয়েছে, তাই সে ১০০% সঠিক! (true পাস করা হলো)
          onComplete(true); 
        }
      }, 500); // কার্ডগুলো গায়েব হওয়ার পর জাস্ট আধা সেকেন্ড ওয়েট করবে
      
      return () => clearTimeout(timer);
    }
  }, [matchedMatchIds, pairs, onComplete]);

  // ৩. কার্ড ট্যাপ করার লজিক
  const handleCardPress = (card) => {
    if (isProcessing) return;
    if (matchedMatchIds.includes(card.matchId)) return; // মিলে যাওয়া কার্ড ট্যাপ করা যাবে না

    // একই কার্ড দু'বার ট্যাপ করলে আনসিলেক্ট হবে
    if (selectedIds.includes(card.id)) {
      setSelectedIds([]);
      return;
    }

    if (selectedIds.length === 0) {
      // প্রথম কার্ড সিলেক্ট
      setSelectedIds([card.id]);
    } else if (selectedIds.length === 1) {
      // দ্বিতীয় কার্ড সিলেক্ট
      const firstCardId = selectedIds[0];
      const firstCard = cards.find(c => c.id === firstCardId);
      
      setSelectedIds([firstCardId, card.id]);
      setIsProcessing(true);

      // ম্যাচিং চেক করা
      if (firstCard.matchId === card.matchId) {
        // মিলে গেছে! (Match)
        setTimeout(() => {
          setMatchedMatchIds(prev => [...prev, card.matchId]);
          setSelectedIds([]);
          setIsProcessing(false);
        }, 500); // সবুজ রং দেখানোর জন্য ৫০০ মি.সে. ওয়েট
      } else {
        // মেলেনি! (Mismatch)
        setTimeout(() => {
          setSelectedIds([]);
          setIsProcessing(false);
        }, 700); // লাল রং দেখানোর জন্য ৭০০ মি.সে. ওয়েট
      }
    }
  };

  return (
    <View className="flex-1 w-full mt-4">
      
      {/* হেডার */}
      <View className="flex-row items-center mb-6">
        <View className="bg-[#FF9600] w-8 h-8 rounded-full items-center justify-center mr-3">
          <FontAwesome5 name="puzzle-piece" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1 flex-1" style={{ fontFamily: 'BanglaBold' }}>
          {questionText}
        </Text>
      </View>

      {/* কার্ড গ্রিড */}
      <View className="flex-row flex-wrap justify-between">
        {cards.map((card) => {
          const isMatched = matchedMatchIds.includes(card.matchId);
          const isSelected = selectedIds.includes(card.id);
          
          let bgColor = 'bg-white';
          let borderColor = 'border-[#E5E5E5] border-b-[5px] border-b-[#D7D7D7]';
          let textColor = 'text-[#4B4B4B]';

          if (isSelected) {
            if (selectedIds.length === 2) {
              const otherCardId = selectedIds.find(id => id !== card.id);
              const otherCard = cards.find(c => c.id === otherCardId);
              
              if (otherCard && otherCard.matchId === card.matchId) {
                // সঠিক হয়েছে (Green)
                bgColor = 'bg-[#D7FFB8]'; 
                borderColor = 'border-[#58CC02] border-b-[5px] border-b-[#58CC02]';
                textColor = 'text-[#58A700]';
              } else {
                // ভুল হয়েছে (Red)
                bgColor = 'bg-[#FFD7D7]'; 
                borderColor = 'border-[#FF4B4B] border-b-[5px] border-b-[#FF4B4B]';
                textColor = 'text-[#D63939]';
              }
            } else {
              // একটি কার্ড সিলেক্টেড (Blue)
              bgColor = 'bg-[#DDF4FF]'; 
              borderColor = 'border-[#1CB0F6] border-b-[5px] border-b-[#1899D6]';
              textColor = 'text-[#1899D6]';
            }
          }

          return (
            <TouchableOpacity 
              key={card.id}
              activeOpacity={0.8}
              onPress={() => handleCardPress(card)}
              disabled={isMatched || isProcessing}
              style={{ width: '48%', opacity: isMatched ? 0 : 1 }} 
              className={`mb-4 rounded-2xl border-2 px-3 py-4 items-center justify-center min-h-[70px] shadow-sm ${bgColor} ${borderColor}`}
            >
              <Text className={`text-[16px] text-center pt-1 ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>
                {card.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}