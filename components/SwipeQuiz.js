import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, Dimensions, TouchableOpacity, ScrollView, Easing } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FLY_OUT_DURATION = 350;
const AUTO_SWIPE_TIME = 3000; // ৩ সেকেন্ড পর পর অটোমেটিক সোয়াইপ হবে

export default function SwipeQuiz({ 
  questionText = "তথ্যগুলো সত্য না মিথ্যা যাচাই করো:", 
  facts = [], 
  explanation = "", 
  onComplete 
}) {
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);
  const [lastDirection, setLastDirection] = useState('right');

  const position = useRef(new Animated.ValueXY()).current;
  const flipAnim = useRef(new Animated.Value(0)).current; 
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerProgress = useRef(new Animated.Value(1)).current;

  const isAnimating = useRef(false);
  const hasCompletedRef = useRef(false);
  const autoSwipeTimer = useRef(null);

  const deckRef = useRef([]);
  const currentIndexRef = useRef(0);
  const isFlippedRef = useRef(false);

  useEffect(() => { deckRef.current = deck; }, [deck]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isFlippedRef.current = isFlipped; }, [isFlipped]);

  useEffect(() => {
    if ((!facts || facts.length === 0) && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      if (onComplete) onComplete(true); 
    } else if (facts.length > 0) {
      setDeck([...facts]);
    }
  }, [facts, onComplete]);

  // কার্ডের অটো কাউন্টডাউন এবং উইগল (Shake) সাইকোলজিক্যাল অ্যানিমেশন
  useEffect(() => {
    if (currentIndex >= deck.length || isFlipped || deck.length === 0) {
      if (autoSwipeTimer.current) clearTimeout(autoSwipeTimer.current);
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
      return;
    }

    // টাইমার প্রগ্রেস রিসেট ও স্টার্ট
    timerProgress.setValue(1);
    Animated.timing(timerProgress, {
      toValue: 0,
      duration: AUTO_SWIPE_TIME,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // ১.৮ সেকেন্ড পর উইগল/কাঁপাকাঁপি শুরু হবে যাতে ইউজার বুঝতে পারে যে কার্ড চলে যাচ্ছে
    const shakeTimeout = setTimeout(() => {
      if (!isFlippedRef.current && !isAnimating.current) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8, duration: 70, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 70, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]),
          { iterations: 4 }
        ).start();
      }
    }, 1800);

    // ৩ সেকেন্ড পর অটোমেটিক কার্ড পিছনে চলে যাবে
    autoSwipeTimer.current = setTimeout(() => {
      if (!isFlippedRef.current && !isAnimating.current) {
        // টাইম শেষ হলে কার্ড স্বয়ংক্রিয়ভাবে পিছনে সরে যাবে
        handleAutoAdvance();
      }
    }, AUTO_SWIPE_TIME);

    return () => {
      if (autoSwipeTimer.current) clearTimeout(autoSwipeTimer.current);
      clearTimeout(shakeTimeout);
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
    };
  }, [currentIndex, isFlipped, deck.length]);

  const handleAutoAdvance = () => {
    if (isAnimating.current || currentIndexRef.current >= deckRef.current.length || isFlippedRef.current) return;
    isAnimating.current = true;

    // স্মুথভাবে কার্ড ফেড ও স্লাইড হয়ে ডেক-এর পেছনে চলে যাবে
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: SCREEN_WIDTH + 80, y: 30 },
        duration: FLY_OUT_DURATION,
        useNativeDriver: false,
      })
    ]).start(() => {
      // কার্ডটিকে ডেকের একদম শেষে পাঠিয়ে দেওয়া হয় যাতে ইউজার পরে আবার সুযোগ পায়
      moveToNextCard(true);
    });
  };

  const handleAnswerAction = (userChoiceTrue, direction) => {
    if (isAnimating.current || currentIndexRef.current >= deckRef.current.length || hasCompletedRef.current || isFlippedRef.current) return;
    isAnimating.current = true;

    if (autoSwipeTimer.current) clearTimeout(autoSwipeTimer.current);
    shakeAnim.stopAnimation();
    shakeAnim.setValue(0);

    const currentFact = deckRef.current[currentIndexRef.current];
    const isMistake = userChoiceTrue !== currentFact.isTrue;

    if (!isMistake) {
      flyAway(direction, false);
    } else {
      setLastDirection(direction);
      setIsFlipped(true); 

      Animated.parallel([
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          useNativeDriver: false,
        }),
        Animated.timing(flipAnim, {
          toValue: 180,
          duration: 350,
          useNativeDriver: false 
        })
      ]).start();
    }
  };

  const handleAnswer = (userChoiceTrue) => {
    handleAnswerAction(userChoiceTrue, userChoiceTrue ? 'right' : 'left');
  };

  const handleUnderstood = () => {
    setIsFlipped(false);
    flyAway(lastDirection, true);
  };

  const flyAway = (direction, wasMistake) => {
    const isRightSwipe = direction === 'right';

    Animated.timing(position, {
      toValue: { 
        x: isRightSwipe ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100, 
        y: 40 
      },
      duration: FLY_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      moveToNextCard(wasMistake);
    });
  };

  const moveToNextCard = (wasMistake) => {
    let currentDeck = deckRef.current;

    if (wasMistake) {
      currentDeck = [...currentDeck, currentDeck[currentIndexRef.current]];
      setDeck(currentDeck);
    }

    const nextIndex = currentIndexRef.current + 1;

    if (nextIndex >= currentDeck.length) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        if (onComplete) onComplete(true); 
      }
    }

    setCurrentIndex(nextIndex);
    position.setValue({ x: 0, y: 0 }); 
    flipAnim.setValue(0); 
    shakeAnim.setValue(0);
    isAnimating.current = false;
  };

  const renderCards = () => {
    if (currentIndex >= deck.length) {
      return <View className="flex-1 min-h-[250px]" />;
    }

    return deck.map((fact, index) => {
      if (index < currentIndex) return null;

      if (index === currentIndex) {
        const flyRotate = position.x.interpolate({
          inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          outputRange: ['-10deg', '0deg', '10deg'],
          extrapolate: 'clamp'
        });

        const frontRotateY = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
        const backRotateY = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

        return (
          <Animated.View
            key={`card_${index}`}
            style={{ 
              transform: [
                { translateX: position.x }, 
                { translateY: position.y }, 
                { translateX: shakeAnim }, 
                { rotate: flyRotate }
              ], 
              zIndex: 10 
            }}
            className="absolute w-full h-[250px] justify-center items-center"
          >
            {/* Front of the Card */}
            <Animated.View 
              style={{ transform: [{ rotateY: frontRotateY }], backfaceVisibility: 'hidden' }}
              className="absolute w-full h-full bg-white border-2 border-b-[6px] border-[#E5E5E5] border-b-[#D7D7D7] rounded-3xl p-6 justify-between items-center shadow-sm overflow-hidden"
            >
              {/* উপরের কাউন্টডাউন প্রগ্রেস বার */}
              <View className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
                <Animated.View 
                  className="h-full bg-[#1CB0F6] rounded-full" 
                  style={{ width: timerProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} 
                />
              </View>

              <View className="flex-1 justify-center items-center px-2">
                <Text className="text-2xl text-center text-[#4B4B4B] leading-9" style={{ fontFamily: 'BanglaBold' }}>
                  {fact.text}
                </Text>
              </View>

              {/* তাড়া দেওয়ার ইন্ডিকেটর */}
              <View className="flex-row items-center py-1">
                <FontAwesome5 name="stopwatch" size={13} color="#FF9600" />
                <Text className="text-[13px] text-[#FF9600] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                  দ্রুত সিদ্ধান্ত নাও!
                </Text>
              </View>
            </Animated.View>

            {/* Back of the Card (Feedback) */}
            <Animated.View 
              style={{ transform: [{ rotateY: backRotateY }], backfaceVisibility: 'hidden' }}
              className="absolute w-full h-full bg-[#FFD7D7] border-2 border-b-[6px] border-[#FF4B4B] border-b-[#D63939] rounded-3xl p-4 justify-between items-center shadow-sm"
            >
              <View className="items-center w-full mt-1">
                <View className="bg-[#FF4B4B] w-10 h-10 rounded-full items-center justify-center mb-1 shadow-sm">
                  <FontAwesome5 name="times" size={20} color="#FFF" />
                </View>
                <Text className="text-[17px] text-[#D63939] mb-1.5" style={{ fontFamily: 'BanglaBold' }}>
                  এটি সঠিক নয়!
                </Text>
                <View className="bg-white/60 px-3 py-1 rounded-lg mb-1">
                  <Text className="text-[14px] text-[#D63939]" style={{ fontFamily: 'BanglaBold' }}>
                    সঠিক উত্তর: এটি {fact.isTrue ? 'সত্য' : 'মিথ্যা'} হবে
                  </Text>
                </View>
              </View>

              <ScrollView 
                className="flex-1 w-full mt-1 mb-2 px-1" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              >
                <Text className="text-[14px] text-center text-[#D63939] leading-5 opacity-90" style={{ fontFamily: 'BanglaRegular' }}>
                  <Text style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা: </Text>
                  {fact.explanation || explanation || `প্রদত্ত তথ্যটি আসলে ${fact.isTrue ? 'সত্য' : 'মিথ্যা'}।`}
                </Text>
              </ScrollView>

              {isFlipped && (
                <TouchableOpacity activeOpacity={0.8} onPress={handleUnderstood} className="w-full z-20">
                  <View className="bg-[#D63939] rounded-xl pb-[5px]">
                    <View className="bg-[#FF4B4B] rounded-xl pt-3 pb-2.5 items-center justify-center">
                      <Text className="text-white text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>বুঝতে পেরেছি</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </Animated.View>
          </Animated.View>
        );
      }

      // Next Card preview logic (Zooms in as the top card moves away)
      if (index === currentIndex + 1) {
        const nextCardScale = position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [1, 0.95, 1],
          extrapolate: 'clamp'
        });

        const nextCardOpacity = position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [1, 0.65, 1],
          extrapolate: 'clamp'
        });

        const nextCardTranslateY = position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [0, 12, 0],
          extrapolate: 'clamp'
        });

        return (
          <Animated.View 
            key={`card_${index}`} 
            style={{ 
              opacity: nextCardOpacity,
              transform: [{ scale: nextCardScale }, { translateY: nextCardTranslateY }], 
              zIndex: 5 
            }} 
            className="absolute w-full h-[250px] bg-white border-2 border-[#E5E5E5] rounded-3xl justify-center items-center shadow-sm" 
          />
        );
      }
      return null;
    }).reverse();
  };

  return (
    <View className="w-full mt-2">

      <View className="flex-row items-center mb-6">
        <View className="bg-[#1CB0F6] w-8 h-8 rounded-full items-center justify-center mr-3 shadow-sm">
          <FontAwesome5 name="layer-group" size={14} color="#FFF" />
        </View>
        <Text className="text-xl text-[#3C3C3C] pt-1 flex-1" style={{ fontFamily: 'BanglaBold' }}>
          {questionText}
        </Text>
      </View>

      <View className="relative w-full h-[280px] items-center justify-center">
        {renderCards()}
      </View>

      {/* অ্যাকশন বাটন: ইউজার দেখার সাথে সাথে সত্য বা মিথ্যা ট্যাপ করবে */}
      {currentIndex < deck.length && (
        <View className="flex-row justify-between w-full mt-4 gap-4">
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => handleAnswer(false)} 
            disabled={isFlipped}
            className={`flex-1 h-[64px] rounded-2xl border-2 items-center justify-center shadow-sm ${isFlipped ? 'border-[#E5E5E5] bg-[#F5F5F5]' : 'border-[#FF4B4B] border-b-[5px] bg-white'}`}
          >
            <Text className={`text-[19px] pt-1 ${isFlipped ? "text-[#AFAFAF]" : "text-[#FF4B4B]"}`} style={{ fontFamily: 'BanglaBold' }}>
              মিথ্যা
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => handleAnswer(true)} 
            disabled={isFlipped}
            className={`flex-1 h-[64px] rounded-2xl border-2 items-center justify-center shadow-sm ${isFlipped ? 'border-[#E5E5E5] bg-[#F5F5F5]' : 'border-[#58CC02] border-b-[5px] bg-white'}`}
          >
            <Text className={`text-[19px] pt-1 ${isFlipped ? "text-[#AFAFAF]" : "text-[#58A700]"}`} style={{ fontFamily: 'BanglaBold' }}>
              সত্য
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}