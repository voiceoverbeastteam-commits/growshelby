import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Animated, Dimensions, LayoutAnimation, UIManager, Platform, ActivityIndicator, FlatList, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';
import Discussion from './Discussion';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🚀 রিডিং ইঞ্জিনের কোশ্চেন লোডিং শিমার
const QuestionSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm mx-1 mt-2">
      <View className="flex-row justify-between items-center mb-4">
        <View className="w-16 h-6 bg-[#E5E5E5] rounded-md" />
        <View className="w-24 h-8 bg-[#F9F9F9] rounded-full border border-[#E5E5E5]" />
      </View>
      <View className="w-full h-4 bg-[#E5E5E5] rounded-full mb-3" />
      <View className="w-4/5 h-4 bg-[#E5E5E5] rounded-full mb-6" />
      <View className="w-full h-12 bg-[#F9F9F9] rounded-xl border border-[#E5E5E5]" />
    </Animated.View>
  );
};

const normalizeText = (text) => {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[।.,;:'"()\-\s]/g, '').toLowerCase();
};

// 💡 শর্ট অ্যানসার কার্ড
const ShortAnswerCard = ({ data, globalReveal, onOpenDiscussion }) => {
 const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // 🚀 ম্যাজিক অ্যানিমেশন
    setShowAnswer(globalReveal);
  }, [globalReveal]);

  const toggleAnswer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAnswer(!showAnswer);
  };

  return (
    <View className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#1CB0F6]/10 px-3 py-1 rounded-lg border border-[#1CB0F6]/30">
          <Text className="text-[12px] text-[#1899D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{data.type}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-[#3C3C3C] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>
      
      {showAnswer ? (
        <View className="bg-[#F2F6F9] p-4 rounded-xl border border-[#D7D7D7] mt-2">
          <Text className="text-[#4B4B4B] text-[15px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{data.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
          <TouchableOpacity onPress={toggleAnswer} className="self-end mt-3">
            <Text className="text-[#FF4B4B] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleAnswer} className="bg-[#E5E5E5] p-3 rounded-xl items-center border border-[#D7D7D7] border-dashed">
          <Text className="text-[#777777] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 💡 এমসিকিউ কার্ড
const MCQCard = ({ data, globalReveal, onOpenDiscussion }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // 🚀 ম্যাজিক অ্যানিমেশন
    setShowAnswer(globalReveal);
  }, [globalReveal]);

  const toggleAnswer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAnswer(!showAnswer);
  };

  let anyOptionMatched = false;
  const normalizedCorrectText = normalizeText(data.correctAnswer);

  return (
    <View className="bg-white p-5 rounded-[20px] border-2 border-[#E5E5E5] mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#A559D6]/10 px-3 py-1 rounded-lg border border-[#A559D6]/30">
          <Text className="text-[12px] text-[#A559D6] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>এমসিকিউ</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-[#FDF6E3] px-3 py-1.5 rounded-full border border-[#EFE8D6]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      
      <Text className="text-[#3C3C3C] text-[17px] mb-4 leading-8" style={{ fontFamily: 'BanglaBold' }}>{data.question}</Text>

      <View className="mb-4 space-y-2">
        {data.options?.map((option, index) => {
          const normalizedOption = normalizeText(option);
          let isCorrectOption = false;

          if (data.answer !== undefined && data.answer !== null && Number(data.answer) === index) isCorrectOption = true;
          else if (normalizedCorrectText && normalizedOption && (normalizedOption === normalizedCorrectText || normalizedOption.includes(normalizedCorrectText) || normalizedCorrectText.includes(normalizedOption))) isCorrectOption = true;
          else if (normalizedCorrectText === String.fromCharCode(2453 + index)) isCorrectOption = true;

          if (isCorrectOption) anyOptionMatched = true;
          const isHighlighted = showAnswer && isCorrectOption;

          return (
            <View className={`flex-row items-center p-3 rounded-lg border mb-2 ${isHighlighted ? 'bg-[#D7FFB8] border-[#58CC02]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`} key={index}>
              <View className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${isHighlighted ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
                <Text className={`text-[13px] ${isHighlighted ? 'text-white' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>{String.fromCharCode(2453 + index)}</Text>
              </View>
              <Text className={`text-[15px] flex-1 pt-1 ${isHighlighted ? 'text-[#58A700]' : 'text-[#4B4B4B]'}`} style={{ fontFamily: isHighlighted ? 'BanglaBold' : 'BanglaRegular', lineHeight: 24 }}>{option}</Text>
              {isHighlighted && <FontAwesome5 name="check-circle" size={16} color="#58A700" />}
            </View>
          );
        })}
      </View>

      {showAnswer ? (
        <View className="mt-2">
          {data.explanation && (
            <View className="bg-[#F2F6F9] p-4 rounded-xl border border-[#D7D7D7]">
              <Text className="text-[#4B4B4B] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা:</Text>
              <Text className="text-[#6B655B] text-[14px] mt-1 leading-6" style={{ fontFamily: 'BanglaRegular' }}>{data.explanation}</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleAnswer} className="self-end mt-3">
            <Text className="text-[#FF4B4B] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>উত্তর লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={toggleAnswer} className="bg-[#E5E5E5] p-3 rounded-xl items-center border border-[#D7D7D7] border-dashed">
          <Text className="text-[#777777] text-[15px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সঠিক উত্তর দেখুন <FontAwesome5 name="check-circle" size={12}/></Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 💡 সৃজনশীল কার্ড
const CQCard = ({ data, globalReveal, subFilter, onOpenDiscussion }) => {
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const filteredQuestions = data.questions?.filter(q => {
    if (subFilter === 'ক') return q.label.includes('ক');
    if (subFilter === 'খ') return q.label.includes('খ');
    if (subFilter === 'গ ও ঘ') return q.label.includes('গ') || q.label.includes('ঘ');
    return true; 
  }) || [];

const showStem = subFilter === 'সব' || subFilter === 'গ ও ঘ';

useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // 🚀 ম্যাজিক অ্যানিমেশন
    const newState = {};
    filteredQuestions.forEach((_, i) => newState[i] = globalReveal);
    setRevealedAnswers(newState);
  }, [globalReveal, subFilter, data.questions]);
  

  if (filteredQuestions.length === 0) return null;

  const toggleAnswer = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <View className="bg-[#FFF4E5] p-5 rounded-[20px] border-2 border-[#FFC800] mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-[#FF9600]/10 px-3 py-1 rounded-lg border border-[#FF9600]/30">
          <Text className="text-[12px] text-[#D47B00] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>সৃজনশীল প্রশ্ন</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenDiscussion(data)} className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-[#FFDDAA]">
          <FontAwesome5 name="comments" size={12} color="#D47B00" />
          <Text className="text-[12px] text-[#D47B00] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আলোচনা</Text>
        </TouchableOpacity>
      </View>
      
      {showStem && (
        <View className="mb-4 bg-white p-4 rounded-xl border border-[#FFDDAA]">
          <Text className="text-[#D47B00] text-[14px] mb-2" style={{ fontFamily: 'BanglaBold' }}>উদ্দীপক:</Text>
          <Text className="text-[#3C3C3C] text-[16px] leading-8" style={{ fontFamily: 'BanglaRegular' }}>{data.stem}</Text>
        </View>
      )}
      
      <View className={`${showStem ? 'border-t border-[#FFDDAA] pt-4' : ''}`}>
        {filteredQuestions.map((q, index) => (
          <View className="mb-5" key={index}>
            <Text className="text-[#3C3C3C] text-[16px] mb-2 leading-7" style={{ fontFamily: 'BanglaBold' }}>{q.label}) {q.question}</Text>
            {revealedAnswers[index] ? (
              <View className="bg-white p-4 rounded-xl border border-[#FFC800] mt-2">
                <Text className="text-[#4B4B4B] text-[15px] leading-7" style={{ fontFamily: 'BanglaRegular' }}>{q.answer || 'কোনো উত্তর পাওয়া যায়নি।'}</Text>
                <TouchableOpacity onPress={() => toggleAnswer(index)} className="self-end mt-3">
                  <Text className="text-[#D47B00] text-[13px]" style={{ fontFamily: 'BanglaBold' }}>লুকান <FontAwesome5 name="eye-slash" size={12}/></Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleAnswer(index)} className="bg-white p-3 rounded-xl items-center border border-[#FFC800] border-dashed">
                <Text className="text-[#D47B00] text-[14px] pt-1" style={{ fontFamily: 'BanglaBold' }}>{q.label}-এর উত্তর দেখুন <FontAwesome5 name="eye" size={12}/></Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default function SmartReaderEngine({ visible, onClose, guideData, onOpenChat }) {
  const insets = useSafeAreaInsets();
  
 const [activeCategory, setActiveCategory] = useState('সব');
  const [cqSubFilter, setCqSubFilter] = useState('সব');
  const [globalReveal, setGlobalReveal] = useState(false);
  
  // 🚀 টপিক ফিল্টারের স্টেট
 const [activeTopic, setActiveTopic] = useState('সব টপিক');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  
  // 🚀 টেম্পোরারি ফিল্টার স্টেট (শুধুমাত্র মডালের ভেতরে কাজ করার জন্য)
  const [tempCategory, setTempCategory] = useState(activeCategory);
  const [tempCqSubFilter, setTempCqSubFilter] = useState(cqSubFilter);
  const [tempTopic, setTempTopic] = useState(activeTopic);

  // মডাল ওপেন হলে কারেন্ট ফিল্টারগুলো টেম্পোরারিতে সেট করে নেওয়া
  useEffect(() => {
    if (isFilterModalVisible) {
      setTempCategory(activeCategory);
      setTempCqSubFilter(cqSubFilter);
      setTempTopic(activeTopic);
    }
  }, [isFilterModalVisible]);
  
 const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const [discussionVisible, setDiscussionVisible] = useState(false);
  // 🚀 লাইভ মেম্বার ট্র্যাক করার স্টেট
  const [activeMembers, setActiveMembers] = useState([]);
  const [showLiveMembersModal, setShowLiveMembersModal] = useState(false);

  // 🚀 Pusher Presence Channel & Notification Logic
  useEffect(() => {
    let pusher;
    let presenceChannel;

    const setupLiveReading = async () => {
      if (!visible || !guideData) return;

      const guideId = guideData.channelId || guideData.id || guideData.shareCode;
      if(!guideId) return;

      const uid = await AsyncStorage.getItem('@current_user_id') || 'guest_' + Date.now();
      const userName = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || 'শিক্ষার্থী';
      const userAvatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || await AsyncStorage.getItem('@user_avatar') || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

   // ১. পড়া শুরু করার নোটিফিকেশন পাঠানো (২ ঘণ্টার কুলডাউন সহ)
      const cooldownKey = `@notify_cooldown_${guideId}`;
      const lastNotified = await AsyncStorage.getItem(cooldownKey);
      const now = Date.now();

      if (!lastNotified || now - parseInt(lastNotified) > 2 * 60 * 60 * 1000) {
        const targetChannelId = guideData.channelId || guideData.creatorEmail; 
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({
            action: 'notify_reading_started',
            guideId,
            channelId: targetChannelId,
            notebookName: guideData.notebookName,
            userEmail: uid,
            userName: name,
            userAvatar: avatar
          })
        }).catch(()=>{});
        await AsyncStorage.setItem(cooldownKey, now.toString());
      }

      // ২. পুশার প্রেজেন্স চ্যানেলে জয়েন করা (রিয়েল-টাইম ট্র্যাকিং)
      pusher = new Pusher('94415a0ec2e09647c277', {
        cluster: 'mt1',
        authorizer: (channel, options) => {
          return {
            authorize: (socketId, callback) => {
              fetch('https://growshelby-api.vercel.app/api/update_coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
                body: JSON.stringify({ action: 'pusher_auth', socket_id: socketId, channel_name: channel.name, userEmail: uid, userName, userAvatar })
              })
              .then(res => res.json())
              .then(data => callback(null, data))
              .catch(err => callback(err, null));
            }
          };
        }
      });

      presenceChannel = pusher.subscribe(`presence-guide_${guideId}`);

      // চ্যানেল సাকসেসফুলি কানেক্ট হলে
      presenceChannel.bind('pusher:subscription_succeeded', (members) => {
        const membersArray = [];
        members.each((member) => membersArray.push(member.info));
        setActiveMembers(membersArray);
      });

      // নতুন কেউ জয়েন করলে
      presenceChannel.bind('pusher:member_added', (member) => {
        setActiveMembers(prev => {
          if(prev.find(m => m.name === member.info.name)) return prev;
          return [member.info, ...prev];
        });
      });

      // কেউ বের হয়ে গেলে
      presenceChannel.bind('pusher:member_removed', (member) => {
        setActiveMembers(prev => prev.filter(m => m.name !== member.info.name));
      });
    };

    setupLiveReading();

    return () => {
      if (presenceChannel) {
        presenceChannel.unbind_all();
        presenceChannel.unsubscribe();
      }
      if (pusher) pusher.disconnect();
    };
  }, [visible, guideData]);
  const [activeDiscussionData, setActiveDiscussionData] = useState(null);

  // 🚀 নতুন: ইনস্ট্যান্ট লোড এবং শিমারের স্টেট
 const [isContentReady, setIsContentReady] = useState(false);
  // 🚀 বাটনে লাইট/লোডিং দেখানোর স্টেট
  const [isRevealLoading, setIsRevealLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  // 🚀 ফোকাস মোড এবং লাইভ রিয়্যাকশন স্টেট
 // 🚀 ফোকাস মোড এবং লাইভ রিয়্যাকশন স্টেট
  const [isReactionVisible, setIsReactionVisible] = useState(true);
  const [activeReaders, setActiveReaders] = useState([]);
  const [membersModalVisible, setMembersModalVisible] = useState(false);

  // 🚀 ইনভাইট ও মেম্বার সার্চ স্টেট
  const [searchQuery, setSearchQuery] = useState('');
  const [communityMembersList, setCommunityMembersList] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);

  const fetchCommunityMembers = async () => {
    if (!guideData) return;
    const guideId = guideData.channelId || guideData.id || guideData.shareCode;
    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'get_community_members', guideId, limit: 100, skip: 0 })
      });
      const result = await response.json();
      if (result.success && result.members) {
        setCommunityMembersList(result.members);
      }
    } catch (error) {
      console.log('Error fetching members:', error);
    }
  };

  const handleSendInvite = async (targetEmail) => {
    if (invitedUsers.includes(targetEmail) || !guideData) return;
    setInvitedUsers(prev => [...prev, targetEmail]); // সাথমে সাথে বাটন সবুজ করার জন্য

    const guideId = guideData.channelId || guideData.id || guideData.shareCode;
    const uid = await AsyncStorage.getItem('@current_user_id') || 'guest';
    const name = await AsyncStorage.getItem(`@user_name_${uid}`) || 'শিক্ষার্থী';
    const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({
          action: 'send_reading_invite',
          guideId,
          targetEmail,
          notebookName: guideData.notebookName,
          userName: name,
          userAvatar: avatar
        })
      });
    } catch (error) {
      console.log('Error sending invite:', error);
    }
  };
  // 🚀 Dynamic Social Dock States & Animations
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [liveReaction, setLiveReaction] = useState(null); // { type: 'emoji' | 'message', content: '...', user: {...} }
  const [customMessage, setCustomMessage] = useState('');
  const quickChatScaleAnim = useRef(new Animated.Value(0)).current;
  const reactionSlideAnim = useRef(new Animated.Value(50)).current;
  const reactionFadeAnim = useRef(new Animated.Value(0)).current;
  // 🚀 Queue & Cooldown System
  const [isReactionCooldown, setIsReactionCooldown] = useState(false);
  const reactionQueue = useRef([]);
  const isDisplayingReaction = useRef(false);

  const toggleQuickChat = () => {
    if (isQuickChatOpen) {
      Animated.spring(quickChatScaleAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start(() => setIsQuickChatOpen(false));
    } else {
      setIsQuickChatOpen(true);
      Animated.spring(quickChatScaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    }
  };

 // 🚀 কুইক চ্যাটের পপ-আপ অ্যানিমেশন দেখানোর ফাংশন
  const showReactionBubble = (content, type, user) => {
    setLiveReaction({ type, content, user });
    reactionSlideAnim.setValue(50);
    reactionFadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(reactionFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(reactionSlideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(reactionFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(reactionSlideAnim, { toValue: -50, duration: 300, useNativeDriver: true })
      ]).start(() => setLiveReaction(null));
    }, 4000);
  };

  // 🚀 Queue Manager (একটার পর একটা মেসেজ দেখাবে)
  const processReactionQueue = () => {
    if (isDisplayingReaction.current || reactionQueue.current.length === 0) return;
    
    isDisplayingReaction.current = true;
    const nextReaction = reactionQueue.current.shift();
    
    setLiveReaction(nextReaction);
    reactionSlideAnim.setValue(50);
    reactionFadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(reactionFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(reactionSlideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();

    // 🕒 ৩ সেকেন্ড দেখানোর পর মুছে ফেলবে এবং পরেরটা আনবে
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(reactionFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(reactionSlideAnim, { toValue: -30, duration: 200, useNativeDriver: true })
      ]).start(() => {
        setLiveReaction(null);
        isDisplayingReaction.current = false;
        processReactionQueue(); // পরের মেসেজ চেক করবে
      });
    }, 3000);
  };

  const enqueueReaction = (content, type, user) => {
    reactionQueue.current.push({ content, type, user });
    processReactionQueue();
  };

  // 🚀 রিয়েল ডেটা ফেস করে কুইক চ্যাট পাঠানোর ফাংশন (Cooldown সহ)
  const triggerLiveReaction = async (content, type = 'emoji') => {
    if (isReactionCooldown) return; // 🔒 স্প্যামিং বন্ধ
    
    setIsQuickChatOpen(false);
    quickChatScaleAnim.setValue(0);
    
    // 🕒 ৩ সেকেন্ডের কুলডাউন শুরু
    setIsReactionCooldown(true);
    setTimeout(() => setIsReactionCooldown(false), 3000);
    
    const uid = await AsyncStorage.getItem('@current_user_id') || 'guest_' + Date.now();
    const name = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || 'শিক্ষার্থী';
    const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || await AsyncStorage.getItem('@user_avatar') || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const guideId = guideData?.channelId || guideData?.id || guideData?.shareCode;

    // ১. নিজের স্ক্রিনে কিউতে অ্যাড করা
    enqueueReaction(content, type, { name, avatar });

    // ২. সার্ভারের মাধ্যমে ব্রডকাস্ট
    if(guideId) {
      fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'trigger_live_reaction', guideId, content, type, userEmail: uid, userName: name, userAvatar: avatar })
      }).catch(() => {});
    }
  };
  // 🚀 নতুন: ফিল্টার মোডালের বাউন্সি অ্যানিমেশন স্টেট
  const filterSlideAnim = useRef(new Animated.Value(1000)).current;
  const filterFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && guideData) {
      setIsContentReady(false); // প্রথমে শিমার দেখাবে
      // 🚀 friction: 9, tension: 60 দিয়ে পারফেক্ট বাউন্স দেওয়া হলো
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }).start();
      
      // 🚀 মোডাল ওপেন হওয়ার ৩৫০ মিলি-সেকেন্ড পর আসল কোশ্চেন লোড হবে, তাই কোনো ল্যাগ করবে না
      setTimeout(() => {
        setIsContentReady(true);
      }, 350);
      
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      setIsContentReady(false);
    }
  }, [visible, guideData]);

 // 🚀 রিয়েল-টাইম লাইভ প্রেজেন্স এবং নোটিফিকেশন ট্রিগার (NEW PRESENCE AUTH)
  useEffect(() => {
    let pusher;
    let presenceChannel;

    const setupLivePresence = async () => {
      if (!visible || !guideData) return;
      const guideId = guideData.channelId || guideData.id || guideData.shareCode;
      if (!guideId) return;

      const uid = await AsyncStorage.getItem('@current_user_id') || 'guest_' + Date.now();
      const name = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || 'শিক্ষার্থী';
      const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || await AsyncStorage.getItem('@user_avatar') || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
      
   

      // ২. Pusher চ্যানেল সাবস্ক্রাইব করা (Auth সহ)
      pusher = new Pusher('94415a0ec2e09647c277', { 
        cluster: 'mt1',
        authorizer: (channel, options) => {
          return {
            authorize: (socketId, callback) => {
              fetch('https://growshelby-api.vercel.app/api/update_coins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
                body: JSON.stringify({ action: 'pusher_auth', socket_id: socketId, channel_name: channel.name, userEmail: uid, userName: name, userAvatar: avatar })
              })
              .then(res => res.json())
              .then(data => callback(null, data))
              .catch(err => callback(err, null));
            }
          };
        }
      });

      presenceChannel = pusher.subscribe(`presence-guide_${guideId}`);
      
      presenceChannel.bind('pusher:subscription_succeeded', (members) => {
        const membersArray = [];
        members.each((member) => membersArray.push(member.info));
        setActiveReaders(membersArray);
      });

      presenceChannel.bind('pusher:member_added', (member) => {
        setActiveReaders(prev => {
          if(prev.some(reader => reader.name === member.info.name)) return prev;
          return [member.info, ...prev];
        });
      });

      presenceChannel.bind('pusher:member_removed', (member) => {
        setActiveReaders(prev => prev.filter(m => m.name !== member.info.name));
      });
    // 🚀 অন্য কেউ রিয়েল-টাইমে কুইক চ্যাট বা রিঅ্যাকশন দিলে রিসিভ করবে
      presenceChannel.bind('live_reaction', async (data) => {
        const currentUid = await AsyncStorage.getItem('@current_user_id');
        if (data.user.email !== currentUid) {
          enqueueReaction(data.content, data.type, data.user); // 🚀 Queue-তে অ্যাড হবে
        }
      });
    };

    setupLivePresence();

    return () => {
      if (presenceChannel) { presenceChannel.unbind_all(); presenceChannel.unsubscribe(); }
      if (pusher) pusher.disconnect();
    };
  }, [visible, guideData]);

  // 🚀 ফিল্টার মোডাল বাউন্স করে ওপেন/ক্লোজ হওয়ার ফাংশন
  useEffect(() => {
    if (isFilterModalVisible) {
      Animated.parallel([
        Animated.timing(filterFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(filterSlideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true })
      ]).start();
    }
  }, [isFilterModalVisible]);

  const closeFilterModalSmoothly = () => {
    Animated.parallel([
      Animated.timing(filterFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(filterSlideAnim, { toValue: 1000, duration: 250, useNativeDriver: true })
    ]).start(() => setFilterModalVisible(false));
  };


  const closeWithAnimation = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => onClose());
  };


  

  const openContextualDiscussion = (questionData) => {
    setActiveDiscussionData(questionData);
    setDiscussionVisible(true);
  };

  if (!guideData) return null;

  const extractedData = guideData.failedItems || guideData.data || [];
  const categories = ['সব', ...Array.from(new Set(extractedData.map(item => item.type)))];

  // ১. ক্যাটাগরি অনুযায়ী ফিল্টার
  const categoryFilteredData = extractedData.filter(item => {
    if (activeCategory === 'সব') return true;
    return item.type === activeCategory;
  });

  // ২. এই ক্যাটাগরির ভেতরের ইউনিক টপিকগুলো বের করা
  const topics = ['সব টপিক', ...Array.from(new Set(categoryFilteredData.map(item => item.topic || 'অন্যান্য').filter(Boolean)))];

  // ৩. এবার টপিক অনুযায়ী ফাইনাল ডেটা ফিল্টার
  const finalFilteredData = categoryFilteredData.filter(item => {
    if (activeTopic === 'সব টপিক') return true;
    return (item.topic || 'অন্যান্য') === activeTopic;
  });

  // ৪. ডেটাগুলোকে টপিক অনুযায়ী গ্রুপ করা
  const groupedData = finalFilteredData.reduce((acc, item) => {
    const topicName = item.topic || 'অন্যান্য';
    if (!acc[topicName]) acc[topicName] = [];
    acc[topicName].push(item);
    return acc;
  }, {});
  // 🚀 ৫. ম্যাজিক ট্রিক: FlatList-এর জন্য ডেটা রেডি করা (যাতে শুধু স্ক্রিনের ডেটা রেন্ডার হয়)
  const virtualizedData = [];
  Object.keys(groupedData).forEach((topicName) => {
    virtualizedData.push({ isTopicHeader: true, topicName }); // প্রথমে টপিকের নাম
    virtualizedData.push(...groupedData[topicName]); // এরপর ওই টপিকের প্রশ্নগুলো
  });

// 🚀 মডালের ভেতর লাইভ টপিক দেখানোর জন্য টেম্পোরারি ডেটা
  const tempCategoryFilteredData = extractedData.filter(item => {
    if (tempCategory === 'সব') return true;
    return item.type === tempCategory;
  });
  const tempTopics = ['সব টপিক', ...Array.from(new Set(tempCategoryFilteredData.map(item => item.topic || 'অন্যান্য').filter(Boolean)))];

  const handleTempCategoryChange = (cat) => {
    setTempCategory(cat);
    setTempTopic('সব টপিক'); 
    if (cat !== 'সৃজনশীল') setTempCqSubFilter('সব'); 
  };

  // 🚀 গ্লোবাল আই আইকনের স্মার্ট লজিক
  const handleGlobalReveal = () => {
    setIsRevealLoading(true); // ক্লিক করলেই সাথে সাথে বাটনে গ্লোয়িং লাইট জ্বলবে
    
    // JS থ্রেডকে একটু ফ্রি করে হেভি কাজটা ব্যাকগ্রাউন্ডে করবো
    setTimeout(() => {
      setGlobalReveal(!globalReveal); // LayoutAnimation বাদ দিয়েছি যাতে ১০০০ প্রশ্নে ফোন হ্যাং না করে
      setIsRevealLoading(false); // কাজ শেষ, লাইট অফ
    }, 50); 
  };

  // 🚀 ফিল্টার বাটনের স্মার্ট লজিক
  const handleFilterClick = () => {
    setIsFilterLoading(true); // ক্লিক করলেই ফিল্টার বাটনে লাইট জ্বলবে
    
    setTimeout(() => {
      setFilterModalVisible(true);
      setIsFilterLoading(false); // মোডাল ওপেন হওয়ার কমান্ড যাওয়ার পর লাইট অফ
    }, 50);
  };

 const applyFilters = () => {
    closeFilterModalSmoothly(); // প্রথমে স্মুথলি মডাল বন্ধ হবে
    
    // 🚀 ফিল্টার এপ্লাই করার সাথে সাথে শিমার ইফেক্ট চালু হবে!
    setIsContentReady(false); 
    
    Animated.timing(listOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveCategory(tempCategory);
      setCqSubFilter(tempCqSubFilter);
      setActiveTopic(tempTopic);
      setGlobalReveal(false);
      
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // 🚀 ৩৫০ মিলি-সেকেন্ড শিমার দেখানোর পর আসল প্রশ্নগুলো চলে আসবে
        setTimeout(() => {
          setIsContentReady(true);
        }, 350);
      });
    });
  };


 return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={closeWithAnimation}>
      <View className="flex-1">
        <Animated.View style={{ transform: [{ translateY: slideAnim }], height: SCREEN_HEIGHT }} className="bg-[#F2F6F9] flex-1 w-full overflow-hidden">
          
<View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-5 pb-3 bg-white border-b-2 border-[#E5E5E5] z-50">
            <View className="flex-row items-center justify-between w-full">
              
              {/* 🟢 Left Zone: Back Button & Focus Button (বামে ২টা বাটন) */}
              <View className="flex-row items-center space-x-2 flex-1">
                <TouchableOpacity onPress={closeWithAnimation} activeOpacity={0.8}>
                  <View className="bg-[#E5E5E5] rounded-[14px] pb-[4px]">
                    <View className="bg-white border-2 border-[#E5E5E5] border-b-0 w-[42px] h-[42px] rounded-[14px] items-center justify-center">
                      <FontAwesome5 name="arrow-left" size={16} color="#777777" />
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsReactionVisible(!isReactionVisible); }}>
                  <View className={`rounded-[14px] pb-[4px] ${!isReactionVisible ? 'bg-[#1073A4]' : 'bg-[#E5E5E5]'}`}>
                    <View className={`w-[42px] h-[42px] rounded-[14px] items-center justify-center border-2 border-b-0 ${!isReactionVisible ? 'bg-[#1CB0F6] border-[#1899D6]' : 'bg-white border-[#E5E5E5]'}`}>
                      <FontAwesome5 name={!isReactionVisible ? "moon" : "eye-slash"} size={16} color={!isReactionVisible ? "#FFFFFF" : "#777777"} solid={!isReactionVisible} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

            {/* 🟢 Center Zone: Live Presence Badge (Fixed Size Facepile) */}
              <View className="items-center justify-center -mt-1">
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => setMembersModalVisible(true)} 
                  className="flex-row items-center bg-white pl-1.5 pr-3 h-[44px] rounded-full border border-[#E5E5E5] shadow-sm max-w-[150px]"
                >
                  <View className="flex-row -space-x-3 mr-2">
                    {activeReaders.length > 0 ? (
                      <>
                        {activeReaders.slice(0, 2).map((reader, i) => (
                          <Image key={i} source={{ uri: reader.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-7 h-7 rounded-full border-2 border-white bg-[#EAE4D4]" style={{ zIndex: 3 - i }} />
                        ))}
                        {activeReaders.length > 2 && (
                          <View className="w-7 h-7 rounded-full border-2 border-white bg-[#F0F0F0] items-center justify-center" style={{ zIndex: 1 }}>
                            <Text className="text-[9px] text-[#4B4B4B]" style={{ fontFamily: 'BanglaBold' }}>
                              +{activeReaders.length - 2 > 99 ? '99' : activeReaders.length - 2}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <View className="w-7 h-7 rounded-full border-2 border-white bg-[#F0F0F0] items-center justify-center">
                        <FontAwesome5 name="user" size={10} color="#AFAFAF" />
                      </View>
                    )}
                  </View>
                  <View className="justify-center flex-shrink">
                    <Text className="text-[#3C3C3C] text-[12px] leading-[15px]" style={{ fontFamily: 'BanglaBold' }} numberOfLines={1}>
                      {activeReaders.length > 0 ? 'লাই' : 'একা'}
                    </Text>
                    <Text className="text-[#777777] text-[9px] leading-[12px]" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={1}>
                      পড়ছে
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 🟢 Right Zone: Tools (ডানে ২টা বাটন) */}
              <View className="flex-row space-x-2 flex-1 justify-end">
                <TouchableOpacity activeOpacity={0.8} onPress={handleGlobalReveal}>
                  <View className={`rounded-[14px] pb-[4px] ${globalReveal || isRevealLoading ? 'bg-[#1073A4]' : 'bg-[#E5E5E5]'}`}>
                    <View className={`w-[42px] h-[42px] rounded-[14px] items-center justify-center border-2 border-b-0 ${globalReveal || isRevealLoading ? 'bg-[#1CB0F6] border-[#1899D6]' : 'bg-white border-[#E5E5E5]'}`}>
                      {isRevealLoading ? <ActivityIndicator size="small" color={globalReveal ? "#FFFFFF" : "#1CB0F6"} /> : <FontAwesome5 name={globalReveal ? "eye-slash" : "eye"} size={16} color={globalReveal ? "#FFFFFF" : "#777777"} />}
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} onPress={handleFilterClick}>
                  <View className="bg-[#D47B00] rounded-[14px] pb-[4px]">
                    <View className="w-[42px] h-[42px] rounded-[14px] bg-[#FFC800] items-center justify-center border-2 border-[#FFC800] border-b-0">
                      {isFilterLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <FontAwesome5 name="filter" size={16} color="#FFFFFF" />}
                    </View>
                  </View>
                </TouchableOpacity>
           
              </View>
            </View>
          </View>

          <View className="flex-1 px-5 pt-2">
            <FlatList
              data={virtualizedData}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8} // 🚀 শুরুতে মাত্র ৮টি প্রশ্ন রেন্ডার হবে (সুপার ফাস্ট)
              maxToRenderPerBatch={10}
              windowSize={5} // 🚀 মেমোরি ক্লিন রাখার ট্রিক
              removeClippedSubviews={true} // 🚀 নতুন: এটা স্ক্রিনের বাইরের প্রশ্নগুলোকে পুরোপুরি ডিজেবল করে রাখবে, ফলে অ্যানিমেশন শুধু স্ক্রিনের ভেতরের ৫-৬ টাতেই কাজ করবে।
              ListEmptyComponent={
                !isContentReady ? (
                  <View className="pt-2">
                    <QuestionSkeleton />
                    <QuestionSkeleton />
                    <QuestionSkeleton />
                  </View>
                ) : (
                  <View className="items-center justify-center py-20">
                    <FontAwesome5 name="box-open" size={40} color="#D7D7D7" />
                    <Text className="text-[16px] text-[#AFAFAF] mt-4 pt-1" style={{ fontFamily: 'BanglaBold' }}>এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।</Text>
                  </View>
                )
              }
              renderItem={({ item }) => {
                // 🚀 যদি এটা টপিক হেডার হয়
                if (item.isTopicHeader) {
                  return (
                    <View className="mb-5 mt-2 flex-row items-center">
                      <View className="h-[2px] flex-1 bg-[#E5E5E5] rounded-full" />
                      <View className="bg-[#1899D6]/10 px-5 py-2 rounded-full border border-[#1899D6]/30 mx-3 flex-row items-center shadow-sm">
                        <FontAwesome5 name="hashtag" size={12} color="#1899D6" />
                        <Text className="text-[#1899D6] text-[15px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{item.topicName}</Text>
                      </View>
                      <View className="h-[2px] flex-1 bg-[#E5E5E5] rounded-full" />
                    </View>
                  );
                }

                // 🚀 যদি এটা আসল প্রশ্ন হয়
                if (item.type === 'mcq') return <MCQCard data={item} globalReveal={globalReveal} onOpenDiscussion={openContextualDiscussion} />;
                else if (item.type === 'সৃজনশীল') return <CQCard data={item} globalReveal={globalReveal} subFilter={activeCategory === 'সৃজনশীল' ? cqSubFilter : 'সব'} onOpenDiscussion={openContextualDiscussion} />;
                else return <ShortAnswerCard data={item} globalReveal={globalReveal} onOpenDiscussion={openContextualDiscussion} />;
              }}
            />
       </View>

     {/* 🚀 Live Reaction Bubble (Spotlight Zone) */}
          {liveReaction && (
            <Animated.View 
              style={{ opacity: reactionFadeAnim, transform: [{ translateY: reactionSlideAnim }] }}
              className="absolute bottom-[110px] right-5 flex-row items-end justify-end z-40"
            >
              <View className="bg-white/95 px-4 py-2.5 rounded-2xl rounded-br-sm border border-[#E5E5E5] shadow-sm mr-2 max-w-[200px]">
                <Text className={`${liveReaction.type === 'emoji' ? 'text-[24px]' : 'text-[13px] text-[#3D382F]'}`} style={{ fontFamily: liveReaction.type === 'message' ? 'BanglaBold' : undefined }}>
                  {liveReaction.content}
                </Text>
              </View>
              <Image source={{ uri: liveReaction.user.avatar }} className="w-9 h-9 rounded-full border-2 border-white shadow-sm bg-[#EAE4D4]" />
            </Animated.View>
          )}

          {/* 🚀 Quick Chat Popup Menu (Action Zone) */}
          {isReactionVisible && isQuickChatOpen && (
            <Animated.View 
              style={{ transform: [{ scale: quickChatScaleAnim }] }}
              className="absolute bottom-[100px] self-center z-50 flex-col items-center"
            >
              <View className="bg-white/95 p-3 rounded-[24px] border border-[#E5E5E5] shadow-lg flex-col space-y-2 mb-2 w-[240px]">
                <TouchableOpacity activeOpacity={0.7} onPress={() => triggerLiveReaction('আজকে পুরা কাপাই দিবো! 🔥', 'message')} className="bg-[#FFF4E5] px-4 py-2.5 rounded-full border border-[#FFDDAA] items-center">
                  <Text className="text-[#D47B00] text-[13px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আজকে পুরা কাপাই দিবো! 🔥</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => triggerLiveReaction('আমার লাইফটাই লস 😢', 'message')} className="bg-[#F2F6F9] px-4 py-2.5 rounded-full border border-[#D7D7D7] items-center">
                  <Text className="text-[#4B4B4B] text-[13px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আমার লাইফটাই লস 😢</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => triggerLiveReaction('লাইফটা প্যারাময় 🥴', 'message')} className="bg-[#FDF6E3] px-4 py-2.5 rounded-full border border-[#EFE8D6] items-center">
                  <Text className="text-[#827B6E] text-[13px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>লাইফটা প্যারাময় 🥴</Text>
                </TouchableOpacity>
                
                {/* 🚀 Custom Message Input Box */}
                <View className="flex-row items-center bg-[#F9F9F9] rounded-full border border-[#E5E5E5] pr-1 pl-3 mt-1">
                  <TextInput
                    className="flex-1 text-[13px] text-[#3C3C3C] h-[36px] pt-1"
                    style={{ fontFamily: 'BanglaRegular' }}
                    placeholder="নিজের মেসেজ লিখুন..."
                    placeholderTextColor="#AFAFAF"
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    onSubmitEditing={() => {
                      if(customMessage.trim()){
                        triggerLiveReaction(customMessage.trim(), 'message');
                        setCustomMessage('');
                      }
                    }}
                  />
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => {
                      if(customMessage.trim()){
                        triggerLiveReaction(customMessage.trim(), 'message');
                        setCustomMessage('');
                      }
                    }}
                    className="w-7 h-7 bg-[#1CB0F6] rounded-full items-center justify-center ml-1"
                  >
                    <FontAwesome5 name="paper-plane" size={10} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Arrow pointing to button */}
              <View className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white ml-[110px]" />
            </Animated.View>
          )}

          {/* 🚀 Dynamic Social Dock (Duolingo 3D Style) */}
          {isReactionVisible && (
            <View className="absolute bottom-8 self-center bg-white/95 px-3 py-2.5 rounded-[24px] border-2 border-[#E5E5E5] border-b-[6px] border-b-[#CECECE] flex-row items-center justify-between w-[85%] max-w-[340px] z-30">
              
              {/* Left Zone: Live Status (Spotlight Mini) */}
              <View className="flex-row items-center pl-2">
                <View className="w-2 h-2 bg-[#58CC02] rounded-full mr-2" />
                <Text className="text-[#777777] text-[11px] pt-1" style={{ fontFamily: 'BanglaBold' }}>লাইভ চ্যাট অন</Text>
              </View>

             {/* Right Zone: Action Buttons */}
              <View className="flex-row items-center space-x-2">
                {/* Emojis */}
                <TouchableOpacity activeOpacity={0.8} disabled={isReactionCooldown} onPress={() => triggerLiveReaction('👍')} className={`w-[36px] ${isReactionCooldown ? 'opacity-50' : 'opacity-100'}`}>
                  <View className="bg-[#E5E5E5] rounded-[12px] pb-[4px]">
                    <View className="bg-white rounded-[12px] w-full h-[32px] items-center justify-center border-2 border-[#E5E5E5] border-b-0">
                      <Text className="text-[16px]">👍</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} disabled={isReactionCooldown} onPress={() => triggerLiveReaction('🔥')} className={`w-[36px] ${isReactionCooldown ? 'opacity-50' : 'opacity-100'}`}>
                  <View className="bg-[#E5E5E5] rounded-[12px] pb-[4px]">
                    <View className="bg-white rounded-[12px] w-full h-[32px] items-center justify-center border-2 border-[#E5E5E5] border-b-0">
                      <Text className="text-[16px]">🔥</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View className="w-[2px] h-6 bg-[#E5E5E5] mx-1 rounded-full" />
                
                {/* Quick Chat Button */}
                <TouchableOpacity activeOpacity={0.8} disabled={isReactionCooldown} onPress={toggleQuickChat} className={`min-w-[90px] ${isReactionCooldown ? 'opacity-50' : 'opacity-100'}`}>
                  <View className="bg-[#D47B00] rounded-[12px] pb-[4px]">
                    <View className="bg-[#FFC800] rounded-[12px] px-3 h-[32px] flex-row items-center justify-center border-2 border-[#FFC800] border-b-0">
                      <FontAwesome5 name="comment-dots" size={12} color="#FFFFFF" solid />
                      <Text className="text-white text-[11px] ml-1.5 pt-1" style={{ fontFamily: 'BanglaBold' }}>কুইক চ্যাট</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* <Discussion /> কম্পোনেন্টের ঠিক নিচে এই কোডটুকু বসান */}

{/* 🚀 Bouncy Filter Modal */}
      <Modal visible={isFilterModalVisible} transparent animationType="none" onRequestClose={closeFilterModalSmoothly}>
        <View className="flex-1 justify-end">
          <Animated.View style={{ opacity: filterFadeAnim }} className="absolute inset-0 bg-black/60" />
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={closeFilterModalSmoothly} />
          
          <Animated.View 
            style={{ transform: [{ translateY: filterSlideAnim }] }}
            className="bg-white rounded-t-[32px] p-6 pt-5 w-full max-h-[80%]"
          >
            <View className="w-12 h-1.5 bg-[#E5E5E5] rounded-full self-center mb-5" />
            <View className="flex-row justify-between items-center mb-4 border-b border-[#E5E5E5] pb-3">
              <Text className="text-[18px] text-[#3C3C3C]" style={{ fontFamily: 'BanglaBold' }}>ফিল্টার করুন</Text>
              <TouchableOpacity onPress={closeFilterModalSmoothly} className="bg-[#F0F0F0] w-8 h-8 rounded-full items-center justify-center">
                <FontAwesome5 name="times" size={14} color="#777777" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-[14px] text-[#7B92A5] mb-3 pt-1">প্রশ্নের ধরন</Text>
              <View className="flex-row flex-wrap gap-3 mb-6">
                {categories.map((cat, index) => {
                  const isActive = tempCategory === cat; 
                  return (
                    <TouchableOpacity activeOpacity={0.8} key={index} onPress={() => handleTempCategoryChange(cat)}>
                      <View className={`pb-[3px] rounded-xl ${isActive ? 'bg-[#1899D6]' : 'bg-[#E5E5E5]'}`}>
                        <View className={`flex-row items-center px-5 py-2.5 rounded-xl border ${isActive ? 'bg-[#1CB0F6] border-[#1CB0F6]' : 'bg-white border-[#E5E5E5]'}`}>
                          <Text style={{ fontFamily: 'BanglaBold' }} className={`text-[15px] pt-1 ${isActive ? 'text-white' : 'text-[#777777]'}`}>
                            {cat === 'mcq' ? 'এমসিকিউ' : (cat === 'সব' ? 'সব প্রশ্ন' : cat)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {tempCategory === 'সৃজনশীল' && ( 
                <View className="mb-6">
                  <Text style={{ fontFamily: 'BanglaBold' }} className="text-[14px] text-[#7B92A5] mb-3 pt-1">সৃজনশীল অংশ</Text>
                  <View className="flex-row flex-wrap gap-2.5">
                    {['সব', 'ক', 'খ', 'গ ও ঘ'].map((sub, index) => {
                      const isSubActive = tempCqSubFilter === sub; 
                      return (
                        <TouchableOpacity activeOpacity={0.8} key={index} onPress={() => setTempCqSubFilter(sub)}>
                          <View className={`px-4 py-2.5 rounded-full border ${isSubActive ? 'bg-[#FF9600] border-[#FF9600]' : 'bg-[#FFF4E5] border-[#FFDDAA]'}`}>
                            <Text style={{ fontFamily: 'BanglaBold' }} className={`text-[13px] pt-0.5 ${isSubActive ? 'text-white' : 'text-[#D47B00]'}`}>
                              {sub === 'সব' ? 'সম্পূর্ণ' : (sub === 'গ ও ঘ' ? 'উদ্দীপক + গ, ঘ' : `শুধু ${sub}`)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {tempTopics.length > 1 && ( 
                <View className="mb-4">
                  <Text style={{ fontFamily: 'BanglaBold' }} className="text-[14px] text-[#7B92A5] mb-3 pt-1">টপিক অনুযায়ী</Text>
                  <View className="flex-row flex-wrap gap-2.5">
                    {tempTopics.map((topic, index) => { 
                      const isActive = tempTopic === topic; 
                      return (
                        <TouchableOpacity key={index} onPress={() => setTempTopic(topic)} className={`px-4 py-2.5 rounded-full border ${isActive ? 'bg-[#1899D6] border-[#1899D6]' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}>
                          <Text style={{ fontFamily: 'BanglaBold' }} className={`text-[13px] pt-0.5 ${isActive ? 'text-white' : 'text-[#777777]'}`}>{topic}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity className="bg-[#1CB0F6] py-3.5 rounded-[16px] mt-2 items-center shadow-sm" onPress={applyFilters}>
              <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-[16px] pt-1">এপ্লাই করুন</Text>
            </TouchableOpacity>
            
          </Animated.View>
        </View>
      </Modal>


    {/* 🚀 Members & Invite Modal */}
      <Modal visible={membersModalVisible} transparent animationType="slide" onRequestClose={() => setMembersModalVisible(false)} onShow={fetchCommunityMembers}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setMembersModalVisible(false)} />
          <View className="bg-white w-full h-[75%] rounded-t-[32px] overflow-hidden flex-col p-5">
            <View className="w-12 h-1.5 bg-[#E5E5E5] rounded-full self-center mb-4" />
            <Text className="text-[18px] text-[#3C3C3C] mb-4 text-center" style={{ fontFamily: 'BanglaBold' }}>কমিউনিটি মেম্বারস</Text>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F9F9F9] rounded-[16px] border border-[#E5E5E5] px-4 py-2 mb-4">
              <FontAwesome5 name="search" size={14} color="#AFAFAF" />
              <TextInput
                className="flex-1 ml-3 text-[15px] text-[#3C3C3C] h-[36px] pt-1"
                style={{ fontFamily: 'BanglaRegular' }}
                placeholder="মেম্বার খুঁজুন..."
                placeholderTextColor="#AFAFAF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Member List */}
            <FlatList
              data={communityMembersList.filter(m => m.userName?.toLowerCase().includes(searchQuery.toLowerCase()))}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between py-3 border-b border-[#F5F5F5]">
                  <View className="flex-row items-center">
                    <Image source={{ uri: item.userAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} className="w-10 h-10 rounded-full bg-[#EAE4D4] mr-3 border border-[#E5E5E5]" />
                    <View>
                      <Text className="text-[15px] text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>{item.userName}</Text>
                      <Text className="text-[12px] text-[#777777]" style={{ fontFamily: 'BanglaRegular' }}>মেম্বার</Text>
                    </View>
                  </View>
                  <View className="flex-row space-x-2">
                    {/* Add Friend Placeholder (আপাতত ফাংশন ছাড়া শুধু বাটন) */}
                    <TouchableOpacity activeOpacity={0.7} className="bg-[#F0F0F0] px-3 py-1.5 rounded-full items-center justify-center border border-[#E5E5E5]">
                      <FontAwesome5 name="user-plus" size={12} color="#777777" />
                    </TouchableOpacity>
                    
                    {/* Invite Button */}
                    <TouchableOpacity 
                      activeOpacity={0.7} 
                      onPress={() => handleSendInvite(item.userEmail)}
                      className={`px-4 py-1.5 rounded-full items-center justify-center ${invitedUsers.includes(item.userEmail) ? 'bg-[#D7FFB8] border border-[#58CC02]' : 'bg-[#1899D6] border border-[#1899D6]'}`}
                    >
                      <Text className={`text-[12px] pt-1 ${invitedUsers.includes(item.userEmail) ? 'text-[#58A700]' : 'text-white'}`} style={{ fontFamily: 'BanglaBold' }}>
                        {invitedUsers.includes(item.userEmail) ? 'ডাকানো হয়েছে' : 'ডাকুন'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-10">
                  <Text className="text-[#AFAFAF] text-[14px]" style={{ fontFamily: 'BanglaBold' }}>কোনো মেম্বার পাওয়া যায়নি</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* 🚀 Global Community Chat inside Reading Engine */}
      <Discussion
        visible={discussionVisible} 
        onClose={() => setDiscussionVisible(false)} 
        data={activeDiscussionData} 
        guideName={guideData?.creatorName}
      guideId={guideData?.channelId || 'default_channel'}
      />
    </Modal>

    
  );
}