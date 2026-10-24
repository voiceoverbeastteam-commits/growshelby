import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// কালো আইকনটি সরিয়ে ৩টি ছেলে ও ৩টি মেয়ের সুন্দর অ্যাভাটার লিস্ট আপডেট করা হলো
const AVATARS = [
  'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
  'https://cdn-icons-png.flaticon.com/512/4139/4139981.png', 
  'https://cdn-icons-png.flaticon.com/512/4140/4140047.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140051.png',
  'https://cdn-icons-png.flaticon.com/512/4139/4139993.png'
];

// অ্যাকাডেমিক লেভেলের লিস্ট (মাইক্রোসফট 3D ইমোজি সহ)
const ACADEMIC_LEVELS = [
  { id: 'primary', label: '১ম - ৫ম শ্রেণি', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Backpack/3D/backpack_3d.png', color: '#FF9600' },
  { id: 'jsc', label: '৬ষ্ঠ - ৮ম শ্রেণি', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Books/3D/books_3d.png', color: '#CE82FF' },
  { id: 'ssc', label: 'নবম - দশম (SSC)', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/School/3D/school_3d.png', color: '#1CB0F6' },
  { id: 'hsc', label: 'একাদশ - দ্বাদশ (HSC)', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Graduation%20cap/3D/graduation_cap_3d.png', color: '#FF4B4B' },
  { id: 'admission', label: 'বিশ্ববিদ্যালয় ভর্তি', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Classical%20building/3D/classical_building_3d.png', color: '#58CC02' },
  { id: 'bcs_job', label: 'বিসিএস ও চাকরি', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Briefcase/3D/briefcase_3d.png', color: '#FFC800' },
  { id: 'other', label: 'অন্যান্য', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png', color: '#8F93A2' }
];

export default function SignUpLoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAcademic, setSelectedAcademic] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [logoUrl, setLogoUrl] = useState('https://via.placeholder.com/260x100/ffffff/1CB0F6?text=LOGO');

  const EMAILJS_SERVICE_ID = 'service_ru0vfzq'; 
  const EMAILJS_TEMPLATE_ID = 'template_48fu1sr';
  const EMAILJS_PUBLIC_KEY = 'Krk-Wza_hS8valzod';

  useEffect(() => {
    const fetchLogo = () => {
      fetch('https://growshelby-api.vercel.app/api/get_settings')
        .then(response => response.json())
        .then(data => {
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
        })
        .catch(error => console.error("Error fetching logo:", error));
    };
    fetchLogo();
  }, []);

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
          'x-api-key': 'Growshelby_MVP_Secret_2026'
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
          'x-api-key': 'Growshelby_MVP_Secret_2026'
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
          'x-api-key': 'Growshelby_MVP_Secret_2026'
        },
        body: JSON.stringify({
          email: finalEmail,
          password: password
        })
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
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
      
      if (onLoginSuccess) {
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
          source={{ uri: logoUrl }}
          style={{ width: 260, height: 100 }}
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

      {/* STEP 5: Select Avatar */}
      {step === 5 && (
        <View className="w-full items-center">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-xl text-gray-700 mb-4 text-center">
            আপনার পছন্দের অ্যাভাটার বেছে নিন
          </Text>
          
          <View className="h-32 mb-6 w-full">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
            >
              {AVATARS.map((url, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => setSelectedAvatar(url)}
                  className={`w-24 h-24 rounded-full border-4 overflow-hidden mx-2 items-center justify-center ${selectedAvatar === url ? 'border-[#1CB0F6] bg-[#E5F7FF]' : 'border-gray-200 bg-gray-50'}`}
                >
                  <Image source={{ uri: url }} className="w-[85%] h-[85%]" resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity 
            onPress={handleFinishSetup}
            disabled={isLoading}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl items-center justify-center border-2 shadow-sm ${isLoading ? 'bg-gray-400 border-gray-400' : 'bg-[#FFC800] border-[#FFC800] border-b-[5px] border-b-[#E5B400]'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">একাউন্ট তৈরি করুন</Text>
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