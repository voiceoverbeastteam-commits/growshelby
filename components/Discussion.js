import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, FlatList, Image, TextInput, Animated, Dimensions, Clipboard } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';

const screenHeight = Dimensions.get('window').height;

const getShortName = (fullName) => {
  if (!fullName) return 'ইউজার';
  return fullName.trim().split(' ')[0];
};

// 🚀 Microsoft Fluent 3D Emoji (100% Stable CDN Links)
const Emoji3D = {
  '👍': 'https://em-content.zobj.net/source/microsoft-teams/337/thumbs-up_1f44d.png',
  '❤️': 'https://em-content.zobj.net/source/microsoft-teams/337/red-heart_2764-fe0f.png',
  '😂': 'https://em-content.zobj.net/source/microsoft-teams/337/face-with-tears-of-joy_1f602.png',
  '😲': 'https://em-content.zobj.net/source/microsoft-teams/337/astonished-face_1f632.png',
  '😢': 'https://em-content.zobj.net/source/microsoft-teams/337/crying-face_1f622.png',
};

const ChatSkeleton = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="flex-1 px-4 pt-6">
      <View className="mb-6 flex-row justify-start">
        <View className="w-8 h-8 rounded-full bg-[#EAE4D4] mr-2 self-end mb-2" />
        <View className="max-w-[75%] items-start">
          <View className="w-20 h-3 bg-[#EAE4D4] rounded-full mb-2 ml-1" />
          <View className="w-48 h-16 bg-[#FFFDF8] border-2 border-b-[5px] border-[#EFE8D6] rounded-2xl rounded-bl-sm" />
        </View>
      </View>
      <View className="mb-6 flex-row justify-end mt-2">
        <View className="max-w-[75%] items-end">
          <View className="w-40 h-12 bg-[#D7FFB8] border-2 border-b-[5px] border-[#8BA85E] opacity-40 rounded-2xl rounded-br-sm" />
        </View>
        <View className="w-8 h-8 rounded-full bg-[#EAE4D4] ml-2 self-end mb-2" />
      </View>
    </Animated.View>
  );
};

const TypingIndicator = ({ userName }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -5, duration: 300, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true })
        ])
      ).start();
    };
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  return (
    <View className="flex-row items-center px-4 py-2 mb-2 self-start bg-[#FDF6E3] rounded-2xl rounded-bl-sm border border-[#EFE8D6] ml-2">
      <Text className="text-[#827B6E] text-[12px] italic mr-2" style={{ fontFamily: 'BanglaBold' }}>{getShortName(userName)} টাইপ করছে</Text>
      <View className="flex-row space-x-1">
        <Animated.View style={{ transform: [{ translateY: dot1 }] }} className="w-1.5 h-1.5 bg-[#D47B00] rounded-full" />
        <Animated.View style={{ transform: [{ translateY: dot2 }] }} className="w-1.5 h-1.5 bg-[#D47B00] rounded-full" />
        <Animated.View style={{ transform: [{ translateY: dot3 }] }} className="w-1.5 h-1.5 bg-[#D47B00] rounded-full" />
      </View>
    </View>
  );
};

export default function Discussion({ visible, onClose, data, guideName, guideId = 'default_guide' }) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [joinedToast, setJoinedToast] = useState(false);
  const scrollViewRef = useRef();

  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skipAmount, setSkipAmount] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isCacheChecked, setIsCacheChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'শিক্ষার্থী', avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', email: 'guest' });

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isActionSheetVisible, setActionSheetVisible] = useState(false);
  
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  
  const fetchInitialMessages = async (userEmail) => {
    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
       body: JSON.stringify({ action: 'get_community_messages', guideId, userEmail, contextQuestion: data ? data.question : null })
      });
      const result = await response.json();
      if (result.success && result.messages) {
        // FlatList এর জন্য ডেটা উল্টে দেওয়া হলো (reverse)
     const formattedMessages = result.messages.map(msg => ({
         ...msg,
         reactions: msg.reactions || (msg.likes && msg.likes.length > 0 ? { '👍': msg.likes } : {})
       })).reverse();

        setComments(formattedMessages);
        
       // 🚀 স্মার্ট ক্যাশ: কোশ্চেন অনুযায়ী আলাদা আলাদা ক্যাশ সেভ হবে!
        const cacheLimit = formattedMessages.slice(0, 40);
        const safeQuestionText = data && data.question ? encodeURIComponent(data.question).substring(0, 60) : 'general';
       const smartCacheKey = `@chat_cache_${guideId}_${safeQuestionText}`;
       
       await AsyncStorage.setItem(smartCacheKey, JSON.stringify(cacheLimit));
      }
  } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // 🚀 ম্যাজিক: মেসেজ স্ক্রল করলে পুরনো মেসেজ আনার ফাংশন
    const loadMoreMessages = async () => {
      if (isFetchingMore || !hasMoreMessages || comments.length === 0) return;
      
      setIsFetchingMore(true);
      try {
        const newSkip = skipAmount + 40;
        const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
         body: JSON.stringify({ action: 'get_community_messages', guideId, userEmail: currentUser.email, skip: newSkip, contextQuestion: data ? data.question : null })
        });
        
        const result = await response.json();
        if (result.success && result.messages) {
          if (result.messages.length < 40) {
            setHasMoreMessages(false); // আর কোনো পুরনো মেসেজ নেই
          }
          
    const formattedMessages = result.messages.map(msg => ({
         ...msg,
         reactions: msg.reactions || (msg.likes && msg.likes.length > 0 ? { '👍': msg.likes } : {})
       })).reverse();
       
       // 🚀 পুরনো মেসেজগুলো লিস্টের নিচে যোগ হবে 
       setComments(prev => [...prev, ...formattedMessages]);
          setSkipAmount(newSkip);
        }
      } catch (error) {
        console.error("Load more error:", error);
      } finally {
        setIsFetchingMore(false);
      }
    };
    // 🚀 ম্যাজিক শেষ

    useEffect(() => {
    let pusher;
    let channel;
    
    if (visible) {
      // 🚀 ম্যাজিক ফিক্স: ওপেন হওয়ার সাথে সাথেই পুরনো সব মেসেজ ক্লিয়ার করে দিচ্ছি!
      setComments([]);
      setIsLoading(true);
      setIsCacheChecked(false);
    
      
      pusher = new Pusher('94415a0ec2e09647c277', { cluster: 'mt1' });
      channel = pusher.subscribe(`chat_${guideId}`);

      const initializeChat = async () => {
        try {
          // ১. আগে ইউজার আইডি লোড করছি (যাতে মেসেজ ডানে-বামে লাফ না দেয়)
          const uid = await AsyncStorage.getItem('@current_user_id') || 'guest_' + Date.now();
          const name = await AsyncStorage.getItem(`@user_name_${uid}`) || await AsyncStorage.getItem('@user_name') || 'শিক্ষার্থী';
          const avatar = await AsyncStorage.getItem(`@user_avatar_${uid}`) || await AsyncStorage.getItem('@user_avatar') || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
          setCurrentUser({ email: uid, name, avatar });

          // ২. 🚀 স্মার্ট ক্যাশ রিড করা (আলাদা আলাদা ক্যাশ থেকে)
          const safeQuestionText = data && data.question ? data.question.substring(0, 15) : 'general';
          const smartCacheKey = `@chat_cache_${guideId}_${safeQuestionText}`;
          
          const cachedData = await AsyncStorage.getItem(smartCacheKey);
          if (cachedData) {
            setComments(JSON.parse(cachedData));
            setIsLoading(false);
          }
          setIsCacheChecked(true); // ক্যাশ লোড শেষ, এবার স্ক্রিন দেখাবে

          channel.bind('new_message', (newMessage) => {
            setComments(prev => {
              // 🚀 স্মার্ট ফিল্টার: যদি আমরা কোনো স্পেসিফিক কোশ্চেনে থাকি আর আসা মেসেজটা অন্য কোশ্চেনের বা নরমাল চ্যাটের হয়, তাহলে ইগনোর করব!
              if (data && newMessage.contextQuestion !== data.question) return prev;

              if (prev.some(msg => msg.messageId === newMessage.messageId)) return prev;
              const formattedMsg = { ...newMessage, reactions: newMessage.reactions || {} };
              return [formattedMsg, ...prev]; 
            });
          });

      // ২. 🚀 রিয়্যাকশন আপডেট রিসিভার
      channel.bind('message_updated', (data) => {
        if (data.messageId && data.reactions) {
          setComments(prevComments => 
            prevComments.map(msg => 
              (msg.messageId || msg.id) === data.messageId 
                ? { ...msg, reactions: data.reactions } 
                : msg
            )
          );
        }
      });

      channel.bind('delete_message', (deletedData) => {
        setComments(prev => prev.filter(msg => msg.messageId !== deletedData.messageId));
      });
      
          channel.bind('typing', (data) => {
            if (data.userEmail !== uid) {
              setTypingUser(data.userName);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
          });

    

          // এরপর ব্যাকগ্রাউন্ডে API কল করে নতুন মেসেজ আনা (এখানে await মুছে দিয়েছি যাতে স্ক্রিন আটকে না থাকে)
          fetchInitialMessages(uid).finally(() => setIsLoading(false));

          const joinedKey = `@joined_group_${guideId}`;
          const hasJoined = await AsyncStorage.getItem(joinedKey);
          if (!hasJoined) {
            setJoinedToast(true);
            await AsyncStorage.setItem(joinedKey, 'true');
            setTimeout(() => setJoinedToast(false), 3000);
          }

       } catch (error) {
          console.error("Chat Error:", error);
        }
      };

      initializeChat();

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true })
      ]).start();
    }

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusher) pusher.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    };
  }, [visible]);

  const handleCloseSmoothly = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true })
    ]).start(() => onClose());
  };

  const handleTyping = (text) => {
    setInputText(text);
    
    if (text.trim().length > 0) {
      if (typingDebounceRef.current) return;

      fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'trigger_typing', guideId, userEmail: currentUser.email, userName: currentUser.name })
      }).catch(() => {});

      typingDebounceRef.current = setTimeout(() => {
        typingDebounceRef.current = null;
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    const textToSend = inputText.trim();
    setInputText('');
    
    const tempMessageId = `msg_${Date.now()}`;
    const newMessage = {
      messageId: tempMessageId,
      guideId,
      userEmail: currentUser.email,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isAuthor: false, 
      text: textToSend,
      isContextual: data ? true : false,
      contextQuestion: data ? data.question : null,
      reactions: {}, 
      timestamp: new Date().toISOString()
    };

    setComments(prev => [newMessage, ...prev]); // FlatList inverted এর জন্য নতুন মেসেজ শুরুতে

try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'send_community_message', ...newMessage })
      });

      // 🚀 Push Notification টেস্টিং বট (৫ সেকেন্ড পর রিপ্লাই দিবে)
      setTimeout(() => {
        const botMessage = {
          messageId: `bot_${Date.now()}`,
          guideId,
          userEmail: 'testbot@growshelby.com',
          userName: 'নোটিফিকেশন বট 🤖',
          userAvatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712010.png',
          isAuthor: false, 
          text: `হ্যালো! এটি একটি টেস্ট পুশ নোটিফিকেশন! 🚀`,
          isContextual: false,
          contextQuestion: null,
          reactions: {}, 
          timestamp: new Date().toISOString()
        };
        
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'send_community_message', ...botMessage })
        }).catch(() => {});
      }, 5000); // ⏱️ ৫ সেকেন্ড সময় দেওয়া হলো

    } catch (error) {}
  };


  // 🚀 পারফেক্ট রিয়েকশন হ্যান্ডলার (টাইমিং বাগ ফিক্সড)
  const handleReaction = async (emojiType) => {
    if (!selectedMessage) return;
    
    const msgId = selectedMessage.messageId || selectedMessage.id || selectedMessage._id;
    setActionSheetVisible(false);

    // ১. আগে টার্গেট মেসেজটা খুঁজে বের করে রিয়েকশন ক্যালকুলেট করছি (setComments এর বাইরে)
    const targetMessage = comments.find(msg => (msg.messageId || msg.id || msg._id) === msgId);
    if (!targetMessage) return;

    let newReactions = JSON.parse(JSON.stringify(targetMessage.reactions || {}));
    const hasReactedWithThisEmoji = newReactions[emojiType]?.includes(currentUser.email);
    
    // ইউজারের আগের সব রিয়েকশন মুছে ফেলছি
    Object.keys(newReactions).forEach(key => {
      newReactions[key] = newReactions[key].filter(email => email !== currentUser.email);
    });

    // নতুন রিয়েকশন অ্যাড বা রিমুভ করছি
    if (!hasReactedWithThisEmoji) {
      if (!newReactions[emojiType]) newReactions[emojiType] = [];
      newReactions[emojiType].push(currentUser.email);
    }
    
    // ফাঁকাগুলো ক্লিন করছি
    Object.keys(newReactions).forEach(key => {
      if (newReactions[key].length === 0) delete newReactions[key];
    });

    const finalReactions = newReactions; // 🚀 এইটাই হলো আমাদের পারফেক্ট ডেটা!

    // ২. এবার ফ্রন্টএন্ডে রিয়েকশন দেখাচ্ছি
    setComments(prev => prev.map(msg => {
      if ((msg.messageId || msg.id || msg._id) === msgId) {
        return { ...msg, reactions: finalReactions };
      }
      return msg;
    }));

    // ৩. এবং সার্ভারে পারফেক্ট ডেটা পাঠাচ্ছি (এখন আর ফাঁকা যাবে না)
    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ 
          action: 'toggle_message_reaction', 
          messageId: msgId, 
          guideId, 
          reactions: finalReactions 
        })
      });
    } catch (error) {
      console.error("Reaction update failed:", error);
    }
  };

  const handleDeleteMessage = async (deleteType) => {
    if (!selectedMessage) return;
    const msgId = selectedMessage.messageId;
    setComments(prev => prev.filter(msg => msg.messageId !== msgId));
    setActionSheetVisible(false);

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'delete_community_message', messageId: msgId, userEmail: currentUser.email, deleteType, guideId })
      });
    } catch (error) {}
  };

  const handleCopyText = () => {
    if (selectedMessage) {
      Clipboard.setString(selectedMessage.text);
      setActionSheetVisible(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'এইমাত্র';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (!visible && slideAnim._value === screenHeight) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleCloseSmoothly}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Animated.View style={{ opacity: fadeAnim }} className="absolute inset-0 bg-black/50" />
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleCloseSmoothly} />
        
        <Animated.View style={{ transform: [{ translateY: slideAnim }], paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 20 }} className="bg-[#FDF6E3] w-full h-[85%] rounded-t-[32px] overflow-hidden flex-col">
          <View className="w-12 h-1.5 bg-[#D7D7D7] rounded-full self-center mt-3 mb-1" />

          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-[#EFE8D6]">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-[#1899D6]/10 rounded-full items-center justify-center mr-3 border border-[#1899D6]/30">
                <FontAwesome5 name="users" size={14} color="#1899D6" />
              </View>
              <View>
                <Text className="text-[#3D382F] text-[17px] pt-1" style={{ fontFamily: 'BanglaBold' }}>স্টাডি স্কোয়াড</Text>
                <Text className="text-[#827B6E] text-[12px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>লাইভ চ্যাট অন</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCloseSmoothly} className="p-2 bg-[#EAE4D4] rounded-full w-9 h-9 items-center justify-center">
              <FontAwesome5 name="times" size={14} color="#6B655B" />
            </TouchableOpacity>
          </View>

          {data && (
            <View className="bg-[#FFFDF8] px-4 py-3 border-b border-[#EFE8D6] flex-row items-center shadow-sm z-10">
              <View className="w-1 h-full bg-[#D47B00] rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-[#D47B00] text-[12px] mb-1" style={{ fontFamily: 'BanglaBold' }}>আলোচনার বিষয়:</Text>
                <Text className="text-[#3D382F] text-[14px] leading-6" style={{ fontFamily: 'BanglaBold' }} numberOfLines={2}>{data.question}</Text>
              </View>
            </View>
          )}

          {joinedToast && (
            <View className="absolute top-20 self-center bg-black/70 px-4 py-2 rounded-full z-50 flex-row items-center">
              <Text className="text-white text-[12px] pt-0.5" style={{ fontFamily: 'BanglaBold' }}>আপনি এই গ্রুপের সাথে যুক্ত হয়েছেন 🎉</Text>
            </View>
          )}

         {!isCacheChecked ? (
            <View className="flex-1" /> /* 🚀 ক্যাশ চেকের ১০ মিলিসেকেন্ড সময়টুকুতে স্ক্রিন একদম ব্ল্যাংক থাকবে, কোনো ফ্ল্যাশ হবে না */
          ) : isLoading && comments.length === 0 ? (
            <ChatSkeleton />
          ) : comments.length === 0 ? (

            <View className="flex-1 items-center justify-center px-8">
              <View className="w-24 h-24 bg-[#EAE4D4] rounded-full items-center justify-center mb-5 border-4 border-[#EFE8D6]">
                <FontAwesome5 name="comments" size={36} color="#D47B00" solid />
              </View>
              <Text className="text-[20px] text-[#3D382F] text-center mb-2" style={{ fontFamily: 'BanglaBold' }}>আলোচনা শুরু করুন!</Text>
              <Text className="text-[14px] text-[#827B6E] text-center leading-6" style={{ fontFamily: 'BanglaRegular' }}>
                এখানে এখনো কেউ কোনো মেসেজ দেয়নি। তুমিই প্রথম মেসেজ দিয়ে বন্ধুদের সাথে আলোচনা শুরু করো।
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.messageId || item.id}
              inverted={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20, paddingTop: 10 }}
            ListHeaderComponent={typingUser ? <TypingIndicator userName={typingUser}/> : null}
              
              // 🚀 Magic: User uporer dike scroll korlei function call hobe
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.5}
              ListFooterComponent={isFetchingMore ? <Text className="text-[#AFAFAF] text-[12px] py-4 text-center" style={{fontFamily: 'BanglaRegular'}}>আরও মেসেজ লোড হচ্ছে...</Text> : null}
              
              renderItem={({ item }) => {
                const isMe = item.userEmail === currentUser.email;
                const reactions = item.reactions || {};
                const hasReactions = Object.keys(reactions).length > 0;
                
                return (
                  <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <View className="mr-2 justify-end pb-5">
                         <View className="w-8 h-8 rounded-full border border-[#EFE8D6] overflow-hidden">
                           <Image source={{ uri: item.userAvatar || 'https://i.pravatar.cc/150' }} className="w-full h-full" />
                         </View>
                      </View>
                    )}

                    <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <View className="flex-row items-center mb-1 ml-1">
                          <Text className={`text-[12px] ${item.isAuthor ? 'text-[#D47B00]' : 'text-[#827B6E]'}`} style={{ fontFamily: 'BanglaBold' }}>
                            {getShortName(item.userName || item.user)}
                          </Text>
                          {item.isAuthor && (
                            <View className="bg-[#FFF4E5] px-1.5 py-0.5 rounded ml-2 border border-[#FFDDAA]">
                              <Text className="text-[#D47B00] text-[9px]" style={{ fontFamily: 'BanglaBold' }}>অথর</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onLongPress={() => { setSelectedMessage(item); setActionSheetVisible(true); }}
                        delayLongPress={250}
                        className={`p-3.5 rounded-2xl border-2 border-b-[5px] ${isMe ? 'bg-[#D7FFB8] border-[#8BA85E] rounded-br-sm' : 'bg-[#FFFDF8] border-[#EFE8D6] rounded-bl-sm'} relative`}
                      >
                        {item.isContextual && item.contextQuestion && (
                          <View className={`mb-2 pb-2 border-b pl-2 ${isMe ? 'border-[#C1D99A]' : 'border-[#EFE8D6]'}`}>
                            <View className={`absolute left-0 top-0 bottom-2 w-0.5 rounded-full ${isMe ? 'bg-[#8BA85E]' : 'bg-[#D47B00]'}`} />
                            <Text className={`text-[11px] ${isMe ? 'text-[#6A8A3A]' : 'text-[#D47B00]'}`} style={{ fontFamily: 'BanglaBold' }}>রিপ্লাই: প্রশ্ন</Text>
                            <Text className={`text-[13px] leading-5 ${isMe ? 'text-[#4A632D]' : 'text-[#5C5549]'}`} style={{ fontFamily: 'BanglaRegular' }} numberOfLines={2}>
                              {item.contextQuestion}
                            </Text>
                          </View>
                        )}
                        <Text className={`text-[15px] leading-6 ${isMe ? 'text-[#4A632D]' : 'text-[#3D382F]'}`} style={{ fontFamily: 'BanglaRegular' }}>{item.text}</Text>
                        
{hasReactions && (
                          <View className={`absolute -bottom-3.5 flex-row flex-wrap items-center ${isMe ? 'right-3' : 'left-3'} z-10`} style={{ overflow: 'visible', gap: 4 }}>
                            {Object.entries(reactions).map(([emoji, users]) => (
                              users.length > 0 && (
                                <View key={emoji} className="flex-row items-center bg-white px-2 py-1 rounded-full border border-[#EFE8D6] shadow-sm" style={{ overflow: 'visible', minHeight: 22 }}>
                                  <Image source={{ uri: Emoji3D[emoji] }} className="w-5 h-5" resizeMode="contain" style={{ marginRight: users.length > 1 ? 3 : 0 }} />
                                  {users.length > 1 && (
                                    <Text className="text-[11px] text-[#5C564B] font-bold" style={{ fontFamily: 'BanglaBold', lineHeight: 14 }}>
                                      {users.length}
                                    </Text>
                                  )}
                                </View>
                              )
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>

                      <View className={`flex-row items-center space-x-3 px-1 ${hasReactions ? 'mt-3' : 'mt-1'}`}>
                        <Text className="text-[#AFAFAF] text-[11px]" style={{ fontFamily: 'BanglaRegular' }}>{formatTime(item.timestamp)}</Text>
                      </View>
                    </View>

                  {isMe && (
                      <View className="ml-2 justify-end pb-5">
                         <View className="w-8 h-8 rounded-full border border-[#8BA85E] overflow-hidden">
                           <Image source={{ uri: currentUser.avatar }} className="w-full h-full" />
                         </View>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          )}

          <View className="px-4 py-3 border-t-2 border-[#EFE8D6] bg-[#FDF6E3] flex-row items-end">
            <View className="flex-1 bg-[#FFFDF8] border-2 border-b-[4px] border-[#EFE8D6] rounded-2xl px-4 py-2 min-h-[48px] max-h-[120px] justify-center mr-3">
              <TextInput
                className="text-[#3D382F] text-[15px] pt-1"
                style={{ fontFamily: 'BanglaRegular' }}
                placeholder={data ? "এই প্রশ্নের উত্তর লিখুন..." : "কমিউনিটিতে মেসেজ দিন..."}
                placeholderTextColor="#AFAFAF"
                multiline
                value={inputText}
                onChangeText={handleTyping}
              />
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={handleSend} disabled={inputText.trim() === ''}>
              <View className={`rounded-full pb-[4px] ${inputText.trim() === '' ? 'bg-[#D7D7D7]' : 'bg-[#1073A4]'}`}>
                <View className={`w-12 h-12 rounded-full items-center justify-center border-2 ${inputText.trim() === '' ? 'bg-[#EAE4D4] border-[#EAE4D4]' : 'bg-[#1899D6] border-[#1899D6]'}`}>
                  <FontAwesome5 name="paper-plane" size={16} color={inputText.trim() === '' ? '#827B6E' : '#FFFFFF'} solid />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      <Modal visible={isActionSheetVisible} transparent animationType="fade" onRequestClose={() => setActionSheetVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setActionSheetVisible(false)} />
          <View className="bg-[#FFFDF8] rounded-t-[32px] p-6 pb-10 border-t-4 border-[#EFE8D6]">
            
          <View className="flex-row justify-around bg-white p-3.5 rounded-[24px] border border-[#EFE8D6] mb-6 shadow-md" style={{ overflow: 'visible' }}>
              {['👍', '❤️', '😂', '😲', '😢'].map((emoji, index) => (
                <TouchableOpacity key={index} onPress={() => handleReaction(emoji)} className="bg-[#FDF6E3] w-13 h-13 rounded-full items-center justify-center border border-[#EAE4D4] p-1.5 shadow-sm active:scale-95">
                  <Image source={{ uri: Emoji3D[emoji] }} className="w-8 h-8" resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleCopyText} className="bg-[#EAE4D4] p-4 rounded-[20px] mb-4 flex-row items-center">
              <View className="w-10 h-10 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
                <FontAwesome5 name="copy" size={16} color="#6B655B" />
              </View>
              <Text className="text-[#3D382F] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>টেক্সট কপি করুন</Text>
            </TouchableOpacity>

            {selectedMessage?.userEmail === currentUser.email && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleDeleteMessage('everyone')} className="bg-[#FFECCC] p-4 rounded-[20px] mb-4 flex-row items-center border border-[#FFDDAA]">
                <View className="w-10 h-10 bg-[#FF9600] rounded-full items-center justify-center mr-4">
                  <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
                </View>
                <View>
                  <Text className="text-[#D47B00] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সবার জন্য আনসেন্ড করুন</Text>
                  <Text className="text-[#D47B00]/70 text-[12px]" style={{ fontFamily: 'BanglaRegular' }}>Remove for everyone</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.8} onPress={() => handleDeleteMessage('me')} className="bg-[#FDF6E3] p-4 rounded-[20px] mb-6 flex-row items-center border border-[#EFE8D6]">
              <View className="w-10 h-10 bg-[#EAE4D4] rounded-full items-center justify-center mr-4">
                <FontAwesome5 name="eye-slash" size={16} color="#827B6E" />
              </View>
              <View>
                <Text className="text-[#3D382F] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>আমার থেকে রিমুভ করুন</Text>
                <Text className="text-[#827B6E] text-[12px]" style={{ fontFamily: 'BanglaRegular' }}>Remove for me</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={() => setActionSheetVisible(false)} className="bg-[#EAE4D4] py-4 rounded-[16px] items-center">
              <Text className="text-[#6B655B] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}