import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, ScrollView, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { FontAwesome5 } from '@expo/vector-icons';

// 🚀 অ্যাভাটার লিস্ট মুছে ফেলা হলো, কারণ প্রোফাইল পিকচার আপলোড ম্যান্ডেটরি করা হয়েছে

// অ্যাকাডেমিক লেভেলের লিস্ট (আপাতত সফট লঞ্চের জন্য শুধুমাত্র এইচএসসি রাখা হলো)
const ACADEMIC_LEVELS = [
  { id: 'hsc', label: 'এইচএসসি (HSC)', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Graduation%20cap/3D/graduation_cap_3d.png', color: '#FF4B4B' }
];

export default function SignUpLoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
 const [selectedAcademic, setSelectedAcademic] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null); // 🚀 ডিফল্ট অ্যাভাটার বাতিল
  const [isImageUploading, setIsImageUploading] = useState(false); // 🚀 ছবি আপলোডিং স্টেট
  
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
 const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

  // 🚀 ImgBB তে ছবি আপলোড করার লজিক
  const uploadToImgBB = async (base64String) => {
    try {
      let formData = new FormData();
      formData.append("image", base64String);
      const imgbbKey = process.env.EXPO_PUBLIC_IMGBB_KEY;
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (e) { return null; }
  };

  // 🚀 গ্যালারি থেকে ছবি সিলেক্ট ও কম্প্রেস করার লজিক
  const handlePickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsImageUploading(true);
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri, [{ resize: { width: 400 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipResult.base64) {
          // ইউজারকে তাৎক্ষণিক দেখানোর জন্য লোকাল প্রিভিউ সেট করা হলো
          setSelectedAvatar(`data:image/jpeg;base64,${manipResult.base64}`); 
          
          const imgUrl = await uploadToImgBB(manipResult.base64);
          if (imgUrl) {
            setSelectedAvatar(imgUrl);
          } else {
             Alert.alert('আপলোড ব্যর্থ', 'ইন্টারনেট সমস্যার কারণে ছবি আপলোড হয়নি।');
             setSelectedAvatar(null);
          }
        }
      } catch(e) {
        Alert.alert('ত্রুটি', 'ছবি প্রসেস করতে সমস্যা হয়েছে।');
        setSelectedAvatar(null);
      } finally {
        setIsImageUploading(false);
      }
    }
  };

  const handleCheckEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@gmail.com')) {
      Alert.alert('ভুল ইমেইল', 'দয়া করে শুধুমাত্র একটি সঠিক @gmail.com এড্রেস ব্যবহার করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/check_email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY
        },
        body: JSON.stringify({ email: cleanEmail })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error Response:", errorText);
        throw new Error(`HTTP status ${response.status}`);
      }
      
      const data = await response.json();

      if (data.exists) {
        setStep(6); 
      } else {
        await sendOtpCode(cleanEmail);
      }
    } catch (error) {
      console.error("Fetch error details:", error);
      Alert.alert('ইন্টারনেট সমস্যা', 'সার্ভারের সাথে কানেক্ট করতে সমস্যা হচ্ছে। দয়া করে Vercel-এ নতুন API ডেপ্লয় হয়েছে কিনা চেক করুন।');
    }
    setIsLoading(false);
  };

  const sendOtpCode = async (userEmail) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: userEmail,
            otp_code: code,
          }
        })
      });

      if (response.ok) {
        setStep(2); 
      } else {
        const errorText = await response.text();
        Alert.alert('EmailJS Error', `ত্রুটি: ${errorText}`);
      }
    } catch (error) {
      Alert.alert('ইন্টারনেট সমস্যা', `কানেকশন এরর: ${error.message}`);
    }
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setStep(3);
    } else {
      Alert.alert('ভুল কোড', 'দয়া করে ইমেইলে আসা সঠিক কোডটি দিন।');
    }
  };

  const handleNamePassNext = () => {
    if (name.trim().length < 2) {
      Alert.alert('নাম প্রয়োজন', 'দয়া করে আপনার সঠিক নাম দিন।');
      return;
    }
    if (password.trim().length < 6) {
      Alert.alert('দুর্বল পাসওয়ার্ড', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    setStep(4); 
  };

  const handleAcademicNext = () => {
    if (!selectedAcademic) {
      Alert.alert('নির্বাচন করুন', 'দয়া করে আপনার অ্যাকাডেমিক লেভেল সিলেক্ট করুন।');
      return;
    }
    setStep(5); 
  };

  const handleFinishSetup = async () => {
    setIsLoading(true);
    try {
      const finalEmail = email.trim().toLowerCase();
      const finalName = name.trim();

      const response = await fetch('https://growshelby-api.vercel.app/api/save_user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY
        },
        body: JSON.stringify({
          name: finalName,
          email: finalEmail,
          password: password,
          avatar: selectedAvatar,
          academic_level: selectedAcademic.label
        })
      });
      
   const data = await response.json();
      if (data.token) await AsyncStorage.setItem('@auth_token', data.token); // 🚀 JWT টোকেন সেভ
      await saveUserDataAndLogin(finalEmail, finalName, data.coins, selectedAvatar, selectedAcademic.label);
      
    } catch (error) {
      Alert.alert('ত্রুটি', 'একাউন্ট তৈরি করতে সমস্যা হয়েছে।');
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    if (password.trim().length < 1) {
      Alert.alert('পাসওয়ার্ড প্রয়োজন', 'দয়া করে আপনার পাসওয়ার্ড দিন।');
      return;
    }

    setIsLoading(true);
    try {
      const finalEmail = email.trim().toLowerCase();

      const response = await fetch('https://growshelby-api.vercel.app/api/login_user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY
        },
        body: JSON.stringify({
          email: finalEmail,
          password: password
        })
      });
      
      const data = await response.json();

  if (response.ok && data.success) {
        if (data.token) await AsyncStorage.setItem('@auth_token', data.token); // 🚀 JWT টোকেন সেভ
        await saveUserDataAndLogin(data.user.email, data.user.name, data.user.coins, data.user.avatar, data.user.academic_level);
      } else {
        Alert.alert('লগইন ব্যর্থ', data.error || 'পাসওয়ার্ড সঠিক নয়।');
      }
    } catch (error) {
      Alert.alert('ত্রুটি', 'লগইন করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।');
    }
    setIsLoading(false);
  };

  const saveUserDataAndLogin = async (userId, userName, userCoins, userAvatar, userAcademic) => {
    try {
      await AsyncStorage.setItem('@current_user_id', userId);
      await AsyncStorage.setItem('@is_logged_in', 'true');
      
      await AsyncStorage.setItem(`@user_name_${userId}`, userName);
      const coinsStr = userCoins !== undefined ? userCoins.toString() : '50';
      await AsyncStorage.setItem(`@user_coins_${userId}`, coinsStr);
      
      if(userAvatar) {
        await AsyncStorage.setItem(`@user_avatar_${userId}`, userAvatar);
        await AsyncStorage.setItem('@user_avatar', userAvatar);
      }

      if(userAcademic) {
        await AsyncStorage.setItem(`@user_academic_${userId}`, userAcademic);
        await AsyncStorage.setItem('@user_academic', userAcademic);
      }

  await AsyncStorage.setItem('@user_email', userId);
      await AsyncStorage.setItem('@user_name', userName);
      await AsyncStorage.setItem('@user_coins', coinsStr);
      
      // 🚀 FIX: Trigger push token generation immediately after login
      DeviceEventEmitter.emit('USER_LOGGED_IN_SYNC_TOKEN');
      
    if (onLoginSuccess) {
        // 🚀 ম্যাজিক ফিক্স: লগইন সাকসেস হলে নতুন ডাটা লোড করার সিগন্যাল দিচ্ছি
        DeviceEventEmitter.emit('FORCE_REFRESH_HOME_DATA');
        onLoginSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white justify-center px-6"
    >
   <View className="items-center justify-center mb-4 w-full">
        <Image
          source={require('../assets/logo.png')} 
          // 🚀 সাইজ বড় করার জন্য width ও height বাড়িয়ে দেওয়া হলো
          style={{ width: 320, height: 130 }} 
          resizeMode="contain"
        />
      </View>

      {/* STEP 1: Enter Email */}
      {step === 1 && (
        <View className="w-full">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-gray-700 mb-4 text-center">
            শুরু করতে আপনার ইমেইল দিন
          </Text>
          <TextInput
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-lg bg-gray-50 mb-6 text-center"
            style={{ fontFamily: 'PoppinsRegular' }}
            placeholder=""
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity 
            onPress={handleCheckEmail}
            disabled={isLoading}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl items-center justify-center border-2 shadow-sm ${isLoading ? 'bg-gray-400 border-gray-400' : 'bg-[#58CC02] border-[#58CC02] border-b-[5px] border-b-[#46A302]'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">চালিয়ে যান</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: OTP Verification */}
      {step === 2 && (
        <View className="w-full">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-gray-700 mb-4 text-center">
            কোড ভেরিফিকেশন
          </Text>
          <Text style={{ fontFamily: 'BanglaRegular' }} className="text-gray-500 mb-6 text-center">
            {email} -এ একটি ৪ ডিজিটের কোড পাঠানো হয়েছে। (স্প্যাম বক্স চেক করুন) 
          </Text>
          <TextInput
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-2xl bg-gray-50 mb-6 text-center tracking-[10px]"
            style={{ fontFamily: 'PoppinsBold' }}
            placeholder="----"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity 
            onPress={handleVerifyOtp}
            activeOpacity={0.8}
            className="w-full py-4 rounded-2xl items-center justify-center bg-[#1CB0F6] border-2 border-[#1CB0F6] border-b-[5px] border-b-[#1899D6] shadow-sm"
          >
            <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">কোড কনফার্ম করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 3: Setup Name & Password */}
      {step === 3 && (
        <View className="w-full">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-gray-700 mb-4 text-center">
            প্রোফাইল সেটআপ করুন
          </Text>
          <TextInput
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-lg bg-gray-50 mb-4 text-center"
            style={{ fontFamily: 'BanglaRegular' }}
            placeholder="আপনার নাম লিখুন"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-lg bg-gray-50 mb-6 text-center"
            style={{ fontFamily: 'PoppinsRegular' }}
            placeholder="একটি পাসওয়ার্ড দিন"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            onPress={handleNamePassNext}
            activeOpacity={0.8}
            className="w-full py-4 rounded-2xl items-center justify-center border-2 shadow-sm bg-[#1CB0F6] border-[#1CB0F6] border-b-[5px] border-b-[#1899D6]"
          >
            <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">পরবর্তী ধাপ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 4: Select Academic Level with Microsoft 3D Emojis */}
      {step === 4 && (
        <View className="w-full items-center">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-gray-700 mb-2 text-center">
            আপনার বর্তমান ক্লাস বেছে নিন
          </Text>
          <Text style={{ fontFamily: 'BanglaRegular' }} className="text-gray-500 mb-6 text-center">
            আপনার জন্য কাস্টমাইজড কনটেন্ট তৈরি করতে সাহায্য করবে
          </Text>
          
          <View className="w-full flex-row flex-wrap justify-between mb-6">
            {ACADEMIC_LEVELS.map((item) => {
              const isSelected = selectedAcademic?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedAcademic(item)}
                  activeOpacity={0.7}
                  className={`w-[48%] mb-3 p-4 rounded-2xl border-2 items-center justify-center flex-row shadow-sm ${isSelected ? 'bg-white' : 'bg-gray-50 border-gray-200'}`}
                  style={{ 
                    borderColor: isSelected ? item.color : '#e5e7eb',
                    borderBottomWidth: isSelected ? 4 : 2 
                  }}
                >
                  <Image 
                    source={{ uri: item.iconUrl }} 
                    style={{ width: 28, height: 28, marginRight: 8 }} 
                    resizeMode="contain" 
                  />
                  <Text style={{ fontFamily: 'BanglaBold' }} className={`pt-1 text-[13px] ${isSelected ? 'text-black' : 'text-gray-500'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity 
            onPress={handleAcademicNext}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl items-center justify-center border-2 shadow-sm ${!selectedAcademic ? 'bg-gray-400 border-gray-400' : 'bg-[#1CB0F6] border-[#1CB0F6] border-b-[5px] border-b-[#1899D6]'}`}
          >
            <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">পরবর্তী ধাপ</Text>
          </TouchableOpacity>
        </View>
      )}

   {/* STEP 5: Upload Profile Picture (Mandatory) */}
      {step === 5 && (
        <View className="w-full items-center">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-[#3C3C3C] mb-2 text-center">
            প্রোফাইল ছবি সেট করুন
          </Text>
          <Text style={{ fontFamily: 'BanglaRegular' }} className="text-[#777777] mb-8 text-center">
            অ্যাকাউন্ট তৈরি করতে একটি সুন্দর ছবি আপলোড করুন
          </Text>
          
          {/* 🚀 ইমেজ আপলোডার */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handlePickAvatar} 
            disabled={isImageUploading || isLoading}
            className="mb-10"
          >
            <View className="w-36 h-36 rounded-full border-4 border-[#E5E5E5] border-dashed overflow-hidden bg-[#F9F9F9] items-center justify-center relative shadow-sm">
              {selectedAvatar ? (
                <Image source={{ uri: selectedAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <FontAwesome5 name="camera" size={36} color="#1CB0F6" className="mb-2" />
                  <Text className="text-[#1899D6] text-[13px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ছবি দিন</Text>
                </View>
              )}
              
              {/* আপলোডিং স্পিনার */}
              {isImageUploading && (
                <View className="absolute inset-0 bg-black/60 items-center justify-center">
                   <ActivityIndicator size="large" color="#FFFFFF" />
                   <Text className="text-white text-[12px] pt-2" style={{ fontFamily: 'BanglaBold' }}>আপলোড হচ্ছে...</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* 🚀 সাইকোলজিক্যাল লক বাটন */}
          <TouchableOpacity 
            onPress={handleFinishSetup}
            disabled={!selectedAvatar || isImageUploading || isLoading}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl items-center justify-center border-2 shadow-sm ${(!selectedAvatar || isImageUploading || isLoading) ? 'bg-[#F0F0F0] border-[#E5E5E5] border-b-[5px] border-b-[#D7D7D7]' : 'bg-[#FFC800] border-[#FFC800] border-b-[5px] border-b-[#E5B400]'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center justify-center">
                {!selectedAvatar && <FontAwesome5 name="lock" size={16} color="#AFAFAF" style={{ marginRight: 10 }} />}
                <Text style={{ fontFamily: 'BanglaBold' }} className={`text-xl pt-1 ${!selectedAvatar ? 'text-[#AFAFAF]' : 'text-white'}`}>
                  {!selectedAvatar ? 'ছবি আপলোড করুন' : 'একাউন্ট তৈরি করুন 🎉'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 6: Login with Password */}
      {step === 6 && (
        <View className="w-full">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-gray-700 mb-4 text-center">
            স্বাগতম! লগইন করুন
          </Text>
          <Text style={{ fontFamily: 'PoppinsRegular' }} className="text-gray-500 mb-4 text-center">
            {email}
          </Text>
          <TextInput
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-lg bg-gray-50 mb-6 text-center"
            style={{ fontFamily: 'PoppinsRegular' }}
            placeholder="আপনার পাসওয়ার্ড দিন"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl items-center justify-center border-2 shadow-sm ${isLoading ? 'bg-gray-400 border-gray-400' : 'bg-[#1CB0F6] border-[#1CB0F6] border-b-[5px] border-b-[#1899D6]'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">লগইন করুন</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStep(1); setPassword(''); }} className="mt-4 p-2">
            <Text style={{ fontFamily: 'BanglaRegular' }} className="text-gray-400 text-center">অন্য একাউন্ট ব্যবহার করুন</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}