// File: components/PoraShuruKorun.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, Easing, Image, ScrollView, Linking, Alert } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import TapToRevealCard from './TapToRevealCard';
import PriorityHighlightCard from './PriorityHighlightCard';
import MagicTrickCard from './MagicTrickCard';
import ConfidenceMeterCard from './ConfidenceMeterCard';
import BiteSizedSwipeCard from './BiteSizedSwipeCard';

import FillInkKeywords from './FillInkKeywords';
import DragAndDrop from './DragAndDrop';
import CardPuzzle from './CardPuzzle';
import BlurPuzzle from './BlurPuzzle';
import ImposterQuiz from './ImposterQuiz';
import TapTheMistake from './TapTheMistake';
import SwipeQuiz from './SwipeQuiz';
import BucketDropQuiz from './BucketDropQuiz';
import Verticaldrapdrop from './Verticaldrapdrop';
import Spellingquiz from './Spellingquiz';

const SCREEN_WIDTH = Dimensions.get('window').width;

const emojiUrls = {
  correct: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png",
  wrong: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Crying%20Face.png",
  trophy: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png",
  gameOver: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png"
};

async function playSound(type) {
  try {
    let uri = '';
    if (type === 'correct') uri = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';
    if (type === 'wrong') uri = 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3';
    if (type === 'swoosh') uri = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';

    if (uri) {
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    }
  } catch (error) {
    // 404 বা নেটওয়ার্ক এরর হলে চুপচাপ ইগনোর করবে
  }
}

const defaultLessonData = [
  { 
    id: 1, tagIcon: "fire", tag: "টপিক ১", info: "বাংলাদেশের স্বাধীনতা যুদ্ধ শুরু হয় ১৯৭১ সালের ২৬ মার্চ।", keyword: "২৬ মার্চ", priority: "high", trick: "ছাব্বিশে মার্চ!", time: 10, 
    quizType: 'mcq', 
    question: "বাংলাদেশের স্বাধীনতা যুদ্ধ কবে শুরু হয়?", options: ["২১ ফেব্রুয়ারি", "২৬ মার্চ", "১৬ ডিসেম্বর"], answer: 1, explanation: "২৬ মার্চ।" 
  }
];

export default function PoraShuruKorun({ 
  visible, onClose, lessonItem, onComplete, 
  nextChallenge, onReviseNow, onStartNext, onGenerateNew 
}) {

  const generateTimeline = (data) => {
    let tl = [];
    const seenQuestions = new Set();

    const uniqueData = data.filter(item => {
      if (!item || (!item.question && !item.info)) return false;
      const qText = item.question || item.info;
      const key = qText.trim().toLowerCase();
      if (seenQuestions.has(key)) return false; 
      seenQuestions.add(key);

      if (!item.question) item.question = item.info;
      return true;
    });

    const cardTypes = ['tap', 'magic', 'priority', 'confidence', 'swipe'];

    uniqueData.forEach((item, index) => {
      let readType = cardTypes[index % cardTypes.length]; 
      tl.push({ type: 'read', readType, ...item });

      let quizComponentType = 'quiz_error'; 

      try {
        if (item.quizType === 'mcq' && Array.isArray(item.options)) quizComponentType = 'quiz';
        else if (item.quizType === 'blanks' && Array.isArray(item.options)) quizComponentType = 'quiz_blanks';
        else if (item.quizType === 'drag_drop' && Array.isArray(item.pairs)) quizComponentType = 'quiz_drag_drop';
        else if (item.quizType === 'matching' && Array.isArray(item.pairs)) quizComponentType = 'quiz_matching';
        else if (item.quizType === 'blur_puzzle' && Array.isArray(item.options)) quizComponentType = 'quiz_blur_puzzle';
        else if (item.quizType === 'imposter' && Array.isArray(item.options)) quizComponentType = 'quiz_imposter';
        else if (item.quizType === 'tap_mistake' && Array.isArray(item.sentence)) quizComponentType = 'quiz_tap_mistake';
        else if (item.quizType === 'swipe_quiz' && Array.isArray(item.facts)) quizComponentType = 'quiz_swipe_quiz';
        else if (item.quizType === 'bucket_drop' && Array.isArray(item.buckets)) quizComponentType = 'quiz_bucket_drop';
        else if (item.quizType === 'vertical_reorder' && Array.isArray(item.correctOrder)) quizComponentType = 'quiz_vertical_reorder';
        else if (item.quizType === 'spelling_quiz' && item.word) quizComponentType = 'quiz_spelling_quiz';
        else if ((item.quizType === 'quiz' || !item.quizType) && Array.isArray(item.options)) quizComponentType = 'quiz';
      } catch (e) {
        console.log("Validation error:", e);
      }

      tl.push({ type: quizComponentType, ...item });
    });

    if (tl.length === 0) {
      tl.push({ type: 'quiz_error', question: 'ডেটা এরর!' });
    }

    return tl;
  };

  const [timeline, setTimeline] = useState([]);
  const [step, setStep] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [hearts, setHearts] = useState(5);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [failedItems, setFailedItems] = useState([]);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isPaused, setIsPaused] = useState(false); 

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  const [waNumber, setWaNumber] = useState("8801700000000"); 
  const [waMessage, setWaMessage] = useState("ভাই আমি প্রিমিয়াম আপগ্রেড করতে চাই গ্রোশেলপি অ্যাপের। কিভাবে করতে পারি?"); 

  const timerAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(400)).current; 
  const loadingAnim = useRef(new Animated.Value(0)).current;

  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(20)).current;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const comboBgAnim = useRef(new Animated.Value(0)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;

  const scrollViewRef = useRef(null);
  const isAnimatingOut = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const response = await fetch('http://YOUR_LOCAL_IP/api/get_settings');
            const data = await response.json();
            if (data.whatsappNumber) setWaNumber(data.whatsappNumber);
            if (data.whatsappMessage) setWaMessage(data.whatsappMessage);
        } catch (error) {
            console.log("Failed to fetch WhatsApp settings", error);
        }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (visible) {
      const rawData = lessonItem?.failedItems?.length > 0 ? lessonItem.failedItems : (lessonItem?.data || defaultLessonData);
      setTimeline(generateTimeline(rawData));
      setStep(0);
      setHearts(5); 
      setCombo(0);
      setMistakes(0);
      setFailedItems([]); 
      setShowFeedback(false);
      setSelectedOption(null);
      isAnimatingOut.current = false;
      progressAnim.setValue(0);
      comboBgAnim.setValue(0);
      setTimeLeft(null);
      slideAnim.setValue(400);
      setReportModalVisible(false);
      setPremiumModalVisible(false);
      setIsPaused(false);
    }
  }, [visible, lessonItem, slideAnim]);

  useEffect(() => {
    const overallProgress = timeline.length > 0 ? (step / timeline.length) * 100 : 0;
    Animated.timing(progressAnim, { toValue: overallProgress, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [step, timeline, progressAnim]);

  useEffect(() => {
    Animated.timing(comboBgAnim, { toValue: combo >= 3 ? 1 : 0, duration: 500, useNativeDriver: false }).start();
  }, [combo, comboBgAnim]);

  useEffect(() => {
    isAnimatingOut.current = false;
    cardFadeAnim.setValue(0);
    cardSlideAnim.setValue(20);
    if (visible && step > 0) playSound('swoosh');
    Animated.parallel([
      Animated.timing(cardFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(cardSlideAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true })
    ]).start();
  }, [step, visible, cardFadeAnim, cardSlideAnim]);

  useEffect(() => {
    const currentItem = timeline[step];
    if (visible && currentItem && currentItem.type === 'read') {
      setTimeLeft(currentItem.time || 15);
      timerAnim.setValue(1);
      // Ensure it starts unpaused automatically on new step
      setIsPaused(false);
      Animated.timing(timerAnim, { toValue: 0, duration: (currentItem.time || 15) * 1000, easing: Easing.linear, useNativeDriver: false }).start();
    }
  }, [step, timeline, visible, timerAnim]);

  useEffect(() => {
    let timer;
    if (timeline[step]?.type === 'read' && timeLeft !== null && timeLeft > 0 && !isPaused && !reportModalVisible && !premiumModalVisible) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      if (timeLeft <= 5) {
        Animated.loop(Animated.sequence([
          Animated.timing(timerPulseAnim, { toValue: 1.05, duration: 250, useNativeDriver: true }),
          Animated.timing(timerPulseAnim, { toValue: 1, duration: 250, useNativeDriver: true })
        ])).start();
      }
    } else if (timeline[step]?.type === 'read' && timeLeft === 0 && !showFeedback) {
      timerPulseAnim.stopAnimation();
      timerPulseAnim.setValue(1);
      handleNext();
    }

    if (timeLeft === null || timeLeft > 5 || isPaused || reportModalVisible || premiumModalVisible) {
       timerPulseAnim.stopAnimation();
       timerPulseAnim.setValue(1);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, step, timeline, showFeedback, isPaused, reportModalVisible, premiumModalVisible, timerPulseAnim]);

  useEffect(() => {
    if (showFeedback) {
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(400); 
    }
  }, [showFeedback, slideAnim]);

  useEffect(() => {
    let autoAdvanceTimer;
    if (showFeedback && isCorrect) {
      loadingAnim.setValue(0);
      Animated.timing(loadingAnim, { toValue: 1, duration: 1800, useNativeDriver: false }).start();
      autoAdvanceTimer = setTimeout(() => { handleNext(); }, 1800); 
    }
    return () => { if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer); };
  }, [showFeedback, isCorrect, loadingAnim]);

  const processQuizResult = (userIsCorrect) => {
    const currentItem = timeline[step];
    if (userIsCorrect) {
      playSound('correct');
      setIsCorrect(true);
      setCombo(prev => prev + 1); 
    } else {
      playSound('wrong');
      setIsCorrect(false);
      setHearts(prev => prev - 1); 
      setMistakes(prev => prev + 1);
      setCombo(0); 
      setFailedItems(prev => {
        if (!prev.find(item => item.id === currentItem.id)) return [...prev, currentItem];
        return prev;
      });

      setTimeline(prev => {
        const newTimeline = [...prev];
        let insertIndex = newTimeline.length;
        for (let i = step + 1; i < newTimeline.length; i++) {
            if (newTimeline[i].type === 'read') {
                insertIndex = i; 
                break;
            }
        }
        newTimeline.splice(insertIndex, 0, { ...currentItem, type: currentItem.type });
        return newTimeline;
      });
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (isAnimatingOut.current) return;
    isAnimatingOut.current = true;
    setIsPaused(false);
    setTimeLeft(null); 

    const animations = [
      Animated.timing(cardFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(cardSlideAnim, { toValue: -20, duration: 250, useNativeDriver: true })
    ];

    if (showFeedback) animations.push(Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }));

    Animated.parallel(animations).start(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      setShowFeedback(false);
      setSelectedOption(null);
      if (hearts <= 0 && !isCorrect && timeline[step]?.type.includes('quiz')) {
        setStep(timeline.length + 100); 
      } else {
        setStep(prev => prev + 1);
      }
    });
  };

  const submitReport = (reason) => {
    setReportModalVisible(false);
    if (isAnimatingOut.current) return;
    isAnimatingOut.current = true;
    setIsPaused(false);
    setTimeLeft(null);

    Animated.parallel([
      Animated.timing(cardFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(cardSlideAnim, { toValue: -20, duration: 250, useNativeDriver: true })
    ]).start(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      setShowFeedback(false);
      setSelectedOption(null);
      setStep(prev => prev + 1);
    });
  };

  const handlePremiumUpgrade = () => {
    const formattedNumber = waNumber.replace(/[^0-9]/g, ''); 
    const url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(waMessage)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("দুঃখিত", "আপনার ফোনে হোয়াটসঅ্যাপ ইনস্টল করা নেই।");
      }
    }).catch(err => console.error("An error occurred", err));
  };

  const handleClose = () => onClose();
  const handleComplete = () => { if (onComplete && lessonItem) onComplete(lessonItem, failedItems); else onClose(); };

  if (!visible) return null;

  const isGameOver = hearts <= 0 && step >= timeline.length;
  const isComplete = step >= timeline.length && hearts > 0;
  const currentItem = timeline[step] || {};

  const interpolatedBgColor = comboBgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#FFFAEB'] });
  const isDangerTime = timeLeft !== null && timeLeft <= 5; 

  const showDefaultNextBtn = currentItem.type === 'read' && !['confidence', 'swipe'].includes(currentItem.readType);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <Animated.View style={{ flex: 1, backgroundColor: interpolatedBgColor, paddingTop: 40 }}>

        {/* টপ বার */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <TouchableOpacity onPress={handleClose} className="p-2">
            <FontAwesome5 name="times" size={24} color="#AFAFAF" />
          </TouchableOpacity>
          <View className="flex-1 mx-4 h-4 bg-[#E5E5E5] rounded-full overflow-hidden relative">
            <Animated.View className="absolute left-0 top-0 bottom-0 bg-[#58CC02] rounded-full" style={{ width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
            {timeline.map((_, index) => {
              if (index === 0 || index === timeline.length) return null;
              return <View key={`marker-${index}`} style={{ position: 'absolute', left: `${(index / timeline.length) * 100}%`, width: 3, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.5)', zIndex: 10 }} />;
            })}
          </View>
          <View className="flex-row items-center">
            {combo > 1 ? (
              <View className="flex-row items-center mr-3 bg-[#FF9600]/20 px-2.5 py-1 rounded-full">
                <FontAwesome5 name="fire-alt" size={14} color="#FF9600" solid />
                <Text className="ml-1 text-[#FF9600] text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>{combo}</Text>
              </View>
            ) : null}
            <FontAwesome5 name="heart" size={20} color={hearts > 0 ? "#FF4B4B" : "#E5E5E5"} solid />
            <Text className={`ml-1.5 text-lg pt-1 ${hearts > 0 ? "text-[#FF4B4B]" : "text-[#AFAFAF]"}`} style={{ fontFamily: 'BanglaBold' }}>{hearts}</Text>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setReportModalVisible(true)} className="ml-4">
               <View className="bg-[#E5E5E5] rounded-[10px] pb-[3px]">
                 <View className="bg-white rounded-[10px] px-3 py-1.5 border-[1.5px] border-[#E5E5E5] flex-row items-center justify-center">
                   <FontAwesome5 name="flag" size={12} color="#FF4B4B" />
                 </View>
               </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 px-5 mt-2 z-0">
          {isGameOver ? (
            <View className="flex-1 justify-center items-center">
              <Image source={{ uri: emojiUrls.gameOver }} style={{ width: 120, height: 120 }} resizeMode="contain" />
              <Text className="text-2xl text-[#3C3C3C] mt-6 pt-1" style={{ fontFamily: 'BanglaBold' }}>হার্ট শেষ!</Text>
              <Text className="text-base text-[#777777] text-center mt-2 px-6 leading-6" style={{ fontFamily: 'BanglaBold' }}>তুমি সবগুলো হার্ট হারিয়েছো। এই লেসনটি ফেইল হয়েছে।</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={handleClose} className="w-full mt-10">
                <View className="bg-[#1899D6] rounded-2xl pb-[6px]"><View className="bg-[#1CB0F6] rounded-2xl pt-4 pb-3 flex-row justify-center items-center"><Text className="text-white text-lg pt-1" style={{ fontFamily: 'BanglaBold' }}>বন্ধ করুন</Text></View></View>
              </TouchableOpacity>
            </View>
          ) : isComplete ? (
            <View className="flex-1 justify-center items-center">
              <Image source={{ uri: emojiUrls.trophy }} style={{ width: 120, height: 120 }} resizeMode="contain" />
              <Text className="text-2xl text-[#3C3C3C] mt-5 pt-1" style={{ fontFamily: 'BanglaBold' }}>
                {failedItems.length > 0 ? 'আরও প্র্যাকটিস প্রয়োজন!' : 'দারুণ কাজ!'}
              </Text>
              <Text className="text-[15px] text-[#777777] text-center mt-2 mb-6 px-4 leading-6" style={{ fontFamily: 'BanglaBold' }}>
                {failedItems.length > 0 ? `তুমি ${failedItems.length} টি কুইজে আটকে গিয়েছিলে।` : 'তুমি একদম নির্ভুলভাবে মাইলস্টোনগুলো শেষ করেছো!'}
              </Text>
              
              <ScrollView className="w-full" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                
                {/* 1. Revise Now Button */}
                {failedItems.length > 0 && onReviseNow && (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => onReviseNow(lessonItem, failedItems)} className="w-full mb-3">
                    <View className="bg-[#D63939] rounded-2xl pb-[6px]">
                      <View className="bg-[#FF4B4B] rounded-2xl py-3.5 flex-row justify-center items-center">
                        <FontAwesome5 name="redo-alt" size={16} color="#FFF" />
                        <Text className="text-white text-lg ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>ভুলগুলো রিভিশন করো</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 2. Start Next Challenge Button */}
                {nextChallenge && onStartNext && (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => onStartNext(lessonItem, failedItems, nextChallenge)} className="w-full mb-3">
                    <View className="bg-[#1899D6] rounded-2xl pb-[6px]">
                      <View className="bg-[#1CB0F6] rounded-2xl py-3.5 flex-row justify-center items-center">
                        <FontAwesome5 name="step-forward" size={16} color="#FFF" />
                        <Text className="text-white text-lg ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>পরবর্তী চ্যালেঞ্জ শুরু করো</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 3. Generate New Game Button */}
                {onGenerateNew && (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => onGenerateNew(lessonItem, failedItems)} className="w-full mb-3">
                    <View className="bg-[#A559D6] rounded-2xl pb-[6px]">
                      <View className="bg-[#CE82FF] rounded-2xl py-3.5 flex-row justify-center items-center">
                        <FontAwesome5 name="robot" size={16} color="#FFF" />
                        <Text className="text-white text-lg ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>নতুন গেম জেনারেট করো</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 4. Complete / Home Button */}
                <TouchableOpacity activeOpacity={0.8} onPress={handleComplete} className="w-full">
                  <View className="bg-[#58A700] rounded-2xl pb-[6px]">
                    <View className="bg-[#58CC02] rounded-2xl py-3.5 flex-row justify-center items-center">
                      <FontAwesome5 name="check-circle" size={16} color="#FFF" />
                      <Text className="text-white text-lg ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>হোমে ফিরে যাও</Text>
                    </View>
                  </View>
                </TouchableOpacity>

              </ScrollView>
            </View>
          ) : (
            <>
              {currentItem.type === 'read' && (
                <Animated.View style={{ transform: [{ scale: timerPulseAnim }] }} className={`mb-5 rounded-2xl border-2 overflow-hidden flex-row items-center justify-between pr-2 ${isPaused ? 'bg-[#F5F5F5] border-[#E5E5E5]' : (isDangerTime ? 'bg-[#FFF0F0] border-[#FF4B4B]' : 'bg-[#FFF3E0] border-[#FFC800]')}`}>
                  <View className="flex-row items-center px-4 pt-3 pb-2 flex-1">
                    <FontAwesome5 name="clock" size={16} color={isPaused ? "#AFAFAF" : (isDangerTime ? "#FF4B4B" : "#FF9600")} solid />
                    <View className="flex-1 ml-3 h-2.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                      <Animated.View className={`h-full rounded-full ${isPaused ? 'bg-[#AFAFAF]' : (isDangerTime ? 'bg-[#FF4B4B]' : 'bg-[#FF9600]')}`} style={{ width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
                    </View>
                  </View>
                  {/* ম্যানুয়াল পজ বাটন */}
                  <TouchableOpacity onPress={() => {
                      if (isPaused) {
                          setIsPaused(false);
                          Animated.timing(timerAnim, { toValue: 0, duration: timeLeft * 1000, easing: Easing.linear, useNativeDriver: false }).start();
                      } else {
                          setIsPaused(true);
                          timerAnim.stopAnimation();
                      }
                  }} className="p-3">
                      <FontAwesome5 name={isPaused ? "play" : "pause"} size={14} color={isPaused ? "#AFAFAF" : (isDangerTime ? "#FF4B4B" : "#FF9600")} />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {(currentItem.type === 'read' || currentItem.type === 'quiz') && (
                <View className="flex-row items-center mb-5 pr-2">
                  <Text className="text-[22px] text-[#3C3C3C] pt-1 flex-1 leading-8" style={{ fontFamily: 'BanglaBold' }}>
                    {currentItem.type === 'read' ? 'মনোযোগ দিয়ে পড়ো:' : currentItem.question}
                  </Text>
                </View>
              )}

              <ScrollView 
                ref={scrollViewRef} showsVerticalScrollIndicator={false} className="flex-1"
              >
                <Animated.View style={{ opacity: cardFadeAnim, transform: [{ translateY: cardSlideAnim }] }}>

                {currentItem.type === 'read' && (
                  <View className="pb-6">
                    {currentItem.readType === 'tap' && <TapToRevealCard item={currentItem} />}
                    {currentItem.readType === 'priority' && <PriorityHighlightCard item={currentItem} />}
                    {currentItem.readType === 'magic' && <MagicTrickCard item={currentItem} />}

                    {currentItem.readType === 'confidence' && (
                      <ConfidenceMeterCard 
                        item={currentItem} 
                        onNext={handleNext} 
                        onMarkForRevision={() => {
                          setFailedItems(prev => {
                            if (!prev.find(item => item.id === currentItem.id)) return [...prev, currentItem];
                            return prev;
                          });
                          handleNext();
                        }} 
                      />
                    )}

                    {currentItem.readType === 'swipe' && (
                      <BiteSizedSwipeCard item={currentItem} onSwipedAway={handleNext} />
                    )}
                  </View>
                )}   

                {currentItem.type === 'quiz' && (
                  <View className="mt-2 pb-10">
                    {currentItem.options?.map((option, index) => {
                      const isSelected = selectedOption === index;
                      let bgColor = 'bg-white';
                      let borderColor = 'border-[#E5E5E5] border-b-[#D7D7D7]';
                      let textColor = 'text-[#4B4B4B]';

                      const isOptionCorrect = index === Number(currentItem.answer) || String(option) === String(currentItem.answer);

                      if (showFeedback) {
                        if (isOptionCorrect) {
                          bgColor = 'bg-[#D7FFB8]'; borderColor = 'border-[#58CC02] border-b-[#58CC02]'; textColor = 'text-[#58A700]';
                        } else if (isSelected && !isCorrect) {
                          bgColor = 'bg-[#FFD7D7]'; borderColor = 'border-[#FF4B4B] border-b-[#FF4B4B]'; textColor = 'text-[#D63939]';
                        }
                      } else if (isSelected) {
                        bgColor = 'bg-[#DDF4FF]'; borderColor = 'border-[#1CB0F6] border-b-[#1899D6]'; textColor = 'text-[#1899D6]';
                      }

                      return (
                        <TouchableOpacity 
                          key={index} activeOpacity={0.8}
                          onPress={() => {
                            if (!showFeedback) {
                              setSelectedOption(index);
                              processQuizResult(isOptionCorrect);
                            }
                          }}
                          className={`mb-3 rounded-2xl border-2 border-b-[5px] p-4 ${bgColor} ${borderColor}`}
                        >
                          <Text className={`text-lg pt-1 ${textColor}`} style={{ fontFamily: 'BanglaBold' }}>{String(option)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* 💡 ধাপ ১: কারণ ব্যাখ্যার পেজ (Server Overloaded) */}
                {currentItem.type === 'quiz_error' && (
                  <View className="items-center justify-center py-6 px-2 mt-4">
                    <View className="bg-[#FFF4E5] w-20 h-20 rounded-full items-center justify-center mb-4 border-[4px] border-[#FFC800]">
                      <FontAwesome5 name="hourglass-half" size={28} color="#FF9600" />
                    </View>
                    <Text className="text-[22px] text-[#3C3C3C] text-center leading-8 mb-2" style={{ fontFamily: 'BanglaBold' }}>
                      ফ্রি সার্ভার ওভারলোডেড
                    </Text>
                    <Text className="text-[15px] text-[#777777] text-center mt-2 mb-6 leading-6 px-2" style={{ fontFamily: 'BanglaRegular' }}>
                      ফ্রি এআই সার্ভারে অনেক বেশি রিকোয়েস্ট থাকার কারণে এই কুইজটির ডেটা প্রসেস হতে সমস্যা হয়েছে। এটি অ্যাপের কোনো ত্রুটি নয়!
                    </Text>

                    {/* সাইকোলজিক্যাল ইনস্ট্রাকশন */}
                    <Text className="text-[14px] text-[#4B4B4B] text-center mb-3 px-4 leading-5" style={{ fontFamily: 'BanglaBold' }}>
                      এই সমস্যাটি সমাধান করে ১০০% নির্ভুল ডেটা পেতে প্রিমিয়াম আপগ্রেড করো। আপগ্রেড করতে নিচের বাটনে ক্লিক করো
                    </Text>

                    <TouchableOpacity activeOpacity={0.8} onPress={() => setPremiumModalVisible(true)} className="w-full mb-3">
                      <View className="bg-[#D4B300] rounded-2xl pb-[6px]">
                        <View className="bg-[#FFC800] rounded-2xl py-4 items-center justify-center flex-row">
                          <FontAwesome5 name="crown" size={18} color="#FFF" style={{ marginRight: 8 }} />
                          <Text className="text-white text-[17px] pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রিমিয়ামে আপগ্রেড করো</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.8} onPress={() => submitReport('auto-error')} className="w-full">
                      <View className="bg-[#E5E5E5] rounded-2xl pb-[6px]">
                        <View className="bg-[#F0F0F0] rounded-2xl py-3.5 items-center justify-center flex-row">
                          <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>স্কিপ করে সামনে যান</Text>
                          <FontAwesome5 name="arrow-right" size={14} color="#777777" style={{ marginLeft: 8 }} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {currentItem.type === 'quiz_blanks' && <View className="pb-10"><FillInkKeywords key={`blanks_${step}`} questionText={currentItem.question} chips={currentItem.options} correctAnswers={currentItem.answers} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_drag_drop' && <View className="pb-10"><DragAndDrop key={`dragdrop_${step}`} questionText={currentItem.question} pairs={currentItem.pairs} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_matching' && <View className="pb-10"><CardPuzzle key={`matching_${step}`} questionText={currentItem.question} pairs={currentItem.pairs} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_blur_puzzle' && <View className="pb-10"><BlurPuzzle key={`blur_${step}`} questionText={currentItem.question} answerWord={currentItem.answerWord} options={currentItem.options} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_imposter' && <View className="pb-10"><ImposterQuiz key={`imposter_${step}`} questionText={currentItem.question} options={currentItem.options} answerWord={currentItem.answerWord} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_tap_mistake' && <View className="pb-10"><TapTheMistake key={`mistake_${step}`} questionText={currentItem.question} sentence={currentItem.sentence} wrongWordIndex={currentItem.wrongWordIndex} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_swipe_quiz' && <View className="pb-10"><SwipeQuiz key={`swipe_${step}`} questionText={currentItem.question} facts={currentItem.facts} explanation={currentItem.explanation} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_bucket_drop' && <View className="pb-10"><BucketDropQuiz key={`bucket_${step}`} questionText={currentItem.question} buckets={currentItem.buckets} items={currentItem.items} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_vertical_reorder' && <View className="pb-10"><Verticaldrapdrop key={`reorder_${step}`} questionText={currentItem.question} correctOrder={currentItem.correctOrder} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                {currentItem.type === 'quiz_spelling_quiz' && <View className="pb-10"><Spellingquiz key={`spelling_${step}`} questionText={currentItem.question} word={currentItem.word} scrambledLetters={currentItem.scrambledLetters} onComplete={(isUserCorrect) => processQuizResult(isUserCorrect)} /></View>}
                </Animated.View>
              </ScrollView>
            </>
          )}
        </View>

        {!isGameOver && !isComplete && showDefaultNextBtn && (
          <View className="px-5 pb-8 pt-4 bg-transparent z-10">
            <TouchableOpacity activeOpacity={0.8} onPress={handleNext} className="w-full">
              <View className="bg-[#1899D6] rounded-2xl pb-[6px]"><View className="bg-[#1CB0F6] rounded-2xl pt-4 pb-3 flex-row justify-center items-center"><Text className="text-white text-lg pt-1" style={{ fontFamily: 'BanglaBold' }}>পরবর্তী ধাপ</Text></View></View>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View 
          pointerEvents={showFeedback ? 'auto' : 'none'}
          style={{ transform: [{ translateY: slideAnim }], zIndex: 100, elevation: 20 }} 
          className={`absolute bottom-0 w-full px-5 pt-6 pb-10 rounded-t-[32px] ${isCorrect ? 'bg-[#D7FFB8]' : 'bg-[#FFD7D7]'}`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Image source={{ uri: isCorrect ? emojiUrls.correct : emojiUrls.wrong }} style={{ width: 40, height: 40 }} resizeMode="contain" />
              <Text className={`text-2xl ml-3 pt-1 ${isCorrect ? 'text-[#58A700]' : 'text-[#D63939]'}`} style={{ fontFamily: 'BanglaBold' }}>{isCorrect ? 'অসাধারণ!' : 'সঠিক হয়নি!'}</Text>
            </View>
            {isCorrect && (
              <View className="flex-row items-center bg-[#58A700]/10 px-3 py-1.5 rounded-full">
                <FontAwesome5 name="fire-alt" size={13} color="#58A700" solid />
                <Text className="text-[#58A700] text-sm pt-1 ml-1.5" style={{ fontFamily: 'BanglaBold' }}>+১ কম্বো</Text>
              </View>
            )}
          </View>

          <Text className={`text-[15px] mb-5 pt-1 ${isCorrect ? 'text-[#58A700]' : 'text-[#D63939]'}`} style={{ fontFamily: 'BanglaRegular' }}>
            <Text style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা: </Text>{currentItem?.explanation || 'সঠিক উত্তর দেওয়া হয়েছে।'}
          </Text>

          {isCorrect ? (
             <View className="h-1.5 bg-[#58A700]/30 rounded-full w-full overflow-hidden mt-2">
               <Animated.View className="h-full bg-[#58A700] rounded-full" style={{ width: loadingAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
             </View>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={handleNext} className="w-full">
              <View className="bg-[#D63939] rounded-2xl pb-[6px]"><View className="bg-[#FF4B4B] rounded-2xl pt-4 pb-3 flex-row justify-center items-center"><Text className="text-white text-lg pt-1" style={{ fontFamily: 'BanglaBold' }}>বুঝতে পেরেছি</Text></View></View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Report Modal */}
        <Modal visible={reportModalVisible} transparent={true} animationType="slide" onRequestClose={() => setReportModalVisible(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setReportModalVisible(false)} />
            <View className="bg-white rounded-t-[32px] p-6 pb-10 w-full border-t-4 border-[#E5E5E5]">
              <View className="items-center mb-6 mt-2">
                <View className="bg-[#FFD7D7] w-16 h-16 rounded-full items-center justify-center mb-4 border-4 border-[#FF4B4B]">
                   <FontAwesome5 name="flag" size={24} color="#FF4B4B" solid />
                </View>
                <Text className="text-[22px] text-[#3C3C3C] text-center" style={{fontFamily: 'BanglaBold'}}>সমস্যা রিপোর্ট করুন</Text>
                <Text className="text-[15px] text-[#777777] text-center mt-2 leading-6 px-4" style={{fontFamily: 'BanglaRegular'}}>
                  এই কুইজটিতে ঠিক কী ধরণের সমস্যা হচ্ছে? রিপোর্ট করলে কুইজটি স্কিপ হয়ে যাবে।
                </Text>
              </View>

              {['কুইজের ফরম্যাটে বা অপশনে সমস্যা', 'তথ্যে বা উত্তরে ভুল আছে', 'অন্য কোনো সমস্যা'].map((opt, i) => (
                <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => submitReport(opt)} className="mb-3">
                  <View className="bg-[#E5E5E5] rounded-2xl pb-[4px]">
                    <View className="bg-white rounded-2xl py-4 flex-row justify-center items-center border-2 border-[#E5E5E5]">
                      <Text className="text-[#4B4B4B] text-[16px] pt-1" style={{fontFamily: 'BanglaBold'}}>{opt}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity activeOpacity={0.8} onPress={() => setReportModalVisible(false)} className="mt-2">
                <View className="bg-[#E5E5E5] rounded-2xl pb-[6px]">
                  <View className="bg-[#F0F0F0] rounded-2xl py-4 flex-row justify-center items-center">
                    <Text className="text-[#AFAFAF] text-lg pt-1" style={{fontFamily: 'BanglaBold'}}>বাতিল করুন</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 💡 ধাপ ২: আপগ্রেডেড প্রিমিয়াম ফিচার মোডাল */}
        <Modal visible={premiumModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPremiumModalVisible(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setPremiumModalVisible(false)} />
            <View className="bg-white rounded-t-[36px] p-6 pb-10 w-full shadow-2xl border-t-4 border-[#E5E5E5]">
                <View className="items-center justify-center py-2">
                  <View className="bg-[#FFF4E5] w-20 h-20 rounded-full items-center justify-center mb-4 border-[4px] border-[#FFC800]">
                    <FontAwesome5 name="gem" size={32} color="#FF9600" solid />
                  </View>

                  <Text className="text-[22px] text-[#3C3C3C] text-center px-2 mb-4" style={{ fontFamily: 'BanglaBold' }}>
                    প্রো আনলক করো! 🚀
                  </Text>

                  <View className="w-full bg-[#F7F7F7] rounded-2xl p-4 mb-6 border-2 border-[#E5E5E5]">
                    <View className="flex-row items-center mb-4">
                      <View className="bg-[#FFC800]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                         <FontAwesome5 name="bolt" size={16} color="#FF9600" />
                      </View>
                      <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>সুপারফাস্ট ভিআইপি এআই সার্ভার</Text>
                    </View>

                    <View className="flex-row items-center mb-4">
                      <View className="bg-[#58CC02]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                         <FontAwesome5 name="coins" size={14} color="#58A700" />
                      </View>
                      <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>প্রতিদিন ৩০০ প্রিমিয়াম কয়েন</Text>
                    </View>

                    <View className="flex-row items-center mb-4">
                      <View className="bg-[#1CB0F6]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                         <FontAwesome5 name="bullseye" size={16} color="#1899D6" />
                      </View>
                      <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>১০০% নির্ভুল গ্যামিফাইড কুইজ</Text>
                    </View>

                    <View className="flex-row items-center">
                      <View className="bg-[#CE82FF]/20 w-9 h-9 items-center justify-center rounded-xl mr-3">
                         <FontAwesome5 name="infinity" size={14} color="#A559D6" />
                      </View>
                      <Text className="text-[15px] text-[#4B4B4B] flex-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>আনলিমিটেড নোট স্ক্যানিং সুবিধা</Text>
                    </View>
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={handlePremiumUpgrade} className="w-full mb-3">
                    <View className="bg-[#D4B300] rounded-2xl pb-[6px]">
                      <View className="bg-[#FFC800] rounded-2xl py-4 flex-row justify-center items-center">
                        <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                        <Text className="text-white text-[17px] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>মেসেজ করে আপগ্রেড করো</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.8} onPress={() => setPremiumModalVisible(false)} className="w-full">
                    <View className="bg-[#E5E5E5] rounded-2xl pb-[6px]">
                      <View className="bg-[#F0F0F0] rounded-2xl py-3.5 flex-row justify-center items-center">
                        <Text className="text-[#777777] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>ফিরে যান</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
            </View>
          </View>
        </Modal>

      </Animated.View>
    </Modal>
  );
}