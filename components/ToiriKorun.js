import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform, Animated, Alert, Switch, LayoutAnimation, UIManager, ActivityIndicator, Modal, DeviceEventEmitter } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import * as Clipboard from 'expo-clipboard';

import { processWithGuideEngine } from './AiGuideEngine';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🚀 Smart JSON Parser (AI Error Fixer)
const parseSmartJSON = (rawText) => {
  try {
    // ১. এআই এর ফালতু এস্কেপ ক্যারেক্টার (যেমন \[ বা \]) এবং মার্কডাউন রিমুভ করা
    let cleanedText = rawText.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    cleanedText = cleanedText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // ২. প্রথম '[' এবং শেষ ']' বের করে শুধু অ্যারে অংশটুকু নেওয়া
    const firstIndex = cleanedText.indexOf('[');
    const lastIndex = cleanedText.lastIndexOf(']');
    
    if (firstIndex !== -1 && lastIndex !== -1) {
      cleanedText = cleanedText.substring(firstIndex, lastIndex + 1);
    }

    // ৩. ট্রেইলিং কমা (Trailing commas) ফিক্স করা (যেমন: { "a": 1, } -> { "a": 1 })
    cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1');

    // ৪. JSON পার্স করা
    let parsedData = JSON.parse(cleanedText);
    
    if (!Array.isArray(parsedData)) {
      throw new Error("JSON is not an array");
    }

    // ৫. স্মার্ট অটো-কারেকশন (Missing ফিল্ডগুলো ইনবিল্ট লজিক দিয়ে ফিক্স করা)
    const finalData = parsedData.map((item, idx) => {
      let fixedItem = { ...item };
      
  // বেসিক ফিল্ডগুলো নিশ্চিত করা
      fixedItem.id = item.id || `manual_${Date.now()}_${idx}`;
      fixedItem.type = item.type || "জ্ঞানমূলক";
      fixedItem.topic = item.topic || "সাধারণ টপিক";
      fixedItem.board = item.board || "ক্রিয়েটিভ প্রশ্ন"; 
      fixedItem.needsImage = item.needsImage || false; 
      fixedItem.imageHint = item.imageHint || "এই প্রশ্নটি"; // 🚀 সোর্স থেকে খোঁজার জন্য হিন্ট
      fixedItem.image = item.image || ""; 
      fixedItem.question = item.question || "প্রশ্ন পাওয়া যায়নি";
      
      // টাইপ অনুযায়ী ফিল্ড ঠিক করা
      if (fixedItem.type.toLowerCase() === 'mcq') {
        fixedItem.type = 'mcq'; // lowercase নিশ্চিত করা
        fixedItem.options = Array.isArray(item.options) && item.options.length > 0 ? item.options : ["ক", "খ", "গ", "ঘ"];
        fixedItem.correctAnswer = item.correctAnswer || item.answer || "";
        fixedItem.explanation = item.explanation || "";
      } 
      else if (fixedItem.type === 'সৃজনশীল') {
        fixedItem.stem = item.stem || "উদ্দীপক পাওয়া যায়নি";
        fixedItem.questions = Array.isArray(item.questions) ? item.questions : [
          { label: "ক", question: item.question || "", answer: item.answer || "" }
        ];
      } 
    else {
        // জ্ঞানমূলক ও অনুধাবনমূলক এর জন্য
        fixedItem.answer = item.answer || ""; 
      }
      
      // 🚀 নতুন প্রশ্ন ট্র্যাক করার জন্য টাইমস্ট্যাম্প যুক্ত করা হলো
      fixedItem.addedAt = item.addedAt || Date.now();
      
      return fixedItem;
    });

    return finalData;

  } catch (error) {
    console.log("Smart JSON Parse Error:", error);
    return null;
  }
};

export default function ToiriKorun({ onBack, onSave }) {
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
 const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  
  // 🚀 Manual Mode States
  const [isManualInputVisible, setIsManualInputVisible] = useState(false);
  const [manualInputText, setManualInputText] = useState("");

  const [generatedContent, setGeneratedContent] = useState(null);
  const [notebookName, setNotebookName] = useState('');
 const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [thumbnail, setThumbnail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false); // 🚀 নতুন আপলোডিং স্টেট
  const [updateVersion, setUpdateVersion] = useState(''); // 🚀 নতুন ভার্সন ট্যাগ স্টেট
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

// 🚀 Progressive Rendering Simulation State
 const [simulatedQCount, setSimulatedQCount] = useState(0);
  const [targetSubject, setTargetSubject] = useState(null);
  const [targetBankToUpdate, setTargetBankToUpdate] = useState(null); // 🚀 Existing Bank Update State

  useEffect(() => {
   const fetchUser = async () => {
      // 🚀 ফোল্ডার থেকে রিকোয়েস্ট এসেছে কি না তা চেক করা হচ্ছে
      const savedSubject = await AsyncStorage.getItem('@target_subject');
      if (savedSubject) {
        setTargetSubject(JSON.parse(savedSubject));
        await AsyncStorage.removeItem('@target_subject');
      }
      
      const savedBank = await AsyncStorage.getItem('@target_bank_to_update');
      if (savedBank) {
        setTargetBankToUpdate(JSON.parse(savedBank));
        setNotebookName(JSON.parse(savedBank).bankName); // 🚀 আগের নাম অটোমেটিক ফিল করে রাখা
        await AsyncStorage.removeItem('@target_bank_to_update');
      }
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
    let textInterval;
    let qInterval;
    if (currentStep === 2) {
      // মেসেজ চেঞ্জ হবে ৩ সেকেন্ড পরপর
      textInterval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
      
      // 🚀 প্রতি ৪.৫ সেকেন্ডে ফেক প্রশ্ন অ্যাড হওয়ার কাউন্টার বাড়বে
      qInterval = setInterval(() => {
        setSimulatedQCount((prev) => prev < 18 ? prev + 1 : prev);
      }, 4500); 
    }
    return () => {
      clearInterval(textInterval);
      clearInterval(qInterval);
    };
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

const handleCopyPrompt = async () => {
    const promptData = `You are an expert Educational Content Formatter and Bangladeshi HSC/SSC Digitizer.
Your ONLY job is to extract exact questions, answers, and context from the provided images/text and format them into a highly structured JSON array.

CRITICAL RULES (UX & PSYCHOLOGY FOCUSED):
1. DO NOT invent or hallucinate. Extract EXACTLY what is in the source. Fix any Bengali typos.
2. Categorize strictly into: "mcq", "জ্ঞানমূলক", "অনুধাবনমূলক", "সৃজনশীল".
3. SMART TOPIC GROUPING (CRUCIAL): You MUST categorize all questions into exactly 5 to 6 broad, logical topics. Max allowed topics: 7.
4. BOARD TAGGING (CRUCIAL): If a question mentions a board year (e.g., "ঢাকা বোর্ড ২০২৩"), add it to the "board" field. Else, set it to "ক্রিয়েটিভ প্রশ্ন".
5. IMAGE HANDLING (CRUCIAL): If a question/stem has visual cues (e.g., "নিচের চিত্রটি লক্ষ করো"), set "needsImage": true. ALSO, provide a short "imageHint" (e.g., "৫ নং প্রশ্ন", "চিত্র-১") so the user can find the original image in the book.
6. GROUPED MCQs (উদ্দীপক নির্ভর বহুনির্বাচনী): If multiple MCQs share a passage/stem, prepend the passage to the 'question' field of EACH related MCQ.
7. If an answer is missing, leave the "answer" field empty.

OUTPUT EXACTLY THIS JSON FORMAT (NO MARKDOWN TEXT, JUST VALID JSON ARRAY):
[
  {
    "id": 1,
    "type": "জ্ঞানমূলক",
    "topic": "Topic Name (Merged broadly)",
    "board": "ঢাকা বোর্ড ২০২৩",
    "question": "extracted question text here",
    "answer": "extracted answer text here"
  },
  {
    "id": 2,
    "type": "mcq",
    "topic": "Topic Name",
    "question": "extracted question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Exact correct option text",
    "explanation": "If any explanation is given, put it here, else empty string"
  },
  {
    "id": 3,
    "type": "সৃজনশীল",
    "topic": "Topic Name",
    "stem": "The main passage or context (উদ্দীপক)",
    "questions": [
      {"label": "ক", "question": "...", "answer": "..."},
      {"label": "খ", "question": "...", "answer": "..."}
    ]
  }
]`;
    await Clipboard.setStringAsync(promptData);
    Alert.alert("কপি হয়েছে 🎉", "প্রম্পটটি কপি হয়েছে! এখন এটি ChatGPT বা Claude-এ পেস্ট করে রেসপন্স নিয়ে আসুন।");
  };

 // 🚀 Handle Manual JSON Submit (Smart Bypass AI Engine)
  const handleManualSubmit = () => {
    if (manualInputText.trim().length < 10) {
      Alert.alert("সতর্কতা", "অনুগ্রহ করে সঠিক JSON কোড পেস্ট করুন।");
      return;
    }

    const finalData = parseSmartJSON(manualInputText);

    if (finalData && finalData.length > 0) {
      setGeneratedContent(finalData);
      setManualInputText("");
      setIsManualInputVisible(false);
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(3); // 🚀 Bypass AI and jump to publish screen!
    } else {
      Alert.alert(
        "ত্রুটি", 
        "JSON কোডটি পড়া যাচ্ছে না। আপনার কপি করা কোডে কোনো ভুল থাকতে পারে অথবা এটি সঠিক প্রম্পট ফরম্যাটে নেই।"
      );
    }
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
      
      // 🚀 ফিক্স: হার্ডকোড করা API Key সরিয়ে .env থেকে ডাইনামিক Key নেওয়া হচ্ছে
      const imgbbKey = process.env.EXPO_PUBLIC_IMGBB_KEY;
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST", body: formData
      });
      
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch (e) { 
      return null; 
    }
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

  // 🚀 ১. Notifee চ্যানেল তৈরি এবং স্টিকি (Ongoing) নোটিফিকেশন শো করা
      // নোটিফিকেশন ফেইল করলেও যেন এআই-এর মূল কাজ না থামে
    const safeNotify = async (payload) => {
      try { await notifee.displayNotification(payload); }
      catch (e) { console.log('AI notification error:', e); }
    };

    let channelId = 'ai_processing_v2';
    try {
      await notifee.requestPermission();
      // নতুন আইডি (v2), কারণ পুরোনো চ্যানেলের সেটিংস ফোনে আটকে থাকে
      channelId = await notifee.createChannel({
        id: 'ai_processing_v2',
        name: 'AI Processing Task',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: [300, 500],
        sound: 'default',
      });
    } catch (e) {
      console.log('AI channel error:', e);
    }

    await safeNotify({
      id: 'ai_processing_task',
      title: '⚙️ স্মার্ট গাইড তৈরি হচ্ছে...',
      body: 'ব্যাকগ্রাউন্ডে কাজ চলছে। অ্যাপটি পুরোপুরি কেটে (Kill) দেবেন না।',
      android: {
        channelId,
        ongoing: true, // 🚀 সোয়াইপ করে কাটা যাবে না (স্টিকি)
        autoCancel: false,
        smallIcon: 'notification_icon',
        color: '#1CB0F6',
        pressAction: { id: 'default', launchActivity: 'default' },
        progress: {
          max: 100,
          indeterminate: true, // 🚀 ক্যাপকাটের মতো ইনফিনিট ঘুরতে থাকবে
        },
      },
    });

    try {
      const imagesList = selectedFiles.filter(f => f.type === 'image').map(f => ({ uri: f.uri, mimeType: f.mimeType || 'image/jpeg' }));
      const textList = selectedFiles.filter(f => f.type === 'text').map(f => f.text).join('\n\n');

  const existingTopics = targetBankToUpdate?.questions ? [...new Set(targetBankToUpdate.questions.map(q => q.topic))] : [];

   const data = await processWithGuideEngine({
        images: imagesList,
        rawText: textList,
        onStatusChange: setAiStatusText,
        userData: currentUser,
        targetSubject: targetSubject,
        existingTopics: existingTopics // 🚀 স্মার্ট ক্যাটাগরাইজেশনের জন্য পুরনো টপিক পাঠানো হলো
      });

      // 🚀 ২. কাজ শেষ হলে স্টিকি নোটিফিকেশন রিমুভ করে সাকসেস নোটিফিকেশন দেওয়া
           await notifee.cancelNotification('ai_processing_task').catch(() => {});
      if (data && data.length > 0) await safeNotify({
        title: '🎉 এআইয়ের কাজ শেষ!',
        body: 'অ্যাপে ফিরে এসে গাইডের নাম ও কভার দিয়ে পাবলিশ করো।',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          smallIcon: 'notification_icon',
          color: '#58CC02',
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      });

      if (data && data.length > 0) {
        setGeneratedContent(data);
        Animated.timing(progressAnim, { toValue: 100, duration: 500, useNativeDriver: false }).start(() => {
          setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentStep(3); 
          }, 300);
               });
      } else {
        await notifee.cancelNotification('ai_processing_task').catch(() => {});
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCurrentStep(1);
        Alert.alert('কিছু পাওয়া যায়নি', 'ছবি বা লেখা থেকে কোনো প্রশ্ন খুঁজে পাওয়া যায়নি। স্পষ্ট ছবি বা টেক্সট দিয়ে আবার চেষ্টা করো।');
      }
    } catch (error) {
      // 🚀 ৩. এরর হলে স্টিকি নোটিফিকেশন রিমুভ করে ফেইল নোটিফিকেশন দেওয়া
          await notifee.cancelNotification('ai_processing_task').catch(() => {});
      await safeNotify({
        title: '❌ ডিজিটাইজেশন ফেইল করেছে!',
        body: 'সার্ভার ব্যস্ত থাকতে পারে। অ্যাপে ফিরে এসে আবার চেষ্টা করো।',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          smallIcon: 'notification_icon',
          color: '#FF4B4B',
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      });

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
      Alert.alert('নাম প্রয়োজন', targetSubject ? 'কোশ্চেন ব্যাংকের একটি নাম দিন!' : 'গাইডের একটি সুন্দর টাইটেল দিন!');
      return;
    }
    
    if (!targetSubject && !thumbnail) {
      Alert.alert('কভার ছবি প্রয়োজন', 'গাইডের জন্য একটি সুন্দর কভার ছবি সিলেক্ট করুন!');
      return;
    }

    setIsSaving(true);

  // 🚀 নতুন প্রশ্নে টাইমস্ট্যাম্প, ইউনিক আইডি এবং আপডেট ভার্সন যুক্ত করা হচ্ছে (Duplicate Key Fix)
    const questionsWithTimestamp = (generatedContent || []).map((q, index) => ({
      ...q,
      id: `${q.id || 'q'}_${Date.now()}_${index}`, // 🚀 ফিক্স: AI এর দেওয়া আইডিগুলো যেন ক্ল্যাশ না করে
      addedAt: Date.now(),
      updateVersion: updateVersion.trim() !== '' ? updateVersion.trim() : null // 🚀 ম্যানুয়াল আপডেট ট্যাগ
    }));

 if (targetSubject) {
      if (targetBankToUpdate) {
        
        // 🚀 স্মার্ট ডুপ্লিকেট চেকার লজিক শুরু
        const existingQuestions = targetBankToUpdate.questions || [];
        
        // হেল্পার ফাংশন: যতিচিহ্ন, স্পেস ও দাঁড়ি/প্রশ্নবোধক চিহ্ন মুছে ফেলা
        const normalizeText = (text) => text ? String(text).replace(/[।.,;:'"()\-\s?]/g, '').toLowerCase() : '';
        
        // আগে থেকে থাকা প্রশ্নগুলোর নরমালাইজড টেক্সটের একটি Set তৈরি করা (ফাস্ট পারফরম্যান্সের জন্য)
        const existingNormalizedTexts = new Set(existingQuestions.map(q => normalizeText(q.question || q.stem)));

        // নতুন প্রশ্নগুলো থেকে ডুপ্লিকেট ফিল্টার করা
        const uniqueNewQuestions = questionsWithTimestamp.filter(newQ => {
          const newNormalizedText = normalizeText(newQ.question || newQ.stem);
          if (existingNormalizedTexts.has(newNormalizedText)) {
            return false; // 🚀 আগের ব্যাংকে এই প্রশ্নটি থাকলে তা বাদ (Skip) হয়ে যাবে
          }
          existingNormalizedTexts.add(newNormalizedText); // নিজেদের মধ্যেও ডুপ্লিকেট চেক করার জন্য সেটে অ্যাড করে রাখা
          return true; // ইউনিক হলে লিস্টে থাকবে
        });

        // 🚀 পুরনো ব্যাংকে শুধুমাত্র নতুন (ইউনিক) প্রশ্নগুলো যুক্ত করা
        const updatedQuestions = [...existingQuestions, ...uniqueNewQuestions];
        const updatedBankData = { ...targetBankToUpdate, questions: updatedQuestions, bankName: notebookName.trim() };
        
        const updatedFailedItems = targetSubject.failedItems.map(b => b.bankId === targetBankToUpdate.bankId ? updatedBankData : b);
        const updatedSubject = { ...targetSubject, failedItems: updatedFailedItems };

        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'save_guide', guideData: updatedSubject })
        });

        DeviceEventEmitter.emit('question_bank_updated', { shareCode: targetSubject.shareCode, updatedSubject });
      } else {
        // 🚀 সম্পূর্ণ নতুন ব্যাংক তৈরি
        const newBankData = {
          bankId: 'bank_' + Date.now(),
          bankName: notebookName.trim(),
          isBank: true,
          questions: questionsWithTimestamp
        };

        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ 
            action: 'add_question_bank', 
            shareCode: targetSubject.shareCode,
            bankData: newBankData
          })
        });

        DeviceEventEmitter.emit('question_bank_added', { shareCode: targetSubject.shareCode, newBankData });
      }
      
      DeviceEventEmitter.emit('refresh_library');
      if (onBack) onBack();
      return;
    }

    // 🚀 সাধারণ গাইড বা সাবজেক্ট তৈরি (পূর্বের লজিক)
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
    
    if (onBack) onBack(); 
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
            {currentStep === 1 ? 'নতুন প্রশ্নব্যাংক' : currentStep === 2 ? 'এআই মাস্টারমাইন্ড...' : 'সাকসেস!'}
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
                  <Text className="text-[19px] text-[#3C3C3C] text-center" style={{ fontFamily: 'BanglaBold' }}>কী থেকে প্রশ্নব্যাংক বানাবেন?</Text>
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
                ) : isManualInputVisible ? (
                  <View className="mt-6 w-full bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden z-10">
                    <View className="p-4 bg-[#F9F9F9] border-b border-[#F0F0F0]">
                      <Text className="text-[#3C3C3C] text-[15px] mb-2" style={{fontFamily: 'BanglaBold'}}>অন্য AI থেকে ডিরেক্ট জেনারেট করুন</Text>
                      <Text className="text-[#777777] text-[13px] mb-3 leading-5" style={{fontFamily: 'BanglaRegular'}}>নিচের প্রম্পটটি কপি করে ChatGPT বা Claude-এ দিন এবং সেখান থেকে পাওয়া JSON কোডটি নিচে পেস্ট করুন।</Text>
                      <TouchableOpacity onPress={handleCopyPrompt} className="bg-[#A559D6]/10 py-2.5 rounded-xl border border-[#A559D6]/30 flex-row items-center justify-center">
                        <FontAwesome5 name="copy" size={14} color="#A559D6" />
                        <Text className="text-[#A559D6] ml-2 text-[13px] pt-0.5" style={{fontFamily: 'BanglaBold'}}>প্রম্পট কপি করুন</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      className="text-[#3C3C3C] p-4 min-h-[120px] max-h-[200px] text-[14px]"
                      style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                      multiline
                      placeholder="[ { ... JSON কোড পেস্ট করুন ... } ]"
                      placeholderTextColor="#AFAFAF"
                      value={manualInputText}
                      onChangeText={setManualInputText}
                      autoFocus
                    />
                    <View className="flex-row justify-end p-2 border-t border-[#F0F0F0] space-x-2 bg-[#F9F9F9]">
                      <TouchableOpacity onPress={() => setIsManualInputVisible(false)} className="px-4 py-2 rounded-xl bg-[#E5E5E5] mr-2">
                        <Text className="text-[#777777] text-sm pt-1" style={{fontFamily: 'BanglaBold'}}>বাতিল</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleManualSubmit} className="px-5 py-2 rounded-xl bg-[#A559D6]">
                        <Text className="text-white text-sm pt-1" style={{fontFamily: 'BanglaBold'}}>অ্যাড করুন</Text>
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

                 <View className="flex-row space-x-3 w-full">
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setIsTextInputVisible(true)} className="flex-1">
                        <View className="bg-[#E5E5E5] rounded-[16px] pb-[5px]">
                          <View className="bg-white rounded-[16px] py-3.5 flex-row justify-center items-center border-2 border-[#E5E5E5] border-b-0">
                            <FontAwesome5 name="file-alt" size={16} color="#777777" solid />
                            <Text className="text-[#777777] ml-2 text-[14px] pt-1" style={{fontFamily: 'BanglaBold'}}>টেক্সট পেস্ট</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setIsManualInputVisible(true)} className="flex-1">
                        <View className="bg-[#A559D6]/20 rounded-[16px] pb-[5px]">
                          <View className="bg-white rounded-[16px] py-3.5 flex-row justify-center items-center border-2 border-[#A559D6]/40 border-b-0">
                            <FontAwesome5 name="code" size={16} color="#A559D6" solid />
                            <Text className="text-[#A559D6] ml-2 text-[14px] pt-1" style={{fontFamily: 'BanglaBold'}}>ম্যানুয়াল</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
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
                      {selectedFiles.length > 0 ? "⚡ স্মার্ট গাইড তৈরি করো" : "আগে ডাটা দাও..."}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

      {currentStep === 2 && (
            <View className="flex-1 py-2">
              <View className="items-center mb-6 mt-2">
                <View className="bg-[#EAF6FE] w-20 h-20 rounded-full items-center justify-center mb-4 border-4 border-[#1CB0F6]">
                  <FontAwesome5 name="robot" size={32} color="#1CB0F6" />
                </View>
                <Text className="text-[19px] text-[#3C3C3C] text-center mb-4 px-4 leading-8" style={{fontFamily: 'BanglaBold'}}>
                  {aiStatusText.includes("বিজি") ? aiStatusText : loadingMessages[loadingTextIndex]}
                </Text>
                
                {/* 🚀 Progressive Loading Simulation */}
                <View className="bg-white px-5 py-3 rounded-2xl border border-[#E5E5E5] flex-row items-center shadow-sm">
                  <ActivityIndicator size="small" color="#58CC02" className="mr-3" />
                  <Text className="text-[#58A700] text-[15px] pt-1" style={{fontFamily: 'BanglaBold'}}>
                    এপর্যন্ত {simulatedQCount} টি প্রশ্ন রেডি হয়েছে...
                  </Text>
                </View>
              </View>

            {/* 🚀 Background / Sticky Notice */}
              <View className="bg-[#FFFDF8] p-5 rounded-[24px] border border-[#FFDDAA] mx-1 mt-2 items-center shadow-sm">
                <View className="bg-[#FFF4E5] w-14 h-14 rounded-full items-center justify-center mb-3">
                  <FontAwesome5 name="bell" size={24} color="#FF9600" solid />
                </View>
                <Text className="text-[#3D382F] text-[16px] text-center leading-7 mb-2" style={{fontFamily: 'BanglaBold'}}>
                  গাইড তৈরি হতে ২-৩ মিনিট সময় লাগতে পারে। তুমি চাইলে অ্যাপটি মিনিমাইজ করে রাখতে পারো। 
                </Text>
                <Text className="text-[#FF4B4B] text-[13px] text-center leading-5 mb-5 px-2" style={{fontFamily: 'BanglaBold'}}>
                  ⚠️ সতর্কীকরণ: অ্যাপটি পুরোপুরি কেটে (Kill/Swipe) দিও না, তাহলে কাজ বন্ধ হয়ে যাবে!
                </Text>
                
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => {
                     Alert.alert(
                       "কাজ চলছে! 🚀", 
                       "তোমার নোটিফিকেশন বারে খেয়াল করো, সেখানে প্রগ্রেস দেখাচ্ছে। অ্যাপটি মিনিমাইজ করতে তোমার ফোনের 'হোম বাটন' চাপো।"
                     );
                  }} 
                  className="bg-[#1899D6] w-full py-3.5 rounded-[16px] items-center flex-row justify-center shadow-sm"
                >
                  <FontAwesome5 name="home" size={14} color="#FFF" />
                  <Text className="text-white text-[15px] pt-1 ml-2" style={{fontFamily: 'BanglaBold'}}>মিনিমাইজ করতে হোম বাটন চাপো</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View>
              <View className="bg-[#D7FFB8] p-6 rounded-[24px] border-2 border-[#58CC02] border-b-4 mb-6 items-center">
                <View className="bg-white w-16 h-16 rounded-full items-center justify-center mb-3 shadow-sm">
                  <FontAwesome5 name="check" size={28} color="#58A700" />
                </View>
                <Text className="text-[#58A700] text-[22px] text-center" style={{ fontFamily: 'BanglaBold' }}>প্রশ্নব্যাংক তৈরি হয়েছে </Text>
                <Text className="text-[#4B4B4B] text-[15px] text-center mt-2 leading-6 px-2" style={{ fontFamily: 'BanglaRegular' }}>
                  এআই তোমার দেয়া ডাটা থেকে <Text style={{ fontFamily: 'BanglaBold' }}>{generatedContent?.length} টি</Text> কাঠামোবদ্ধ প্রশ্ন খুঁজে বের করে স্মার্ট গাইডে রূপান্তর করেছে! 
                </Text>
              </View>

          <View className="bg-white p-5 rounded-[24px] border-2 border-[#E5E5E5] border-b-[5px] mb-8">
                
                {/* 🚀 সাবজেক্টের ভেতরে কোশ্চেন ব্যাংক বানালে শুধু টাইটেল নিবে */}
                {!targetSubject && (
                  <>
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
                  </>
                )}

              <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>
              কোশ্চেন ব্যাংকের নাম <Text className="text-[#FF4B4B]">*</Text>
            </Text>

        <View className="relative justify-center">
              <TextInput
                className={`p-4 rounded-[16px] text-[16px] mb-5 border ${
                  targetBankToUpdate 
                    ? 'bg-[#F0F2F5] border-[#E5E5E5] text-[#AFAFAF]' // 🚀 ডিজেবল থাকলে কালার
                    : 'bg-white border-[#EFE8D6] text-[#3D382F]'     // 🚀 ইনেবল থাকলে কালার
                }`}
                style={{ fontFamily: 'BanglaBold' }}
                placeholder={targetSubject ? "যেমন: অধ্যায় ১ - বহুনির্বাচনী" : "যেমন: HSC Physics"}
                value={notebookName}
                onChangeText={setNotebookName}
                editable={!targetBankToUpdate} // 🚀 এক্সিস্টিং ব্যাংক হলে ইনপুট ডিজেবল থাকবে
                selectTextOnFocus={!targetBankToUpdate}
              />
              
              {/* 🚀 লক আইকন (যাতে ইউজার বুঝতে পারে কেন এডিট করা যাচ্ছে না) */}
              {targetBankToUpdate && (
                <View className="absolute right-4 top-[18px]">
                  <FontAwesome5 name="lock" size={14} color="#AFAFAF" />
                </View>
              )}
            </View>

            {/* 🚀 ওয়ার্নিং/ইনফো মেসেজ */}
            {targetBankToUpdate && (
              <Text className="text-[#FF9600] text-[12px] -mt-3 mb-4 ml-1 leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                <FontAwesome5 name="info-circle" size={10} /> এক্সিস্টিং কোশ্চেন ব্যাংকে নতুন প্রশ্ন যুক্ত করার সময় নাম পরিবর্তন করা যায় না।
              </Text>
            )}

         {/* 🚀 স্পেশাল ট্যাগ ইনপুট (ঐচ্ছিক) */}
            {targetBankToUpdate && (
              <>
                <Text className="text-[#AFAFAF] text-[13px] mb-2 ml-1" style={{ fontFamily: 'BanglaBold' }}>
                  বিশেষ কালেকশন ট্যাগ (ঐচ্ছিক)
                </Text>
                <TextInput
                  className="bg-white border-[#EFE8D6] text-[#3D382F] p-4 rounded-[16px] text-[16px] mb-5 border"
                  style={{ fontFamily: 'BanglaBold' }}
                  placeholder="যেমন: কুইজ প্রস্তুতি, শুধু পাস"
                  value={updateVersion}
                  onChangeText={setUpdateVersion}
                />
                <Text className="text-[#827B6E] text-[12px] -mt-3 mb-4 ml-1 leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                  <FontAwesome5 name="info-circle" size={10} /> ট্যাগ দিলে স্টুডেন্টরা সহজেই ফিল্টার করে স্পেশাল কালেকশন পড়তে পারবে।
                </Text>
              </>
            )}

                {!targetSubject && (
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
                )}
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