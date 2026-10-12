import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, AppState, Modal, Alert, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// 🚀 কাস্টম স্প্ল্যাশ ও মেইনটেন্যান্স স্ক্রিন ইমপোর্ট
import SplashScreen from '../components/SplashScreen'; 
import MaintainanceScreen from '../components/MaintainanceScreen';

import TopBar from '../components/TopBar';
import ImageSlides from '../components/ImageSlides';
import DailyChallenge from '../components/DailyChallenge';
import Bottombar from '../components/Bottombar';
import PoraShuruKorun from '../components/PoraShuruKorun'; 

import AiBadassContentGenerationEngine from '../components/AiBadassContentGenerationEngine'; 
import { runNetworkDiagnostic } from '../components/AiMasterMind';
import SignUpLoginPage from '../components/SignUpLoginPage';

let cachedChallenges = [];
let cachedUserCoins = 50;
let currentUserId = 'default_user'; 

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // 🚀 মেইনটেন্যান্স স্টেট
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
  const [isMaintenanceChecked, setIsMaintenanceChecked] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const [isAiModalVisible, setAiModalVisible] = useState(false);
  const [isLessonVisible, setLessonVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [activeTab, setActiveTab] = useState('in_progress');

  const [userCoins, setUserCoins] = useState(cachedUserCoins);
  const [challenges, setChallenges] = useState(cachedChallenges);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Edit Card States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [editCardName, setEditCardName] = useState('');

  // 🚀 স্প্ল্যাশ চলাকালীনই সার্ভার মেইনটেন্যান্স চেক করার ফাংশন
  useEffect(() => {
    let isMounted = true;
    const checkServerMaintenance = async () => {
      try {
        const response = await fetch('https://growshelby-api.vercel.app/api/get_settings');
        const data = await response.json();
        
        if (isMounted) {
          if (data.isMaintenance) {
            setIsMaintenance(true);
            setMaintenanceEndTime(data.maintenanceEndTime);
          } else {
            setIsMaintenance(false);
          }
        }
      } catch (error) {
        console.log("Initial maintenance check error:", error);
      } finally {
        if (isMounted) setIsMaintenanceChecked(true);
      }
    };

    checkServerMaintenance();

    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsMaintenanceChecked(true);
    }, 3500);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // 🚀 স্ট্রং ডেইলি কয়েন রিসেট লজিক
  const checkDailyReset = async (uid) => {
    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/reset_daily_coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'Growshelby_MVP_Secret_2026'
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

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const loggedInStatus = await AsyncStorage.getItem('@is_logged_in');
        const _isLoggedIn = loggedInStatus === 'true';
        setIsLoggedIn(_isLoggedIn);

        if (_isLoggedIn) {
          const uid = await AsyncStorage.getItem('@current_user_id') || 'default_user';
          currentUserId = uid;

          const resetCoins = await checkDailyReset(uid);

          const savedNotebooks = await AsyncStorage.getItem(`@my_notebooks_${uid}`);
          if (savedNotebooks !== null) {
            const parsed = JSON.parse(savedNotebooks);
            setChallenges(parsed);
            cachedChallenges = parsed;
          } else if (uid === 'default_user') {
            const oldNotebooks = await AsyncStorage.getItem('@my_notebooks');
            if (oldNotebooks !== null) {
              setChallenges(JSON.parse(oldNotebooks));
              cachedChallenges = JSON.parse(oldNotebooks);
            } else {
              setChallenges([]);
            }
          } else {
            setChallenges([]);
          }

          if (resetCoins !== null) {
            setUserCoins(resetCoins);
          } else {
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
          }
        }
      } catch (error) {
        console.error("ডাটা লোড করতে সমস্যা হয়েছে:", error);
      } finally {
        setIsDataLoaded(true); 
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

  const handleGenerateNewCard = (newCardData) => {
    setChallenges(prev => [newCardData, ...prev]);
    setActiveTab('in_progress');
  };

  const handleStartReading = (lessonItem) => {
    setSelectedLesson(lessonItem);
    setLessonVisible(true);
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
      Alert.alert("সতর্কতা", "নোটবুকের নাম ফাঁকা রাখা যাবেবিধা!");
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

  // 🚀 ডাটা লোড হওয়া ও লগইন স্ট্যাটাসের কম্বাইন্ড ভ্যালু (এটা স্প্ল্যাশ স্ক্রিনে পাঠানো হবে)
  const isReadyToEnter = isDataLoaded && isLoggedIn !== null && isMaintenanceChecked;

  // 🚀 ১. সবার আগে স্প্ল্যাশ স্ক্রিন
  if (showSplash) {
    return (
      <SplashScreen 
        isReady={isReadyToEnter} 
        onFinish={() => setShowSplash(false)} 
      />
    );
  }

  // 🚀 ২. স্প্ল্যাশ শেষ হওয়ার সাথে সাথেই যদি সার্ভার মেইনটেন্যান্স অন থাকে, সরাসরি মেইনটেন্যান্স স্ক্রিন আসবে
  if (isMaintenance) {
    return (
      <MaintainanceScreen 
        endTime={maintenanceEndTime} 
        onMaintenanceEnd={() => setIsMaintenance(false)} 
      />
    );
  }

  // ৩. স্প্ল্যাশ স্ক্রিন শেষ হওয়ার পর যদি ইউজার লগইন না থাকে, তাহলে লগইন পেজে যাবে
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

  // ৪. ইউজার লগইন থাকলে সরাসরি মেইন অ্যাপ রেন্ডার হবে
  return (
    <View className="flex-1 bg-white">

      <TopBar refreshTrigger={refreshCount} />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 110 }} 
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

        <DailyChallenge 
          challenges={challenges}
          setChallenges={setChallenges}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onStartReading={handleStartReading}
          onDeleteCard={handleDeleteCard}
          onEditCard={(id, name) => {
            setEditCardId(id);
            setEditCardName(name);
            setIsEditModalVisible(true);
          }}
        />
      </ScrollView>

      <Modal
        visible={isAiModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <AiBadassContentGenerationEngine 
            onCancel={() => setAiModalVisible(false)}
            userCoins={userCoins}
            setUserCoins={setUserCoins}
            onLessonGenerated={(aiGeneratedData, customNotebookName) => {
              const topicCount = aiGeneratedData.length;
              const mcqCount = aiGeneratedData.filter(item => item.quizType === 'mcq' || item.quizType === 'blanks').length;

              const newAiCard = { 
                id: 'ai_' + Date.now(), 
                status: 'in_progress', 
                notebookName: customNotebookName,
                target: `${topicCount} টি টপিক • ${mcqCount > 0 ? mcqCount : topicCount + 2} টি এমসিকিউ`,
                color: '#CE82FF', 
                darkColor: '#A559D6',
                failedItems: aiGeneratedData 
              };

              handleGenerateNewCard(newAiCard);
              setAiModalVisible(false);
            }} 
          />
        </View>
      </Modal>

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

      <PoraShuruKorun 
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
          setTimeout(() => setAiModalVisible(true), 400); 
        }}
      />

      <Bottombar onChallengePress={() => setAiModalVisible(true)} />

    </View>
  );
}