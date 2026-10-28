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

  // 🚀 Comments Modal এর জন্য স্পেশাল Shimmer Effect
  const CommentSkeleton = () => {
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
      <Animated.View style={{ opacity: shimmerAnim }} className="flex-1 px-5 pt-6">
        {[1, 2, 3].map((key) => (
          <View key={key} className="mb-6 flex-row justify-start">
            <View className="w-8 h-8 rounded-full bg-[#EAE4D4] mr-3" />
            <View className="flex-1">
              <View className="w-24 h-3 bg-[#EAE4D4] rounded-full mb-2.5" />
              <View className="w-full h-16 bg-[#FFFDF8] border border-[#EFE8D6] rounded-2xl rounded-tl-sm" />
            </View>
          </View>
        ))}
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
  
  // 🚀 Comments Modal States
  const [activePost, setActivePost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getThreadedComments = () => {
    const roots = [];
    const replies = [];
    
    postComments.forEach(msg => {
      if (msg.text && msg.text.startsWith('@[')) replies.push(msg);
      else roots.push({ ...msg, childReplies: [] });
    });

    replies.forEach(reply => {
      const match = reply.text.match(/^@\[(.*?)\]/);
      let added = false;
      if (match) {
        const targetName = match[1];
        const parent = roots.find(r => r.userName === targetName);
        if (parent) {
          parent.childReplies.unshift(reply);
          added = true;
        }
      }
      if (!added) roots.push({ ...reply, childReplies: [] });
    });
    
    return roots;
  };

  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);

  // 🚀 নির্দিষ্ট পোস্টের কমেন্ট লোড করার ফাংশন
  const openComments = async (post) => {
    setActivePost(post);
    setCommentsModalVisible(true);
    setIsLoadingComments(true);
    setPostComments([]);
    
    try {
      const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ 
          action: 'get_community_messages', 
          guideId, 
          userEmail: currentUser.email, 
          parentId: post.messageId || post.id 
        })
      });
      const result = await response.json();
      if (result.success && result.messages) {
        setPostComments(result.messages.map(msg => ({
          ...msg,
          reactions: msg.reactions || {}
        })).reverse());
      }
    } catch (error) {
      console.error("Comments fetch error:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 🚀 কমেন্ট সেন্ড করার ফাংশন (ইউজার এবং ক্রিয়েটর সবাই করতে পারবে)
  const handleSendComment = async () => {
    if (commentInput.trim() === '' || !activePost) return;
    const textToSend = commentInput.trim();
    setCommentInput('');
    
    const tempMessageId = `cmt_${Date.now()}`;
    const newComment = {
      messageId: tempMessageId,
      guideId,
      userEmail: currentUser.email,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isAuthor: currentUser.email === guideId, 
      text: textToSend,
      isContextual: false,
      contextQuestion: null,
      parentId: activePost.messageId || activePost.id, 
      reactions: { UP: [], DOWN: [] }, 
      timestamp: new Date().toISOString()
    };

    setPostComments(prev => [newComment, ...prev]);

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'send_community_message', ...newComment })
      });
    } catch (error) {}
  };

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

// 🚀 Comment States & Functions
 const [isCommentModalVisible, setCommentModalVisible] = useState(false);
 const [activePostForComment, setActivePostForComment] = useState(null);
 const [commentText, setCommentText] = useState('');
 const [replyToUser, setReplyToUser] = useState(null);

const openCommentModal = (post) => {
    setActivePostForComment(post);
    setCommentModalVisible(true);
    
    const oldComments = post.legacyComments ? [...post.legacyComments].reverse() : [];
    setPostComments(oldComments);
    setIsLoadingComments(true);
    
    // 🚀 ম্যাজিক অপ্টিমাইজেশন: মডাল ওপেন হওয়ার অ্যানিমেশন শেষ হতে সময় দেব, তারপর API কল হবে।
    // এতে করে ইউজারের ফোন হ্যাং হবে না এবং এক্সপেরিয়েন্স মাখনের মত স্মুথ হবে!
    setTimeout(async () => {
      try {
        const response = await fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
          body: JSON.stringify({ action: 'get_community_messages', guideId, parentId: post.messageId || post.id })
        });
        const result = await response.json();
        
        if (result.success && result.messages) {
          const newComments = result.messages.reverse();
          const allComments = [...newComments, ...oldComments];
          
          const uniqueComments = Array.from(new Map(allComments.map(item => [item.messageId || item.id, item])).values())
            .filter(item => 
              item.parentId === (post.messageId || post.id) || 
              oldComments.some(old => (old.messageId || old.id) === (item.messageId || item.id))
            );
          
          setPostComments(uniqueComments);
        }
      } catch (e) {
        console.log("Error loading comments:", e);
      } finally {
        setIsLoadingComments(false);
      }
    }, 350); // মডাল ওপেন হতে ৩৫০ মিলিসেকেন্ড সময় দেওয়া হলো
  };

const handleSendCommentModal = async () => {
   if (commentText.trim() === '' || !activePostForComment) return;
   
   // রিপ্লাই হলে নামের সাথে মেনশন যুক্ত করে দেওয়া হচ্ছে
   const textToSend = replyToUser ? `@[${replyToUser.userName}] ${commentText.trim()}` : commentText.trim();
   
   setCommentText('');
   setReplyToUser(null);
    
    const parentId = activePostForComment.messageId || activePostForComment.id;
    const tempMessageId = `cmt_${Date.now()}`;
    const newComment = {
      messageId: tempMessageId,
      guideId,
      userEmail: currentUser.email,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isAuthor: false, 
      text: textToSend,
      isContextual: false,
      contextQuestion: null,
      parentId: parentId,
      reactions: { UP: [], DOWN: [] }, 
      timestamp: new Date().toISOString()
    };

    setPostComments(prev => [newComment, ...prev]);

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'send_community_message', ...newComment })
      });
    } catch (error) {}
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
      isAuthor: true, 
      text: textToSend,
      isContextual: data ? true : false,
      contextQuestion: data ? data.question : null,
      parentId: null,
      reactions: { UP: [], DOWN: [] }, 
      timestamp: new Date().toISOString()
    };

    setComments(prev => [newMessage, ...prev]);

    try {
      await fetch('https://growshelby-api.vercel.app/api/update_coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'Growshelby_MVP_Secret_2026' },
        body: JSON.stringify({ action: 'send_community_message', ...newMessage })
      });
    } catch (error) {}
  };

 // 🚀 ম্যাজিক: পুরনো মেসেজগুলোকে পোস্ট এবং কমেন্টে ভাগ করার লজিক
  const getProcessedFeed = () => {
    const processedPosts = [];
    let currentPostIndex = -1;

    const reversedComments = [...comments].reverse();
    
  reversedComments.forEach(msg => {
      // ১. ক্রিয়েটরের মেইন পোস্টগুলো আলাদা করা (যেগুলোর parentId নেই এবং যেগুলো রিপ্লাই না)
      if ((msg.userEmail === guideId || msg.isAuthor) && !msg.parentId && !msg.text.startsWith('@[')) {
        processedPosts.push({ ...msg, isAuthor: true, legacyComments: [] });
        currentPostIndex = processedPosts.length - 1;
      } 
      else {
        // ২. সাধারণ ইউজারের মেসেজগুলো শুধুমাত্র আগের ক্রিয়েটরের পোস্টের 'কমেন্ট' হিসেবে যুক্ত হবে
        if (currentPostIndex >= 0) {
          processedPosts[currentPostIndex].legacyComments.push(msg);
        }
      }
    });

    return processedPosts.reverse(); 
  };

  const finalFeed = getProcessedFeed();


  // 🚀 পারফেক্ট রিয়েকশন হ্যান্ডলার (রেডিট আপভোট/ডাউনভোট সাপোর্টেড)
  const handleReaction = async (emojiType, customMsgId = null) => {
    const msgId = customMsgId || (selectedMessage ? (selectedMessage.messageId || selectedMessage.id || selectedMessage._id) : null);
    if (!msgId) return;
    
    setActionSheetVisible(false);

   // ১. আগে টার্গেট মেসেজটা খুঁজে বের করছি (মেইন ফিড এবং কমেন্ট ফিড দুই জায়গা থেকেই)
   const targetMessage = comments.find(msg => (msg.messageId || msg.id || msg._id) === msgId) 
                      || postComments.find(msg => (msg.messageId || msg.id || msg._id) === msgId);
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

    // ২. এবার ফ্রন্টএন্ডে রিয়েকশন দেখাচ্ছি
   setComments(prev => prev.map(msg => {
     if ((msg.messageId || msg.id || msg._id) === msgId) return { ...msg, reactions: finalReactions };
     return msg;
   }));
   
   // মডালের ভেতরের কমেন্টগুলোর রিয়েকশনও আপডেট করছি
   setPostComments(prev => prev.map(msg => {
     if ((msg.messageId || msg.id || msg._id) === msgId) return { ...msg, reactions: finalReactions };
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
                <Text className="text-[#3D382F] text-[17px] pt-1" style={{ fontFamily: 'BanglaBold' }}>স্টাডি কমিউনিটি</Text>
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
              data={finalFeed}
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
                const reactions = item.reactions || {};
                const hasReactions = Object.keys(reactions).length > 0;
                
                // 🚀 মোট রিঅ্যাকশন কাউন্ট করা
                let totalReactions = 0;
                Object.values(reactions).forEach(users => {
                  if (Array.isArray(users)) {
                     totalReactions += users.length;
                  }
                });
                
                return (
                  <View className="mb-5 bg-white rounded-[20px] border-2 border-[#EFE8D6] shadow-sm overflow-hidden w-full">
                    
                    {/* 🚀 Header: Author Info */}
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#F9F9F9]">
                      <View className="flex-row items-center">
                        <Image source={{ uri: item.userAvatar || 'https://i.pravatar.cc/150' }} className="w-10 h-10 rounded-full bg-[#EAE4D4] border border-[#EFE8D6]" />
                        <View className="ml-3">
                        <View className="flex-row items-center">
                            <Text className="text-[14px] text-[#3D382F]" style={{ fontFamily: 'BanglaBold' }}>{item.userName || 'অ্যাডমিন'}</Text>
                            {(item.userEmail === guideId || item.isAuthor) && (
                              <View className="bg-[#1CB0F6]/10 px-2 py-0.5 rounded ml-2 border border-[#1CB0F6]/30">
                                <Text className="text-[#1899D6] text-[9px]" style={{ fontFamily: 'BanglaBold' }}>ক্রিয়েটর</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-[#AFAFAF] text-[11px] mt-0.5" style={{ fontFamily: 'BanglaRegular' }}>{formatTime(item.timestamp)}</Text>
                        </View>
                      </View>
                      
                      {/* থ্রি-ডট মেনু (শুধু ক্রিয়েটর দেখতে পাবে) */}
                      {item.userEmail === currentUser.email && (
                        <TouchableOpacity onPress={() => { setSelectedMessage(item); setActionSheetVisible(true); }} className="p-2 -mr-2">
                          <FontAwesome5 name="ellipsis-h" size={14} color="#AFAFAF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* 🚀 Body: Post Content */}
                    <View className="px-4 py-4">
                      {item.isContextual && item.contextQuestion && (
                        <View className="mb-3 pb-3 border-b border-[#EFE8D6] pl-2 relative">
                          <View className="absolute left-0 top-0 bottom-2 w-[3px] rounded-full bg-[#D47B00]" />
                          <Text className="text-[11px] text-[#D47B00]" style={{ fontFamily: 'BanglaBold' }}>প্রসঙ্গ:</Text>
                          <Text className="text-[13px] leading-5 text-[#827B6E]" style={{ fontFamily: 'BanglaRegular' }} numberOfLines={2}>
                            {item.contextQuestion}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[15px] text-[#4B4B4B] leading-[26px]" style={{ fontFamily: 'BanglaRegular' }}>{item.text}</Text>
                    </View>

                    {/* 🚀 Reaction Info Row (Facebook Style) */}
                    {hasReactions && totalReactions > 0 && (
                      <View className="px-4 pb-3 flex-row items-center">
                        <View className="flex-row items-center" style={{ overflow: 'visible' }}>
                          {Object.keys(reactions).map((emoji, index) => (
                            reactions[emoji] && reactions[emoji].length > 0 && emoji !== 'UP' && emoji !== 'DOWN' && (
                              <Image key={index} source={{ uri: Emoji3D[emoji] || Emoji3D['👍'] }} className="w-4 h-4" resizeMode="contain" style={{ marginLeft: index > 0 ? -4 : 0 }} />
                            )
                          ))}
                        </View>
                        <Text className="text-[12px] text-[#827B6E] ml-1.5 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{totalReactions}</Text>
                      </View>
                    )}

                    {/* 🚀 Footer: Action Buttons */}
                    <View className="flex-row items-center justify-between px-4 py-2 bg-[#FDF6E3] border-t border-[#EFE8D6]">
                      
                      {/* React Button */}
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => { setSelectedMessage(item); setActionSheetVisible(true); }}
                        className="flex-row items-center bg-white px-4 py-1.5 rounded-full border border-[#EAE4D4] shadow-sm flex-1 mr-2 justify-center"
                      >
                        <FontAwesome5 name="thumbs-up" size={13} color="#827B6E" />
                        <Text className="text-[#6B655B] text-[12px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>রিঅ্যাক্ট</Text>
                      </TouchableOpacity>

                  {/* Comment Button */}
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => openCommentModal(item)} 
                        className="flex-row items-center bg-white px-4 py-1.5 rounded-full border border-[#EAE4D4] shadow-sm flex-1 ml-2 justify-center"
                      >
                        <FontAwesome5 name="comment-alt" size={13} color="#827B6E" />
                        <Text className="text-[#6B655B] text-[12px] ml-2 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>
                          {item.legacyComments && item.legacyComments.length > 0 
                            ? `${item.legacyComments.length} মতামত` 
                            : 'মতামত দিন'}
                        </Text>
                      </TouchableOpacity>

                    </View>
                  </View>
                );
              }}
            />
          )}

       {/* 🚀 স্মার্ট ইনপুট বক্স (শুধু ক্রিয়েটর পোস্ট/নোটিস দিতে পারবে) */}
          <View className="px-4 py-3 border-t-2 border-[#EFE8D6] bg-[#FDF6E3] flex-row items-end">
            {currentUser.email === guideId ? (
              <>
                <View className="flex-1 bg-[#FFFDF8] border-2 border-b-[4px] border-[#EFE8D6] rounded-2xl px-4 py-2 min-h-[48px] max-h-[120px] justify-center mr-3">
                  <TextInput
                    className="text-[#3D382F] text-[15px] pt-1"
                    style={{ fontFamily: 'BanglaRegular' }}
                    placeholder={data ? "এই প্রশ্নের নোটিস দিন..." : "নতুন নোটিস বা পোস্ট লিখুন..."}
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
              </>
            ) : (
              <View className="flex-1 bg-[#EAE4D4] rounded-2xl px-4 py-3 items-center justify-center border border-[#D7D7D7]">
                <Text className="text-[#827B6E] text-[13px] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                  <FontAwesome5 name="lock" size={12} /> শুধুমাত্র ক্রিয়েটররাই পোস্ট করতে পারবেন
                </Text>
              </View>
            )}
          </View>
       </Animated.View>
      </KeyboardAvoidingView>

      {/* 🚀 Comment Modal (ফেসবুকের মতো) */}
      <Modal visible={isCommentModalVisible} transparent animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setCommentModalVisible(false)} />
          <View className="bg-[#FDF6E3] w-full h-[75%] rounded-t-[32px] overflow-hidden flex-col pb-6">
            
            <View className="w-12 h-1.5 bg-[#D7D7D7] rounded-full self-center mt-3 mb-1" />
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-[#EFE8D6]">
            <Text className="text-[#3D382F] text-[17px] pt-1" style={{ fontFamily: 'BanglaBold' }}>মতামতসমূহ</Text>
                <TouchableOpacity onPress={() => setCommentModalVisible(false)} className="p-2 bg-[#EAE4D4] rounded-full w-9 h-9 items-center justify-center">
                  <FontAwesome5 name="times" size={14} color="#6B655B" />
                </TouchableOpacity>
              </View>

            {isLoadingComments && postComments.length === 0 ? (
              <CommentSkeleton />
            ) : postComments.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8">
                <FontAwesome5 name="comment-dots" size={40} color="#D7D7D7" />
                <Text className="text-[16px] text-[#AFAFAF] mt-4" style={{ fontFamily: 'BanglaBold' }}>কোনো মতামত নেই। প্রথম কমেন্ট করুন!</Text>
              </View>
            ) : (
            <FlatList
                data={getThreadedComments()}
                keyExtractor={(item) => item.messageId || item.id}
                inverted={true}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 }}
                renderItem={({ item }) => {
                  const renderSingleMessage = (msg, isReply = false) => {
                    const commentReactions = msg.reactions || {};
                    let totalReactions = 0;
                    Object.values(commentReactions).forEach(users => {
                      if (Array.isArray(users)) totalReactions += users.length;
                    });

                    let replyName = '';
                    let actualText = msg.text;
                    if (isReply) {
                      const match = msg.text.match(/^@\[(.*?)\]/);
                      if (match) {
                        replyName = match[1];
                        actualText = msg.text.replace(/^@\[.*?\]\s*/, '');
                      }
                    }

                    return (
                      <View key={msg.messageId || msg.id} className={`flex-row mb-4 ${isReply ? 'mt-2' : ''}`}>
                        <Image source={{ uri: msg.userAvatar || 'https://i.pravatar.cc/150' }} className="w-8 h-8 rounded-full bg-[#EAE4D4] mr-3 border border-[#EFE8D6]" />
                        <View className="flex-1">
                          <TouchableOpacity 
                            activeOpacity={0.7} 
                            onLongPress={() => { setSelectedMessage(msg); setActionSheetVisible(true); }}
                            className="max-w-[95%]"
                          >
                            <View className={`px-4 py-3 rounded-2xl rounded-tl-sm border border-[#EFE8D6] shadow-sm ${isReply ? 'bg-[#F9F9F9]' : 'bg-white'}`}>
                              <Text className="text-[12px] text-[#D47B00] mb-1" style={{ fontFamily: 'BanglaBold' }}>{msg.userName || 'ইউজার'}</Text>
                              <Text className="text-[14px] text-[#4B4B4B] leading-5" style={{ fontFamily: 'BanglaRegular' }}>
                                {isReply && <Text className="text-[#1899D6]" style={{ fontFamily: 'BanglaBold' }}>{replyName} </Text>}
                                {actualText}
                              </Text>
                            </View>
                          </TouchableOpacity>

                        {totalReactions > 0 && (
                            <View className="flex-row items-center mt-1.5 ml-1">
                              {Object.keys(commentReactions).map((emoji, idx) => (
                                commentReactions[emoji] && commentReactions[emoji].length > 0 && emoji !== 'UP' && emoji !== 'DOWN' && (
                                  <Image key={idx} source={{ uri: Emoji3D[emoji] || Emoji3D['👍'] }} className="w-3.5 h-3.5" resizeMode="contain" style={{ marginLeft: idx > 0 ? -4 : 0 }} />
                                )
                              ))}
                              <Text className="text-[10px] text-[#827B6E] ml-1 pt-0.5" style={{ fontFamily: 'BanglaBold' }}>{totalReactions}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  };

                  const hasReplies = item.childReplies && item.childReplies.length > 0;
                  const isExpanded = expandedReplies[item.messageId || item.id];

                  return (
                    <View className="mb-2">
                      {renderSingleMessage(item, false)}

                      {hasReplies && !isExpanded && (
                        <TouchableOpacity 
                          className="ml-12 mb-4 flex-row items-center" 
                          onPress={() => toggleReplies(item.messageId || item.id)}
                        >
                          <View className="w-6 h-[1px] bg-[#AFAFAF] mr-2" />
                          <Text className="text-[12px] text-[#1899D6]" style={{ fontFamily: 'BanglaBold' }}>
                            {item.childReplies.length} টি রিপ্লাই দেখুন
                          </Text>
                        </TouchableOpacity>
                      )}

                      {hasReplies && isExpanded && (
                        <View className="border-l-2 border-[#EFE8D6] ml-4 pl-4 mb-2">
                          {item.childReplies.map(reply => renderSingleMessage(reply, true))}
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            )}

          {/* 🚀 Comment Input Box */}
            <View className="px-4 py-3 border-t-2 border-[#EFE8D6] bg-white flex-col">
              {replyToUser && (
                <View className="flex-row items-center justify-between bg-[#FDF6E3] px-3 py-2 rounded-t-xl border-x border-t border-[#EFE8D6] mb-[-5px] pb-3">
                  <Text className="text-[12px] text-[#827B6E]" style={{ fontFamily: 'BanglaBold' }}>
                    <FontAwesome5 name="reply" size={10} color="#827B6E" />  {replyToUser.userName}-কে রিপ্লাই দিচ্ছেন...
                  </Text>
                  <TouchableOpacity onPress={() => setReplyToUser(null)}>
                    <FontAwesome5 name="times-circle" size={14} color="#AFAFAF" />
                  </TouchableOpacity>
                  
                </View>
              )}
              <View className="flex-row items-end">
                <View className="flex-1 bg-[#FDF6E3] border border-[#EFE8D6] rounded-2xl px-4 py-2 min-h-[44px] max-h-[100px] justify-center mr-3 z-10">
                <TextInput
                  className="text-[#3D382F] text-[14px] pt-1"
                  style={{ fontFamily: 'BanglaRegular' }}
                  placeholder="আপনার মতামত লিখুন..."
                  placeholderTextColor="#AFAFAF"
                  multiline
                  value={commentText}
                  onChangeText={setCommentText}
                />
              </View>
            <TouchableOpacity activeOpacity={0.8} onPress={handleSendCommentModal} disabled={commentText.trim() === ''}>
                <View className={`w-11 h-11 rounded-full items-center justify-center border ${commentText.trim() === '' ? 'bg-[#EAE4D4] border-[#EAE4D4]' : 'bg-[#1899D6] border-[#1899D6]'}`}>
                  <FontAwesome5 name="paper-plane" size={14} color={commentText.trim() === '' ? '#827B6E' : '#FFFFFF'} solid />
                </View>
              </TouchableOpacity>
          </View>

          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

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

          {/* রিপ্লাই বাটন (শুধু কমেন্ট মডাল ওপেন থাকলে দেখাবে) */}
            {isCommentModalVisible && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => { setReplyToUser(selectedMessage); setActionSheetVisible(false); }} className="bg-[#E6F4FB] p-4 rounded-[20px] mb-4 flex-row items-center border border-[#BCE3F5]">
                <View className="w-10 h-10 bg-[#1899D6] rounded-full items-center justify-center mr-4 shadow-sm">
                  <FontAwesome5 name="reply" size={16} color="#FFF" />
                </View>
                <Text className="text-[#1073A4] text-[16px] pt-1" style={{ fontFamily: 'BanglaBold' }}>রিপ্লাই করুন</Text>
              </TouchableOpacity>
            )}

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