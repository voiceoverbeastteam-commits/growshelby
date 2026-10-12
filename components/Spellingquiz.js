import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function Spellingquiz({
  questionText = "সঠিক বানানটি তৈরি করো",
  word = "",
  scrambledLetters = [],
  onComplete
}) {
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    // Letter gulo ke unique ID diye available list e set kora
    setAvailable(
      scrambledLetters.map((letter, index) => ({
        id: index,
        letter,
        used: false,
      }))
    );
    setSelected([]);
  }, [word, scrambledLetters]);

  const handleSelect = (item) => {
    if (item.used) return;
    
    // Nicher available grid theke letter select kore upore block e pathano
    const newSelected = [...selected, item];
    setSelected(newSelected);

    const newAvailable = available.map((x) =>
      x.id === item.id ? { ...x, used: true } : x
    );
    setAvailable(newAvailable);

    // Jodi sob gulo slot puron hoye jay tahole check korbe
    if (newSelected.length === word.length) {
      const formedWord = newSelected.map((x) => x.letter).join('');
      setTimeout(() => {
        if (onComplete) {
          onComplete(formedWord === word);
        }
      }, 300);
    }
  };

  const handleDeselect = (item, index) => {
    // Uporer block theke letter remove kore abar niche available e pathano
    const newSelected = [...selected];
    newSelected.splice(index, 1);
    setSelected(newSelected);

    const newAvailable = available.map((x) =>
      x.id === item.id ? { ...x, used: false } : x
    );
    setAvailable(newAvailable);
  };

  return (
    <View className="flex-1 w-full mt-4">
      {/* Header Section */}
      <View className="flex-row items-center mb-8 px-2">
        <View className="bg-[#1CB0F6] w-8 h-8 rounded-full items-center justify-center mr-3 shadow-sm">
          <FontAwesome5 name="spell-check" size={14} color="#FFF" />
        </View>
        <Text
          className="text-xl text-[#3C3C3C] pt-1 flex-1 leading-8"
          style={{ fontFamily: 'BanglaBold' }}
        >
          {questionText}
        </Text>
      </View>

      {/* Selected Letters (Empty Slots) */}
      <View className="flex-row flex-wrap justify-center mb-10 px-2">
        {Array.from({ length: word.length }).map((_, idx) => {
          const selItem = selected[idx];
          return (
            <TouchableOpacity
              key={`slot-${idx}`}
              activeOpacity={0.7}
              onPress={() => selItem && handleDeselect(selItem, idx)}
              className={`m-1 w-10 h-12 md:w-12 md:h-14 rounded-xl items-center justify-center shadow-sm ${
                selItem
                  ? 'bg-white border-2 border-[#E5E5E5] border-b-4'
                  : 'bg-[#F5F5F5] border-2 border-dashed border-[#D7D7D7]'
              }`}
            >
              <Text
                className="text-2xl text-[#4B4B4B] pt-1"
                style={{ fontFamily: 'BanglaBold' }}
              >
                {selItem ? selItem.letter : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Available Letters Grid */}
      <View className="flex-row flex-wrap justify-center px-4">
        {available.map((item) => (
          <TouchableOpacity
            key={`avail-${item.id}`}
            activeOpacity={0.7}
            disabled={item.used}
            onPress={() => handleSelect(item)}
            className={`m-1.5 w-11 h-12 md:w-12 md:h-14 rounded-xl items-center justify-center shadow-sm ${
              item.used
                ? 'bg-[#F5F5F5] border-2 border-[#E5E5E5] opacity-50'
                : 'bg-white border-2 border-[#E5E5E5] border-b-4'
            }`}
          >
            <Text
              className={`text-2xl pt-1 ${
                item.used ? 'text-transparent' : 'text-[#4B4B4B]'
              }`}
              style={{ fontFamily: 'BanglaBold' }}
            >
              {item.letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}