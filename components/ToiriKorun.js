import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform, Animated, Alert, Switch, LayoutAnimation, UIManager, ActivityIndicator, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { processWithGuideEngine } from './AiGuideEngine';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ToiriKorun({ onBack, onSave }) {
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [generatedContent, setGeneratedContent] = useState(null);
  
  const [notebookName, setNotebookName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [thumbnail, setThumbnail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false); // 🚀 নতুন আপলোডিং স্টেট

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [aiStatusText, setAiStatusText] = useState('');

  // 🚀 Added banner and bio to state to send to backend
  const [currentUser, setCurrentUser] = useState({ name: 'শিক্ষার্থী', avatar: null, email: 'guest', niche: 'সাধারণ শিক্ষার্থী', banner: '', bio: '' });

  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingMessages = [
    "বইয়ের পাতা স্ক্যান করা হচ্ছে 🔍",
    "এআই প্রশ্নগুলো পড়ে দেখছে 🤖",
    "প্রশ্ন ও উত্তরগুলো সুন্দর করে সাজানো হচ্ছে 📑",
    "তোমার স্মার্ট গাইড প্রায় রেডি ⚡"
  ];

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [tapCount, setTapCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const uid = await AsyncStorage.getItem('@current_user_id') || 'guest_' + Date.now();
        const personalName = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || 'শিক্ষার্থী';
        const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || await AsyncStorage.getItem('@user_avatar') || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        const niche = await AsyncStorage.getItem(`@channel_niche_${uid}`) || 'সাধারণ শিক্ষার্থী';
        
        // 🚀 THE ROOT CAUSE FIX: Fetching Community Data properly
        const isCreator = await AsyncStorage.getItem(`@is_creator_${uid}`) === 'true';
        const commName = await AsyncStorage.getItem(`@comm_name_${uid}`);
        const commBanner = await AsyncStorage.getItem(`@comm_banner_${uid}`);
        const commDesc = await AsyncStorage.getItem(`@comm_desc_${uid}`);

        // If user is a creator, use Community Name/Banner/Bio, otherwise use personal data
        const finalName = (isCreator && commName) ? commName : personalName;
        const finalBanner = (isCreator && commBanner) ? commBanner : '';
        const finalBio = (isCreator && commDesc) ? commDesc : '';
        
        setCurrentUser({ 
          email: uid, 
          name: finalName, 
          avatar: avatar, 
          niche: niche,
          banner: finalBanner,
          bio: finalBio
        });
      } catch (error) {
        console.log(error);
      }
    };
    fetchUser();
  }, []);

  const handleTapToBoost = () => {
    setTapCount(prev => prev + 1);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  }, [currentStep]);

  useEffect(() => {
    let interval;
    if (currentStep === 2) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentStep]);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("পারমিশন প্রয়োজন", "ছবি তোলার জন্য ক্যামেরার পারমিশন দিন।");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0].uri) {
      // 🚀 ম্যাজিক: ক্যামেরার বিশাল ছবিকে কম্প্রেস করে ছোট করা হচ্ছে
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1000 } }], // পড়ার মতো টেক্সট যেন ক্লিয়ার থাকে তাই ১০০০ পিক্সেল
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      addFile({ ...result.assets[0], uri: manipResult.uri }, 'image');
    }
  };

 const pickFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0].uri) {
      // 🚀 ম্যাজিক: গ্যালারির ছবিকে কম্প্রেস করা হচ্ছে
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1000 } }], 
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      addFile({ ...result.assets[0], uri: manipResult.uri }, 'image');
    }
  };

  const handleAddText = () => {
    if (inputText.trim().length < 10) {
      Alert.alert("মনোযোগ দিন", "দয়া করে অন্তত ১০ অক্ষরের কিছু লিখুন বা পেস্ট করুন।");
      return;
    }
    addFile({ uri: 'text', text: inputText, name: 'টেক্সট সোর্স' }, 'text');
    setInputText("");
    setIsTextInputVisible(false);
  };

  const addFile = (file, type) => {
    setSelectedFiles(prev => [...prev, { ...file, type, id: Math.random().toString() }]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  // 🚀 ImgBB Upload Helper
  const uploadImageToImgBB = async (base64String) => {
    try {
      let formData = new FormData();
      formData.append("image", base64String);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=266dc6accf170af21b0a679770bcd7bb`, {
        method: "POST", body: formData
      });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (e) { return null; }
  };

  const pickThumbnail = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8, 
    });

    if (!result.canceled && result.assets[0].uri) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri, [{ resize: { width: 600 } }], 
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      if (manipResult.base64) {
        setThumbnail(`data:image/jpeg;base64,${manipResult.base64}`);
        setIsImageUploading(true); // 🚀 সেভ বাটন লক করা হলো
        
        const imgUrl = await uploadImageToImgBB(manipResult.base64);
        if (imgUrl) setThumbnail(imgUrl);
        
        setIsImageUploading(false); // 🚀 সেভ বাটন আনলক করা হলো
      }
    }
  };

  const handleStartMagic = async () => {
    if (selectedFiles.length === 0) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep(2); 
    
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 85,
      duration: 12000, 
      useNativeDriver: false,
    }).start();

    try {
      const imagesList = selectedFiles.filter(f => f.type === 'image').map(f => ({ uri: f.uri, mimeType: f.mimeType || 'image/jpeg' }));
      const textList = selectedFiles.filter(f => f.type === 'text').map(f => f.text).join('\n\n');

      const data = await processWithGuideEngine({
        images: imagesList,
        rawText: textList,
        onStatusChange: setAiStatusText
      });

      if (data && data.length > 0) {
        setGeneratedContent(data);
        Animated.timing(progressAnim, { toValue: 100, duration: 500, useNativeDriver: false }).start(() => {
          setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentStep(3); 
          }, 300);
        });
      }
    } catch (error) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(1); 

      if (error.message === "PREMIUM_REQUIRED") {
        setShowPremiumModal(true);
      } else {
        Alert.alert('এআই এরর', error.message || 'ডিজিটাইজেশন ফেইল করেছে!');
      }
    }
  };

 const handleFinalSave = () => {
    if (!notebookName.trim()) {
      Alert.alert('নাম প্রয়োজন', 'গাইডের একটি সুন্দর টাইটেল দিন!');
      return;
    }
    
    if (!thumbnail) {
      Alert.alert('কভার ছবি প্রয়োজন', 'গাইডের জন্য একটি সুন্দর কভার ছবি সিলেক্ট করুন!');
      return;
    }

    setIsSaving(true);

    const newGuideData = {
      id: 'guide_' + Date.now(),
      notebookName: notebookName.trim(),
      description: description.trim(),
      target: currentUser.niche,
      questionCount: generatedContent?.length || 0, 
      isPublic: isPublic,
      thumbnail: thumbnail,
      creatorName: currentUser.name, 
      creatorAvatar: currentUser.avatar,
      creatorEmail: currentUser.email,
      channelId: currentUser.email,
      banner: currentUser.banner,    
      bio: currentUser.bio,          
      views: 0,
      failedItems: generatedContent
    };

    // 🚀 ম্যাজিক ফিক্স (Background Sync / Instant Save):
    
    // ১. চোখের পলকে স্ক্রিন বন্ধ করার জন্য মডালটিকে কমান্ড দেওয়া হলো
    if (onBack) onBack(); 

    // ২. UI যেন একটুও আটকে না থাকে, তাই ব্যাকগ্রাউন্ডে ডেটা সেভ হওয়ার জন্য ইভেন্ট লুপে পাঠানো হলো
    setTimeout(() => {
      onSave(newGuideData);
    }, 0);
  };

  const handleBackPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (currentStep === 3) setCurrentStep(1); 
    else if (currentStep === 2) { /* Block */ }
    else onBack();
  };

  const renderStepProgressBar = () => (
    <View className="flex-row items-center justify-center space-x-2 my-2">
      {[1, 2, 3].map((step, i) => {
        const isActive = currentStep >= step;
        return (
          <View key={i} className={`h-2 rounded-full ${isActive ? 'w-8 bg-[#1CB0F6]' : 'w-4 bg-[#E5E5E5]'}`} />
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 w-full bg-[#F7F9FA]">
      <View style={{ paddingTop: Math.max(insets.top, 20) + 10 }} className="px-5 pb-3 bg-white border-b border-[#E5E5E5] z-10 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBackPress} activeOpacity={0.7} className="p-2 -ml-2" disabled={currentStep === 2}>
            <FontAwesome5 name="arrow-left" size={18} color={currentStep === 2 ? "#D7D7D7" : "#777777"} />
          </TouchableOpacity>
          <Text className="text-[18px] text-[#3C3C3C] pt-1 text-center" style={{ fontFamily: 'BanglaBold' }}>
            {currentStep === 1 ? 'নতুন গাইড তৈরি' : currentStep === 2 ? 'এআই মাস্টারমাইন্ড...' : 'ফাইনাল টাচ'}
          </Text>
          <View className="w-8" />
        </View>
        {currentStep !== 2 && renderStepProgressBar()}
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          
          {currentStep === 1 && (
            <View>
              <View className="border-2 border-dashed border-[#1CB0F6] bg-[#EAF6FE] rounded-[24px] p-6 items-center mb-6 mt-2 relative overflow-hidden">
                <View className="items-center mb-5 z-10 mt-2">
                  <View className="bg-white w-14 h-14 rounded-full items-center justify-center mb-3 shadow-sm border border-[#E5E5E5]">
                    <FontAwesome5 name="file-upload" size={20} color="#1CB0F6" />
                  </View>
                  <Text className="text-[19px] text-[#3C3C3C] text-center" style={{ fontFamily: 'BanglaBold' }}>কী থেকে গাইড বানাবেন?</Text>
                </View>

                {isTextInputVisible ? (
                  <View className="mt-6 w-full bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden z-10">
                    <TextInput
                      className="text-[#3C3C3C] p-4 min-h-[120px] text-[15px]"
                      style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                      multiline
                      placeholder="এখানে বইয়ের টেক্সট পেস্ট করো..."
                      placeholderTextColor="#AFAFAF"
                      value={inputText}
                      onChangeText={setInputText}
                      autoFocus
                    />
                    <View className="flex-row justify-end p-2 border-t border-[#F0F0F0] space-x-2 bg-[#F9F9F9]">
                      <TouchableOpacity onPress={() => setIsTextInputVisible(false)} className="px-4 py-2 rounded-xl bg-[#E5E5E5] mr-2">
                        <Text className="text-[#777777] text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleAddText} className="px-5 py-2 rounded-xl bg-[#58CC02]">
                        <Text className="text-white text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>যুক্ত করো</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="w-full mt-6 z-10">
                    <View className="flex-row space-x-3 w-full mb-3">
                      <TouchableOpacity activeOpacity={0.8} onPress={openCamera} className="flex-1">
                        <View className="bg-[#58A700] rounded-[16px] pb-[5px]">
                          <View className="bg-[#58CC02] rounded-[16px] py-3.5 flex-row justify-center items-center">
                            <FontAwesome5 name="camera" size={16} color="#FFF" />
                            <Text className="text-white ml-2 text-[15px] pt-1" style={{fontFamily: 'BanglaBold'}}>ছবি তোলো</Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity activeOpacity={0.8} onPress={pickFromGallery} className="flex-1">
                        <View className="bg-[#1073A4] rounded-[16px] pb-[5px]">
                          <View className="bg-[#1899D6] rounded-[16px] py-3.5 flex-row justify-center items-center">
                            <FontAwesome5 name="image" size={16} color="#FFF" />
                            <Text className="text-white ml-2 text-[15px] pt-1" style={{fontFamily: 'BanglaBold'}}>গ্যালারি</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity activeOpacity={0.8} onPress={() => setIsTextInputVisible(true)} className="w-full">
                      <View className="bg-[#E5E5E5] rounded-[16px] pb-[5px]">
                        <View className="bg-white rounded-[16px] py-3.5 flex-row justify-center items-center border-2 border-[#E5E5E5] border-b-0">
                          <FontAwesome5 name="file-alt" size={16} color="#777777" solid />
                          <Text className="text-[#777777] ml-2 text-[15px] pt-1" style={{fontFamily: 'BanglaBold'}}>টেক্সট পেস্ট করো</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {selectedFiles.length > 0 && (
                <View className="mb-6 max-h-[180px]">
                  <Text className="text-[15px] text-[#3C3C3C] mb-2 px-1" style={{ fontFamily: 'BanglaBold' }}>বইয়ের পাতা যুক্ত করা হয়েছে:</Text>
                  <ScrollView showsVerticalScrollIndicator={false} className="bg-white rounded-2xl p-2 border-2 border-[#E5E5E5]">
                    {selectedFiles.map((item) => (
                      <View key={item.id} className="flex-row items-center justify-between bg-[#F9F9F9] p-2 rounded-xl mb-2 border border-[#F0F0F0]">
                        <View className="flex-row items-center flex-1 pr-2">
                          {item.type === 'image' ? (
                            <Image source={{ uri: item.uri }} className="w-10 h-10 rounded-lg border border-[#E5E5E5]" />
                          ) : (
                            <View className="w-10 h-10 bg-[#E8D7FF] items-center justify-center rounded-lg">
                              <FontAwesome5 name="align-left" size={18} color="#A559D6" />
                            </View>
                          )}
                          <Text className="text-[13px] text-[#4B4B4B] ml-3 flex-1 pt-1" numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: 'BanglaBold' }}>
                            {item.name || item.fileName || "ক্যামেরার ছবি"}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeFile(item.id)} className="p-3 bg-white rounded-lg shadow-sm border border-[#E5E5E5]">
                          <FontAwesome5 name="trash-alt" size={14} color="#FF4B4B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity activeOpacity={0.8} onPress={handleStartMagic} className="w-full mt-2" disabled={selectedFiles.length === 0}>
                <View style={{ backgroundColor: selectedFiles.length > 0 ? '#58A700' : '#E5E5E5', borderRadius: 16, paddingBottom: 6 }}>
                  <View style={{ backgroundColor: selectedFiles.length > 0 ? '#58CC02' : '#F0F0F0', borderRadius: 16, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesome5 name={selectedFiles.length > 0 ? "bolt" : "lock"} size={18} color={selectedFiles.length > 0 ? "#FFFFFF" : "#AFAFAF"} solid />
                    <Text className={`ml-2 text-[18px] pt-1 ${selectedFiles.length > 0 ? "text-white" : "text-[#AFAFAF]"}`} style={{ fontFamily: 'BanglaBold' }}>
                      {selectedFiles.length > 0 ? "⚡ স্মার্ট গাইড তৈরি করো" : "আগে বইয়ের ছবি দাও..."}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 2 && (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-[18px] text-[#3C3C3C] text-center mb-10 px-4 leading-7" style={{fontFamily: 'BanglaBold'}}>
                {aiStatusText.includes("বিজি") ? aiStatusText : loadingMessages[loadingTextIndex]}
              </Text>

              <TouchableOpacity activeOpacity={0.9} onPress={handleTapToBoost} className="items-center justify-center mb-6">
                <Animated.View 
                  style={{ transform: [{ scale: scaleAnim }] }}
                  className="bg-[#EAF6FE] w-32 h-32 rounded-full border-4 border-[#1CB0F6] items-center justify-center shadow-lg"
                >
                  <FontAwesome5 name="brain" size={50} color="#1CB0F6" solid />
                </Animated.View>
                <View className="bg-[#FF9600] px-4 py-1.5 rounded-full absolute -bottom-3 border-2 border-white shadow-sm">
                  <Text className="text-white text-[12px] pt-0.5" style={{fontFamily: 'BanglaBold'}}>TAP TO BOOST!</Text>
                </View>
              </TouchableOpacity>

              <Text className="text-[14px] text-[#AFAFAF] text-center mb-6 mt-2" style={{fontFamily: 'BanglaBold'}}>
                AI-কে এনার্জি দাও! (পাওয়ার: {tapCount}⚡)
              </Text>

              <View className="w-full bg-[#E5E5E5] h-4 rounded-full overflow-hidden border border-[#D7D7D7] mb-2">
                <Animated.View 
                  className="h-full bg-[#58CC02] rounded-full"
                  style={{ width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }}
                />
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View>
              <View className="bg-[#D7FFB8] p-6 rounded-[24px] border-2 border-[#58CC02] border-b-4 mb-6 items-center">
                <View className="bg-white w-16 h-16 rounded-full items-center justify-center mb-3 shadow-sm">
                  <FontAwesome5 name="check" size={28} color="#58A700" />
                </View>
                <Text className="text-[#58A700] text-[22px] text-center" style={{ fontFamily: 'BanglaBold' }}>ডিজিটাইজেশন সফল! 🎉</Text>
                <Text className="text-[#4B4B4B] text-[15px] text-center mt-2 leading-6 px-2" style={{ fontFamily: 'BanglaRegular' }}>
                  এআই তোমার টেস্ট পেপার থেকে <Text style={{ fontFamily: 'BanglaBold' }}>{generatedContent?.length} টি</Text> কাঠামোবদ্ধ প্রশ্ন খুঁজে বের করে স্মার্ট গাইডে রূপান্তর করেছে! 
                </Text>
              </View>

              <View className="bg-white p-5 rounded-[24px] border-2 border-[#E5E5E5] border-b-[5px] mb-8">
                
                <Text className="text-[#AFAFAF] text-[14px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>কভার ছবি <Text className="text-[#FF4B4B]">*</Text></Text>
<TouchableOpacity activeOpacity={0.85} onPress={pickThumbnail} className="mb-6">
                  <View className="w-48 h-48 self-center rounded-[16px] overflow-hidden border-2 border-[#E5E5E5] border-dashed relative bg-[#F9F9F9] items-center justify-center">
                    {thumbnail ? (
                      <Image source={{ uri: thumbnail }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="items-center justify-center">
                        <View className="w-12 h-12 bg-white rounded-full items-center justify-center mb-2 shadow-sm border border-[#E5E5E5]">
                          <FontAwesome5 name="image" size={20} color="#1CB0F6" />
                        </View>
                        <Text className="text-[#777777] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>কভার ছবি সিলেক্ট করো</Text>
                      </View>
                    )}
                    {thumbnail && (
                      <View className="absolute bottom-3 right-3 bg-black/70 px-3 py-1.5 rounded-lg flex-row items-center backdrop-blur-md">
                        <FontAwesome5 name="camera" size={12} color="#FFF" />
                        <Text className="text-white text-[11px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>ছবি বদলাও</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <Text className="text-[#AFAFAF] text-[14px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>গাইডের টাইটেল <Text className="text-[#FF4B4B]">*</Text></Text>
                <TextInput 
                  className="bg-[#F9F9F9] p-4 rounded-[16px] mb-5 border-2 border-[#E5E5E5] text-[#3C3C3C] text-[16px]" 
                  style={{ fontFamily: 'BanglaBold' }} 
                  placeholder="যেমন: HSC Physics বোর্ড প্রশ্ন..."
                  placeholderTextColor="#AFAFAF"
                  value={notebookName} 
                  onChangeText={setNotebookName} 
                  maxLength={100}
                />

              
                <View className="flex-row items-center justify-between bg-[#F5F5F5] p-4 rounded-[16px] border border-[#E5E5E5]">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isPublic ? 'bg-[#1CB0F6]/10' : 'bg-[#777777]/10'}`}>
                      <FontAwesome5 name={isPublic ? "globe-asia" : "lock"} size={20} color={isPublic ? "#1899D6" : "#777777"} />
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className={`text-[16px] ${isPublic ? 'text-[#1899D6]' : 'text-[#4B4B4B]'}`} style={{ fontFamily: 'BanglaBold' }}>{isPublic ? 'পাবলিক গাইড' : 'প্রাইভেট গাইড'}</Text>
                      <Text className="text-[12px] text-[#AFAFAF] mt-1 leading-4" style={{ fontFamily: 'BanglaRegular' }}>{isPublic ? 'অ্যাপের সবাই এই গাইড দেখতে পাবে' : 'শুধু তুমি এবং যাদের কোড দেবে তারা দেখবে'}</Text>
                    </View>
                  </View>
                  <Switch trackColor={{ false: "#D7D7D7", true: "#58CC02" }} thumbColor={"#FFFFFF"} onValueChange={() => setIsPublic(!isPublic)} value={isPublic} />
                </View>
              </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleFinalSave} disabled={isSaving || isImageUploading}>
                <View className={`rounded-[20px] pb-[6px] ${isImageUploading ? 'bg-[#E5E5E5]' : isSaving ? 'bg-[#4A8C00]' : 'bg-[#58A700]'}`}>
                  <View className={`rounded-[20px] py-4 flex-row justify-center items-center h-[60px] ${isImageUploading ? 'bg-[#F0F0F0]' : isSaving ? 'bg-[#4AAB00]' : 'bg-[#58CC02]'}`}>
                    {isSaving || isImageUploading ? (
                      <ActivityIndicator color={isImageUploading ? "#777777" : "#FFFFFF"} size="small" />
                    ) : (
                      <FontAwesome5 name="check-circle" size={20} color="#FFFFFF" solid />
                    )}
                    <Text className={`text-[18px] ml-3 pt-1 ${isImageUploading ? 'text-[#777777]' : 'text-white'}`} style={{ fontFamily: 'BanglaBold' }}>
                      {isImageUploading ? 'ছবি আপলোড হচ্ছে ⏳' : isSaving ? 'পাবলিশ হচ্ছে...' : 'পাবলিশ করো 🎉'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </Animated.View>

      <Modal visible={showPremiumModal} animationType="fade" transparent={true} onRequestClose={() => setShowPremiumModal(false)}>
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-white w-full rounded-[32px] p-6 items-center border-b-4 border-[#E5E5E5]">
            <View className="w-20 h-20 bg-[#FFF4E5] rounded-full items-center justify-center mb-5 border-4 border-[#FFDDAA]">
              <FontAwesome5 name="crown" size={36} color="#FF9600" solid />
            </View>
            
            <Text className="text-[22px] text-[#3C3C3C] text-center mb-3" style={{ fontFamily: 'BanglaBold' }}>সার্ভার অনেক ব্যস্ত!</Text>
            <Text className="text-[15px] text-[#7B92A5] text-center px-2 leading-6 mb-8" style={{ fontFamily: 'BanglaRegular' }}>
              ফ্রি সার্ভারে এখন প্রচুর ট্রাফিক থাকায় তোমার রিকোয়েস্টটি প্রসেস করা যাচ্ছে না। দ্রুত এবং কোনো অপেক্ষা ছাড়াই আনলিমিটেড গাইড বানাতে প্রিমিয়াম আনলক করো।
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={() => { setShowPremiumModal(false); }} className="w-full mb-3">
              <View className="bg-[#D47B00] rounded-[20px] pb-[6px]">
                <View className="bg-[#FF9600] rounded-[20px] py-4 flex-row justify-center items-center h-[56px]">
                  <Text className="text-white text-[18px] pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রিমিয়াম আনলক করো</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowPremiumModal(false)} className="py-3 px-6 rounded-xl">
              <Text className="text-[#AFAFAF] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>পরে চেষ্টা করবো</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}