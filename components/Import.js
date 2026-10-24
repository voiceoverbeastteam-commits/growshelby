// File: components/Import.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput, Easing, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Import({ onBack, onImportSuccess }) {
  const insets = useSafeAreaInsets();
  
  const [code, setCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fetchedCommunity, setFetchedCommunity] = useState(null); // 🚀 নতুন স্টেট (প্রিভিউ দেখানোর জন্য)

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ]).start();
  }, []);

  const handleCodeChange = (text) => {
    const formattedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(formattedText);
  };

  const handleFetchCommunity = async () => {
    if (code.length < 6) {
      Alert.alert("ভুল কোড", "অনুগ্রহ করে সঠিক ৬-ডিজিটের কোডটি লিখুন।");
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'Growshelby_MVP_Secret_2026'
        },
        body: JSON.stringify({ 
          action: 'import_community',
          code: code 
        })
      });

      const data = await response.json();

     if (data.success && data.community) {
        // 🚀 সরাসরি কমিউনিটি প্রিভিউ স্টেটে সেট করছি
        setFetchedCommunity(data.community);
      } else {
        Alert.alert("দুঃখিত!", "এই কোডের কোনো কমিউনিটি সার্ভারে পাওয়া যায়নি। কোডটি কি সঠিক?");
      }
    } catch (error) {
      Alert.alert("নেটওয়ার্ক এরর", "সার্ভারের সাথে কানেক্ট করতে সমস্যা হচ্ছে। ইন্টারনেট চেক করে আবার চেষ্টা করুন।");
    } finally {
      setIsImporting(false);
    }
  };

  const handleJoinCommunity = () => {
    // 🚀 ডামি ডেটা সেভ না করে সরাসরি কমিউনিটি ডেটাটা পাঠিয়ে দিচ্ছি
    onImportSuccess(fetchedCommunity); 
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 w-full bg-[#F2F6F9]">
      <View style={{ paddingTop: Math.max(insets.top, 20) + 10 }} className="flex-row items-center justify-between px-5 pb-4 bg-white border-b border-[#E5E5E5]">
        <TouchableOpacity onPress={() => fetchedCommunity ? setFetchedCommunity(null) : onBack()} className="p-2" disabled={isImporting}>
          <FontAwesome5 name="arrow-left" size={18} color={isImporting ? "#D7D7D7" : "#777777"} />
        </TouchableOpacity>
        <Text className="text-[18px] text-[#3C3C3C] pt-1 flex-1 text-center" style={{ fontFamily: 'BanglaBold' }}>
          {fetchedCommunity ? 'কমিউনিটি প্রিভিউ' : 'কমিউনিটি জয়েন'}
        </Text>
        <View className="w-10" />
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }} className="p-6 items-center mt-4">
        
        {fetchedCommunity ? (
          // 🚀 2. Preview Community UI
          <View className="w-full max-w-[340px] bg-white rounded-[24px] p-5 shadow-sm border-2 border-[#E5E5E5]">
            <Image 
              source={{ uri: fetchedCommunity.banner || fetchedCommunity.thumbnail || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000' }} 
              className="w-full h-36 rounded-2xl mb-4 bg-[#E5E5E5]" 
              resizeMode="cover"
            />
            
            <Text className="text-[20px] text-[#3C3C3C] text-center mb-1 leading-7" style={{ fontFamily: 'BanglaBold' }}>
              {fetchedCommunity.notebookName || fetchedCommunity.creatorName || 'স্টাডি কমিউনিটি'}
            </Text>
            
            <Text className="text-[14px] text-[#7B92A5] text-center mb-6" style={{ fontFamily: 'BanglaRegular' }}>
              {fetchedCommunity.chapter || fetchedCommunity.niche || 'সাধারণ স্টুডেন্ট'}
            </Text>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleJoinCommunity} 
              className="w-full"
            >
              <View className="bg-[#58A700] rounded-[20px] pb-[6px]">
                <View className="bg-[#58CC02] rounded-[20px] py-4 flex-row justify-center items-center">
                  <FontAwesome5 name="users" size={16} color="#FFFFFF" />
                  <Text className="text-white text-[18px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>জয়েন করুন</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          // 🚀 1. Input Code UI
          <>
            <View className="bg-[#1899D6]/10 w-24 h-24 rounded-full items-center justify-center mb-6 border-4 border-[#1899D6]/20">
              <FontAwesome5 name="users" size={32} color="#1CB0F6" solid />
            </View>

            <Text className="text-[22px] text-[#3C3C3C] text-center mb-2" style={{ fontFamily: 'BanglaBold' }}>
              সিক্রেট কোড ব্যবহার করো
            </Text>
            <Text className="text-[15px] text-[#7B92A5] text-center px-4 mb-8 leading-6" style={{ fontFamily: 'BanglaRegular' }}>
              তোমার বন্ধুর দেওয়া ৬-ডিজিটের কোডটি নিচে লেখো এবং তার প্রাইভেট কমিউনিটিতে জয়েন করো!
            </Text>

            <View className="w-full max-w-[300px] mb-8">
              <View className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-2 shadow-sm">
                <TextInput
                  className="text-[#3C3C3C] text-[32px] text-center font-bold tracking-[8px] py-4"
                  value={code}
                  onChangeText={handleCodeChange}
                  maxLength={6}
                  placeholder="XXXXXX"
                  placeholderTextColor="#D7D7D7"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isImporting}
                  autoFocus
                />
              </View>
              <Text className="text-center text-[#AFAFAF] text-[13px] mt-3" style={{ fontFamily: 'BanglaBold' }}>
                {code.length}/6 ক্যারেক্টার
              </Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleFetchCommunity} 
              disabled={code.length < 6 || isImporting}
              className="w-full max-w-[300px]"
            >
              <View className={`${code.length === 6 ? 'bg-[#D47B00]' : 'bg-[#E5E5E5]'} rounded-[20px] pb-[6px]`}>
                <View className={`${code.length === 6 ? 'bg-[#FF9600]' : 'bg-[#F0F0F0]'} rounded-[20px] py-4 flex-row justify-center items-center h-[56px]`}>
                  {isImporting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome5 name="search" size={18} color={code.length === 6 ? "#FFFFFF" : "#AFAFAF"} solid />
                      <Text className={`${code.length === 6 ? 'text-white' : 'text-[#AFAFAF]'} text-[18px] ml-3 pt-1`} style={{ fontFamily: 'BanglaBold' }}>
                        কমিউনিটি খুঁজুন
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}