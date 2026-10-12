import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.6;

export default function DailyChallenge({ challenges, setChallenges, activeTab, setActiveTab, onStartReading, onDeleteCard, onEditCard }) {
  const pan = useRef(new Animated.ValueXY()).current;

  const activeTabRef = useRef(activeTab);
  const challengesRef = useRef(challenges);
  
  // ড্রপডাউন মেনু কন্ট্রোল করার জন্য স্টেট এবং রেফ
  const [openMenuId, setOpenMenuIdState] = useState(null);
  const openMenuIdRef = useRef(null);

  const setOpenMenuId = (id) => {
    openMenuIdRef.current = id;
    setOpenMenuIdState(id);
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    challengesRef.current = challenges;
  }, [challenges]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // ড্র্যাগ শুরু হলে যদি মেনু খোলা থাকে, তবে তা বন্ধ করে দেওয়া হবে
        if (openMenuIdRef.current) {
          setOpenMenuId(null);
        }
        return Math.abs(gestureState.dx) > 7 || Math.abs(gestureState.dy) > 7;
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        const isSwipeRight = gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > VELOCITY_THRESHOLD;
        const isSwipeLeft = gestureState.dx < -SWIPE_THRESHOLD || gestureState.vx < -VELOCITY_THRESHOLD;

        const currentTabCount = challengesRef.current.filter(c => c.status === activeTabRef.current).length;

        if ((isSwipeRight || isSwipeLeft) && currentTabCount > 1) {
          const swipeDirection = gestureState.dx > 0 ? SCREEN_WIDTH + 150 : -SCREEN_WIDTH - 150;

          Animated.timing(pan, {
            toValue: { x: swipeDirection, y: gestureState.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            setChallenges((prev) => {
              const newArray = [...prev];
              const activeIndex = newArray.findIndex(c => c.status === activeTabRef.current);
              if (activeIndex > -1) {
                const swipedItem = newArray.splice(activeIndex, 1)[0];
                newArray.push(swipedItem);
              }
              return newArray;
            });
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 50,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const filteredChallenges = challenges.filter(item => item.status === activeTab);

  const renderCards = () => {
    if (filteredChallenges.length === 0) {
      return (
        <View style={{ backgroundColor: '#D7D7D7', borderRadius: 24, paddingBottom: 6, height: 260 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, borderWidth: 1.5, borderColor: '#E5E5E5', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View className="bg-[#F5F5F5] p-5 rounded-full mb-3">
              <MaterialCommunityIcons name={activeTab === 'revision' ? "file-restore" : "folder-open-outline"} size={40} color="#C4C4C4" />
            </View>
            <Text className="text-base text-[#777777] mt-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>
              {activeTab === 'revision' ? 'কোনো রিভিশন কার্ড নেই' : 'এই ক্যাটাগরিতে'}
            </Text>
            <Text className="text-sm text-[#AFAFAF] mt-1 pt-1" style={{ fontFamily: 'BanglaBold' }}>
              {activeTab === 'revision' ? 'দারুণ! তুমি কোনো ভুল করোনি।' : 'কোনো নোটবুক নেই'}
            </Text>
          </View>
        </View>
      );
    }

    return filteredChallenges.map((item, index) => {
      if (index > 2) return null;
      const isTop = index === 0;

      let defaultTranslateX = 0;
      let defaultTranslateY = 0;
      let defaultRotate = '0deg';

      if (index === 1) {
        defaultTranslateX = 6;
        defaultTranslateY = 12;
        defaultRotate = '2deg';
      } else if (index === 2) {
        defaultTranslateX = -6;
        defaultTranslateY = 22;
        defaultRotate = '-2deg';
      }

      const translateX = isTop
        ? pan.x
        : pan.x.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: [0, defaultTranslateX, 0],
            extrapolate: 'clamp',
          });

      const translateY = isTop
        ? pan.y
        : pan.x.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: [index === 1 ? 0 : 12, defaultTranslateY, index === 1 ? 0 : 12],
            extrapolate: 'clamp',
          });

      const rotate = isTop
        ? pan.x.interpolate({
            inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            outputRange: ['-10deg', '0deg', '10deg'],
            extrapolate: 'clamp',
          })
        : pan.x.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: ['0deg', defaultRotate, '0deg'],
            extrapolate: 'clamp',
          });

      return (
        <Animated.View
          key={item.id}
          {...(isTop ? panResponder.panHandlers : {})}
          style={[
            {
              position: 'absolute',
              width: '100%',
              zIndex: filteredChallenges.length - index,
              transform: [{ translateX }, { translateY }, { rotate }],
            },
          ]}
        >
          <View style={{ backgroundColor: '#D7D7D7', borderRadius: 24, paddingBottom: 6, height: 260 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 24, borderWidth: 1.5, borderColor: '#E5E5E5', padding: 20, flex: 1, justifyContent: 'space-evenly', position: 'relative' }}>
              
              {/* 🚀 থ্রি-ডট আইকন এবং মেনু */}
              <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 100 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                  style={{ padding: 10 }}
                >
                  <FontAwesome5 name="ellipsis-v" size={18} color="#C4C4C4" />
                </TouchableOpacity>

                {openMenuId === item.id && (
                  <View style={{ 
                    position: 'absolute', 
                    top: 40, 
                    right: 10, 
                    backgroundColor: 'white', 
                    borderRadius: 12, 
                    borderWidth: 1, 
                    borderColor: '#E5E5E5', 
                    width: 120, 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 2 }, 
                    shadowOpacity: 0.1, 
                    shadowRadius: 4, 
                    elevation: 5, 
                    zIndex: 101 
                  }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setOpenMenuId(null);
                        if(onEditCard) onEditCard(item.id, item.notebookName || item.subject);
                      }}
                      style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}
                    >
                      <Text style={{ fontFamily: 'BanglaBold', color: '#3C3C3C' }}>এডিট নাম</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setOpenMenuId(null);
                        if(onDeleteCard) onDeleteCard(item.id);
                      }}
                      style={{ paddingVertical: 12, paddingHorizontal: 16 }}
                    >
                      <Text style={{ fontFamily: 'BanglaBold', color: '#FF4B4B' }}>ডিলিট করুন</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View className="items-center px-4">
                <Text className="text-[22px] text-[#3C3C3C] text-center pt-1 leading-8" style={{ fontFamily: 'BanglaBold' }}>
                  {item.notebookName || item.subject}
                </Text>
              </View>

              <View style={{ backgroundColor: '#D4B300', borderRadius: 12, paddingBottom: 4, alignSelf: 'center' }}>
                <View style={{ backgroundColor: '#FFDF00', borderRadius: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="target" size={16} color="#B87B00" />
                  <Text className="text-[#B87B00] ml-1.5 text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>
                    {item.target}
                  </Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.8} style={{ width: '100%' }} onPress={() => {
                  setOpenMenuId(null); // পড়ার সময় মেনু বন্ধ হয়ে যাবে
                  if(onStartReading) onStartReading(item);
              }}>
                <View style={{ backgroundColor: item.darkColor || '#58A700', borderRadius: 16, paddingBottom: 6 }}>
                  <View style={{ backgroundColor: item.color || '#58CC02', borderRadius: 16, paddingTop: 14, paddingBottom: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesome5 name="play" size={14} color="#FFFFFF" solid />
                    <Text className="text-white ml-2 text-[17px] pt-1" style={{ fontFamily: 'BanglaBold' }}>
                      {activeTab === 'revision' ? 'রিভিশন শুরু করুন' : 'পড়া শুরু করুন'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

            </View>
          </View>
        </Animated.View>
      );
    }).reverse();
  };

  return (
    <View className="w-full bg-[#F2F6F9] mt-6 pt-6 pb-6 rounded-t-[32px]">
      <View className="items-center justify-center mb-5 mt-1">
        <View className="flex-row items-center bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-[#E5E5E5]">
          <FontAwesome5 name="book" size={18} color="#FF9600" solid />
          <Text className="text-[18px] text-[#3C3C3C] ml-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>
            তোমার নোটবুকসমূহ
          </Text>
        </View>
      </View>

      <View className="px-5 mb-5">
        <View className="flex-row justify-between bg-[#E6EEF4] p-1 rounded-xl border border-[#D3DFE8]">
          <TouchableOpacity activeOpacity={0.8} onPress={() => { setActiveTab('completed'); setOpenMenuId(null); }} className={`flex-1 py-2.5 rounded-lg items-center justify-center ${activeTab === 'completed' ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-[13px] pt-1 ${activeTab === 'completed' ? 'text-[#58CC02]' : 'text-[#7B92A5]'}`} style={{ fontFamily: 'BanglaBold' }}>কমপ্লিটেড</Text>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.8} onPress={() => { setActiveTab('in_progress'); setOpenMenuId(null); }} className={`flex-1 py-2.5 rounded-lg items-center justify-center ${activeTab === 'in_progress' ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-[13px] pt-1 ${activeTab === 'in_progress' ? 'text-[#1CB0F6]' : 'text-[#7B92A5]'}`} style={{ fontFamily: 'BanglaBold' }}>ইন প্রগ্রেস</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => { setActiveTab('revision'); setOpenMenuId(null); }} className={`flex-1 py-2.5 rounded-lg items-center justify-center ${activeTab === 'revision' ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-[13px] pt-1 ${activeTab === 'revision' ? 'text-[#FF4B4B]' : 'text-[#7B92A5]'}`} style={{ fontFamily: 'BanglaBold' }}>রিভিশন</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5">
        <View style={{ height: 290 }}>
          {renderCards()}
        </View>
      </View>
    </View>
  );
}