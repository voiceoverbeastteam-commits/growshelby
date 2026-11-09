import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, RefreshControl, AppState, Modal, Alert, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Animated, Image, DeviceEventEmitter, InteractionManager } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// 🚀 কাস্টম স্প্ল্যাশ ও মেইনটেন্যান্স স্ক্রিন ইমপোর্ট
import SplashScreen from '../components/SplashScreen'; 
import MaintainanceScreen from '../components/MaintainanceScreen';

import TopBar from '../components/TopBar';
import ImageSlides from '../components/ImageSlides';
import Bottombar from '../components/Bottombar';
import PorarPageEyeComfort from '../components/PorarPageEyeComfort';

import { runNetworkDiagnostic } from '../components/AiMasterMind';
import SignUpLoginPage from '../components/SignUpLoginPage';
import PushNotification from '../components/PushNotification'; // 🚀 পুশ নোটিফিকেশন কম্পোনেন্ট ইমপোর্ট করা হলো


let cachedChallenges = [];
let cachedUserCoins = 50;
let currentUserId = 'default_user'; 

// 🚀 গ্লোবাল লাইভ ব্যাজ কম্পোনেন্ট
const LiveBadge = () => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <View className="bg-[#FF4B4B] rounded-full px-3 py-1.5 flex-row items-center shadow-sm">
      <Animated.View style={{ opacity: blinkAnim }} className="w-2 h-2 rounded-full bg-white" />
      <Text className="text-white text-[11px] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>লাইভ কুইজ</Text>
    </View>
  );
};

// 🚀 কমিউনিটিতে কোনো কুইজ লাইভ আছে কিনা তার হেল্পার
const isCommunityLive = (guide, nowTime) => {
  return guide.quizWindows?.some(w => nowTime >= w.start && nowTime < w.end) ?? false;
};

// 🚀 Skeleton Loading Card (ইউটিউবের মতো শিমার ইফেক্ট)
const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

return (
    <Animated.View style={{ opacity: shimmerAnim }} className="mb-8" pointerEvents="none">
      <View className="w-full aspect-[16/9] bg-[#E5E5E5] rounded-xl" />
      <View className="flex-row mt-3 px-1">
        <View className="w-11 h-11 rounded-full bg-[#E5E5E5] mr-3" />
        <View className="flex-1 mt-1">
          <View className="h-4 bg-[#E5E5E5] rounded-full w-3/4 mb-2.5" />
          <View className="h-3 bg-[#E5E5E5] rounded-full w-1/2" />
        </View>
      </View>
    </Animated.View>
  );
};

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // 🚀 মেইনটেন্যান্স স্টেট
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
  const [isMaintenanceChecked, setIsMaintenanceChecked] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const [isLessonVisible, setLessonVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [activeTab, setActiveTab] = useState('in_progress');

  const [exploreGuides, setExploreGuides] = useState([]);
  const [myJoinedCommunities, setMyJoinedCommunities] = useState([]); // 🚀 আমার কমিউনিটি লিস্ট সেভ করার স্টেট
  const [isExploreLoading, setIsExploreLoading] = useState(true);
  const [exploreCategory, setExploreCategory] = useState('টপ কমিউনিটি');
  const [dynamicCategories, setDynamicCategories] = useState(['টপ কমিউনিটি', 'আমার কমিউনিটি']);
  const [userCoins, setUserCoins] = useState(cachedUserCoins);
  const [challenges, setChallenges] = useState(cachedChallenges);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Edit Card States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [editCardName, setEditCardName] = useState('');

  // 🚀 স্ক্রল এনিমেশনের জন্য
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    if (currentScrollY <= 0) {
      // স্ক্রল একদম উপরে থাকলে বার দেখাও
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else if (currentScrollY > lastScrollY.current + 8) {
      // নিচের দিকে স্ক্রল করলে হাইড করো (150px নিচে পাঠাও)
      Animated.timing(translateY, { toValue: 150, duration: 250, useNativeDriver: true }).start();
    } else if (currentScrollY < lastScrollY.current - 8) {
      // উপরের দিকে স্ক্রল করলে আবার শো করো
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    
    lastScrollY.current = currentScrollY;
  };

 // 🚀 স্প্ল্যাশ চলাকালীনই সার্ভার মেইনটেন্যান্স চেক করার ফাংশন (Non-blocking)
  useEffect(() => {
    let isMounted = true;
    setIsMaintenanceChecked(true); // 🚀 সাথে সাথে অ্যাপ আনব্লক করে দিলাম!
    
    const checkServerMaintenance = async () => {
      try {
        const response = await fetch('https://growshelby-api.vercel.app/api/get_settings');
        const data = await response.json();
        
        if (isMounted && data && data.isMaintenance) {
          setIsMaintenance(true);
          setMaintenanceEndTime(data.maintenanceEndTime);
        }
      } catch (error) {
        console.log("Maintenance check error:", error);
      }
    };

    checkServerMaintenance(); // ব্যাকগ্রাউন্ডে এপিআই কল হবে, অ্যাপ আটকে থাকবে না

    return () => {
      isMounted = false;
    };
  }, []);

  // 🚀 স্ট্রং ডেইলি কয়েন রিসেট লজিক
  const checkDailyReset = async (uid) => {
    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/reset_daily_coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY
        },
        body: JSON.stringify({ email: uid })
      });

      const data = await response.json();

      if (data.success && data.coins !== undefined) {
         setUserCoins(data.coins);
         cachedUserCoins = data.coins;
         await AsyncStorage.setItem(`@user_coins_${uid}`, data.coins.toString());
         return data.coins;
      }
      return null;
    } catch (error) {
      console.error('Reset Sync Error:', error);
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkAuthStatus = async () => {
        try {
          const loggedInStatus = await AsyncStorage.getItem('@is_logged_in');
          const _isLoggedIn = loggedInStatus === 'true';

          if (_isLoggedIn !== isLoggedIn) {
             setIsLoggedIn(_isLoggedIn);

             if (!_isLoggedIn) {
               setChallenges([]);
               cachedChallenges = [];
               setUserCoins(50);
               cachedUserCoins = 50;
               currentUserId = 'default_user';
             }
          }
        } catch (error) {
          console.error("Auth status check error:", error);
        }
      };
      checkAuthStatus();
    }, [isLoggedIn])
  );

useEffect(() => {
    runNetworkDiagnostic();
  }, []);

 const loadExploreGuides = async () => {
    if (exploreGuides.length === 0 && myJoinedCommunities.length === 0) {
      setIsExploreLoading(true);
    }
    
    try {
      const uid = await AsyncStorage.getItem('@current_user_id');
      
  const [exploreRes, joinedRes] = await Promise.all([
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'fetch_explore_channels', userEmail: uid }) // 🚀 ফিক্স: সার্ভারে মাস্টার চেক করার জন্য uid পাঠানো হলো
        }).then(r => r.json()).catch(() => ({ success: false, channels: [] })), // 🚀 ফিক্স: এরর হলে খালি লিস্ট রিটার্ন করবে
        
        uid && uid !== 'guest' && uid !== 'default_user' ? 
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'fetch_joined_communities', userEmail: uid })
        }).then(r => r.json()).catch(() => ({})) : Promise.resolve({})
      ]);

    if (exploreRes.channels) { // 🚀 ফিক্স: success না হলেও channels (খালি) পেলে লিস্ট ক্লিয়ার করবে
        const validChannels = exploreRes.channels.filter(c => 
          c && 
          c.notebookName && 
          c.notebookName.trim() !== '' && 
          c.notebookName !== 'স্মার্ট কমিউনিটি' && 
          (uid === 'rumontrader662@gmail.com' || (c.membersCount || 0) >= 3)
        );
        
        const sortedChannels = validChannels.sort((a, b) => {
          const scoreA = ((a.averageRating || 0) * 10) + (a.membersCount || 1);
          const scoreB = ((b.averageRating || 0) * 10) + (b.membersCount || 1);
          return scoreB - scoreA;
        });
        setExploreGuides(sortedChannels);
      } else {
        setExploreGuides([]); // 🚀 ফিক্স: এরর হলে বা লিস্ট খালি এলে পুরনো ডেটা মুছে ফেলবে
      }

      if (joinedRes.success && joinedRes.channels) {
        setMyJoinedCommunities(joinedRes.channels);
      }

      setDynamicCategories(['টপ কমিউনিটি', 'আমার কমিউনিটি']);
      
    } catch (error) {
      console.log('Error fetching guides:', error);
    } finally { 
      setIsExploreLoading(false); 
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (isDataLoaded) loadExploreGuides();
    }, [isDataLoaded])
  );

 useEffect(() => {
    const loadLocalData = async () => {
      try {
        const loggedInStatus = await AsyncStorage.getItem('@is_logged_in');
        const _isLoggedIn = loggedInStatus === 'true';
        setIsLoggedIn(_isLoggedIn);

        if (_isLoggedIn) {
          const uid = await AsyncStorage.getItem('@current_user_id') || 'default_user';
          currentUserId = uid;

          // 🚀 ১. আগে লোকাল স্টোরেজ থেকে বইগুলো ইনস্ট্যান্টলি লোড করবো
          const savedNotebooks = await AsyncStorage.getItem(`@my_notebooks_${uid}`);
          if (savedNotebooks !== null) {
            setChallenges(JSON.parse(savedNotebooks));
            cachedChallenges = JSON.parse(savedNotebooks);
          } else if (uid === 'default_user') {
            const oldNotebooks = await AsyncStorage.getItem('@my_notebooks');
            if (oldNotebooks !== null) {
              setChallenges(JSON.parse(oldNotebooks));
              cachedChallenges = JSON.parse(oldNotebooks);
            } else {
              setChallenges([]);
            }
          }

          // 🚀 ২. এরপর লোকাল স্টোরেজ থেকে কয়েন ইনস্ট্যান্টলি লোড করবো
          const savedCoins = await AsyncStorage.getItem(`@user_coins_${uid}`);
          if (savedCoins !== null) {
            setUserCoins(parseInt(savedCoins));
            cachedUserCoins = parseInt(savedCoins);
          } else if (uid === 'default_user') {
            const oldCoins = await AsyncStorage.getItem('@user_coins');
            if (oldCoins !== null) {
              setUserCoins(parseInt(oldCoins));
              cachedUserCoins = parseInt(oldCoins);
            } else {
              setUserCoins(50);
            }
          } else {
            setUserCoins(50);
          }

          // 🚀 ৩. ব্যাকগ্রাউন্ডে সার্ভার থেকে কয়েন চেক করতে পাঠাবো (কোনো await নেই, তাই অ্যাপ আটকে থাকবে না!)
          checkDailyReset(uid).then(serverCoins => {
            if (serverCoins !== null) {
              setUserCoins(serverCoins);
              cachedUserCoins = serverCoins;
            }
          });
        }
      } catch (error) {
        console.error("ডাটা লোড করতে সমস্যা হয়েছে:", error);
      } finally {
        setIsDataLoaded(true); // 🚀 সব কাজ শেষ, সাথে সাথে স্প্ল্যাশ স্ক্রিন রিমুভ!
      }
    };

    if (!isDataLoaded) {
      loadLocalData();
    }
  }, [isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded && isLoggedIn) {
      cachedChallenges = challenges;
      AsyncStorage.setItem(`@my_notebooks_${currentUserId}`, JSON.stringify(challenges)).catch(err => console.error(err));
    }
  }, [challenges, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    if (isDataLoaded && isLoggedIn) {
      cachedUserCoins = userCoins;
      AsyncStorage.setItem(`@user_coins_${currentUserId}`, userCoins.toString()).catch(err => console.error(err));
    }
  }, [userCoins, isDataLoaded, isLoggedIn]);

  // 🚀 ম্যাজিক ফিক্স: অ্যাপ লোড হলে বা নতুন অ্যাকাউন্টে ঢুকলে ১০০% গ্যারান্টি দিয়ে পুশ টোকেন সিঙ্ক করবে!
  useEffect(() => {
    if (isDataLoaded && isLoggedIn) {
      DeviceEventEmitter.emit('USER_LOGGED_IN_SYNC_TOKEN');
    }
  }, [isDataLoaded, isLoggedIn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshCount(prev => prev + 1); 
    
    try {
      const loggedInStatus = await AsyncStorage.getItem('@is_logged_in');
      if (loggedInStatus === 'true') {
        const uid = await AsyncStorage.getItem('@current_user_id');
        if (uid && uid !== 'default_user') {
          await checkDailyReset(uid);
        }
      }
    } catch (error) {
      console.log('Refresh sync error:', error);
    }
    
    setTimeout(() => setRefreshing(false), 1500); 
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        setRefreshCount(prev => prev + 1); 
        const loggedInStatus = await AsyncStorage.getItem('@is_logged_in');
        if (loggedInStatus === 'true') {
          const uid = await AsyncStorage.getItem('@current_user_id');
          if (uid) await checkDailyReset(uid);
        }
      }
    });
    return () => subscription.remove();
  }, []);

const handleStartReading = (lessonItem) => {
    setSelectedLesson({ ...lessonItem, isFromExplore: true });
    setLessonVisible(true);
  };

  // 🚀 Push Notification এ ক্লিক করলে নির্দিষ্ট কমিউনিটি ওপেন করার ম্যাজিক ফাংশন
  const handleNotificationClick = (data) => {
    if (data && data.guideId) {
      // লোকাল চ্যালেঞ্জ বা এক্সপ্লোর ফিড থেকে কমিউনিটিটি খুঁজে বের করা
      const targetCommunity = challenges.find(c => c.shareCode === data.guideId || c.channelId === data.guideId) 
                           || exploreGuides.find(c => c.shareCode === data.guideId || c.channelId === data.guideId);
      
      if (targetCommunity) {
        handleStartReading(targetCommunity);
      } else {
        // যদি লিস্টে না থাকে, তবু সরাসরি ওপেন করার জন্য ডামি ডেটা তৈরি করা
        handleStartReading({ channelId: data.guideId, notebookName: "কমিউনিটি চ্যাট" });
      }
    }
  };

  const handleCompleteLesson = (originalLesson, failedItems) => {
    setChallenges(prev => {
      let updatedChallenges = prev.map(card => 
        card.id === originalLesson.id ? { ...card, status: 'completed' } : card
      );

      if (failedItems && failedItems.length > 0) {
        const revisionCard = {
          ...originalLesson,
          id: 'rev_' + Date.now(),
          status: 'revision', 
          notebookName: originalLesson.notebookName + ' (রিভিশন)',
          target: `${failedItems.length} টি ভুল টপিক`, 
          color: '#FF4B4B', 
          darkColor: '#D63939',
          failedItems: failedItems 
        };
        updatedChallenges = [revisionCard, ...updatedChallenges];
      }
      return updatedChallenges;
    });

    setActiveTab(failedItems && failedItems.length > 0 ? 'revision' : 'completed');
    setLessonVisible(false);
  };

  const handleDeleteCard = (cardId) => {
    Alert.alert(
      "ডিলিট নোটবুক",
      "তুমি কি নিশ্চিত যে এই নোটবুকটি ডিলিট করতে চাও?",
      [
        { text: "না", style: "cancel" },
        {
          text: "হ্যাঁ",
          style: "destructive",
          onPress: () => {
            setChallenges(prev => prev.filter(c => c.id !== cardId));
          }
        }
      ]
    );
  };

  const handleSaveEdit = () => {
    if (editCardName.trim() === '') {
      Alert.alert("সতর্কতা", "নোটবুকের নাম ফাঁকা রাখা যাবে না!");
      return;
    }
    setChallenges(prev => prev.map(c =>
      c.id === editCardId ? { ...c, notebookName: editCardName } : c
    ));
    setIsEditModalVisible(false);
    setEditCardId(null);
    setEditCardName('');
  };

 const inProgressChallenges = challenges.filter(c => c.status === 'in_progress' && c.id !== selectedLesson?.id);
  const nextChallenge = inProgressChallenges.length > 0 ? inProgressChallenges[0] : null;

  // 🚀 ম্যাজিক ফিক্স: লগআউটের ইভেন্ট লিসেন করে গ্লোবাল ভেরিয়েবল ও স্টেট ক্লিন করা
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('USER_LOGGED_OUT_CLEAR_CACHE', () => {
      setChallenges([]);
      setUserCoins(50);
      setExploreGuides([]);
      setMyJoinedCommunities([]); // যদি আগের স্টেপে অ্যাড করে থাকেন
      
      cachedChallenges = [];
      cachedUserCoins = 50;
      currentUserId = 'default_user';
      
   setIsLoggedIn(false);
      setIsDataLoaded(false); // 🚀 ডেটা লোড স্টেট ফলস করে দিলাম, যাতে নতুন লগইনে আবার ফ্রেশ ডেটা ফেচ হয়
    });

    // 🚀 ম্যাজিক ফিক্স: নতুন লগইন হলে ফোর্স করে আবার ডাটা লোড করানো
    const refreshSubscription = DeviceEventEmitter.addListener('FORCE_REFRESH_HOME_DATA', () => {
      setIsDataLoaded(false); 
      loadExploreGuides(); // এক্সপ্লোর ফিডও নতুন করে লোড হবে
    });

    return () => {
      subscription.remove();
      refreshSubscription.remove();
    };
  }, []);

 // 🚀 প্রতি ৩০ সেকেন্ডে হোমের লাইভ স্ট্যাটাস চেক করার জন্য লোকাল ঘড়ি
  const [liveClock, setLiveClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isReadyToEnter = isDataLoaded && isLoggedIn !== null && isMaintenanceChecked;

 if (showSplash) {
    return (
      <SplashScreen
        isReady={isReadyToEnter} 
        onFinish={() => {
          setShowSplash(false);
          // 🚀 অ্যাপ পুরোপুরি রেডি, পুশ নোটিফিকেশনকে নেভিগেট করার সিগন্যাল দিচ্ছি
          DeviceEventEmitter.emit('APP_IS_READY_FOR_NAVIGATION');
        }} 
      />
    );
  }

  if (isMaintenance) {
    return (
      <MaintainanceScreen 
        endTime={maintenanceEndTime} 
        onMaintenanceEnd={() => setIsMaintenance(false)} 
      />
    );
  }

  if (isLoggedIn === false) {
    return <SignUpLoginPage onLoginSuccess={async () => {
      try {
        const uid = await AsyncStorage.getItem('@current_user_id') || 'default_user';
        currentUserId = uid;

        const savedNotebooks = await AsyncStorage.getItem(`@my_notebooks_${uid}`);
        if (savedNotebooks !== null) {
          const parsed = JSON.parse(savedNotebooks);
          setChallenges(parsed);
          cachedChallenges = parsed;
        } else {
          setChallenges([]);
          cachedChallenges = [];
        }

        const serverCoins = await checkDailyReset(uid);
        if (serverCoins !== null) {
          setUserCoins(serverCoins);
        } else {
          const savedCoins = await AsyncStorage.getItem(`@user_coins_${uid}`);
          if (savedCoins !== null) {
            setUserCoins(parseInt(savedCoins));
            cachedUserCoins = parseInt(savedCoins);
          } else {
            setUserCoins(50);
            cachedUserCoins = 50;
          }
        }

        setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
      }
    }} />;
  }

return (
    <View className="flex-1 bg-white">
      
    {/* PushNotification এখন _layout.js থেকে গ্লোবালি হ্যান্ডেল হচ্ছে, তাই এখান থেকে রিমুভ করা হলো */}

      <TopBar refreshTrigger={refreshCount} />

   <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 110 }} 
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#1CB0F6" 
            colors={['#1CB0F6', '#FFC800']} 
            progressBackgroundColor="#ffffff" 
            progressViewOffset={15} 
          />
        }
      >
        <ImageSlides refreshTrigger={refreshCount} />

 {/* 🚀 হট টপিকস (ডাইনামিক ক্যাটাগরি চিপস) */}
        <View className="px-5 mt-4 mb-4">
         <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" keyboardShouldPersistTaps="handled">
            {dynamicCategories.map((cat, index) => (
            <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => setExploreCategory(cat)} delayPressIn={0} className={`px-4 py-2 rounded-full border mr-2 ${exploreCategory === cat ? 'bg-[#1899D6] border-[#1899D6]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}>
                <Text className={`text-[13px] pt-0.5 ${exploreCategory === cat ? 'text-white' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 🚀 কমিউনিটি কার্ড লিস্ট (The Hook) */}
        <View className="px-5"></View>

       {/* 🚀 কমিউনিটি কার্ড লিস্ট (The Hook) */}
        <View className="px-5">
          {isExploreLoading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
       ) : exploreCategory === 'আমার কমিউনিটি' && myJoinedCommunities.length === 0 ? (
            // 🚀 ইউজার কোনো কমিউনিটিতে জয়েন না থাকলে এই মেসেজ দেখাবে
            <View className="items-center py-10 mt-10">
              <FontAwesome5 name="users-slash" size={40} color="#D7D7D7" />
              <Text className="text-[#AFAFAF] text-[16px] mt-4" style={{ fontFamily: 'BanglaBold' }}>আপনি এখনো কোনো কমিউনিটিতে জয়েন করেননি</Text>
            </View>
         ) : (
                // 🚀 ম্যাজিক: 'আমার কমিউনিটি' সিলেক্ট করলে myJoinedCommunities রেন্ডার হবে, নাহলে exploreGuides
                (exploreCategory === 'আমার কমিউনিটি' ? myJoinedCommunities : exploreGuides)
                  .map((guide, idx) => (

         <TouchableOpacity key={idx} activeOpacity={0.9} delayPressIn={0} onPress={() => handleStartReading(guide)} className="mb-8">
                <View className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#F0F2F5] border border-[#E5E5E5] relative">
                  <Image source={{ uri: guide.banner || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000' }} className="w-full h-full" resizeMode="cover" />
                  {/* 🚀 লাইভ কুইজ ব্যাজ */}
                  {isCommunityLive(guide, liveClock) && (
                    <View className="absolute top-3 right-3 z-10">
                      <LiveBadge />
                    </View>
                  )}
                </View>
                <View className="flex-row mt-3 px-1">
                 <View className="w-11 h-11 rounded-full border border-[#E5E5E5] bg-[#F9F9F9] mr-3 overflow-hidden">
                    <Image source={{ uri: guide.creatorAvatar || 'https://i.pravatar.cc/150?img=12' }} className="w-full h-full" />
                  </View>
                  <View className="flex-1 justify-center -mt-1">
                    <Text className="text-[#3C3C3C] text-[17px] leading-[26px] pt-1 mb-1" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>{guide.notebookName || guide.creatorName}</Text>
                    <View className="flex-row items-center pr-2">
                      <Text className="text-[#777777] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>{guide.creatorName || 'শিক্ষার্থী'}</Text>
                      <Text className="text-[#AFAFAF] text-[8px] mx-1.5">●</Text>
                      <FontAwesome5 name="users" size={10} color="#777777" />
                      <Text className="text-[#777777] text-[12px] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{guide.membersCount || 1}</Text>
                      <Text className="text-[#AFAFAF] text-[8px] mx-1.5">●</Text>
                      <FontAwesome5 name="star" size={10} color="#FF9600" solid />
                      <Text className="text-[#777777] text-[12px] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{guide.averageRating > 0 ? guide.averageRating.toFixed(1) : 'নতুন'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-center px-4">
          <View className="bg-white w-full rounded-[24px] p-6 border-b-4 border-[#E5E5E5]">
            <Text className="text-xl mb-4 text-[#3C3C3C] text-center" style={{ fontFamily: 'BanglaBold' }}>নোটবুকের নাম পরিবর্তন</Text>
            
            <TextInput
              className="bg-[#F5F5F5] p-4 rounded-xl text-[16px] text-[#3C3C3C] mb-6 border-2 border-[#E5E5E5]"
              style={{ fontFamily: 'BanglaRegular' }}
              value={editCardName}
              onChangeText={setEditCardName}
              placeholder="নতুন নাম লিখুন..."
              placeholderTextColor="#AFAFAF"
              autoFocus
            />
            
            <View className="flex-row justify-between space-x-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsEditModalVisible(false)}
                className="flex-1 mx-1"
              >
                <View style={{ backgroundColor: '#E5E5E5', borderRadius: 16, paddingBottom: 6 }}>
                  <View style={{ backgroundColor: '#F0F0F0', borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                    <Text className="text-[#777777] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveEdit}
                className="flex-1 mx-1"
              >
                <View style={{ backgroundColor: '#1899D6', borderRadius: 16, paddingBottom: 6 }}>
                  <View style={{ backgroundColor: '#1CB0F6', borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                    <Text className="text-white text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সেভ করুন</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

     <PorarPageEyeComfort 
        visible={isLessonVisible} 
        onClose={() => setLessonVisible(false)}
        lessonItem={selectedLesson} 
        onComplete={handleCompleteLesson} 
        nextChallenge={nextChallenge}
        onReviseNow={(originalLesson, failedItems) => {
          const revisionCard = {
            ...originalLesson,
            id: 'rev_' + Date.now(),
            status: 'revision',
            notebookName: originalLesson.notebookName + ' (রিভিশন)',
            target: `${failedItems.length} টি ভুল টপিক`,
            color: '#FF4B4B',
            darkColor: '#D63939',
            failedItems: failedItems
          };
          setChallenges(prev => {
            let updated = prev.map(card => card.id === originalLesson.id ? { ...card, status: 'completed' } : card);
            return [revisionCard, ...updated];
          });
          setActiveTab('revision');
          setSelectedLesson(revisionCard);
        }}
        onStartNext={(originalLesson, failedItems, nextItem) => {
          setChallenges(prev => {
            let updated = prev.map(card => card.id === originalLesson.id ? { ...card, status: 'completed' } : card);
            if (failedItems && failedItems.length > 0) {
               const revisionCard = {
                  ...originalLesson,
                  id: 'rev_' + Date.now(),
                  status: 'revision',
                  notebookName: originalLesson.notebookName + ' (রিভিশন)',
                  target: `${failedItems.length} টি ভুল টপিক`,
                  color: '#FF4B4B',
                  darkColor: '#D63939',
                  failedItems: failedItems
               };
               updated = [revisionCard, ...updated];
            }
            return updated;
          });
          setActiveTab(failedItems && failedItems.length > 0 ? 'revision' : 'in_progress');
          setSelectedLesson(nextItem);
        }}
        onGenerateNew={(originalLesson, failedItems) => {
          handleCompleteLesson(originalLesson, failedItems);
        }}
      />

      <Bottombar translateY={translateY} />

    </View>
  );
}