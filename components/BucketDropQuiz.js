import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, LayoutAnimation, UIManager, Platform, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DraggableChip = ({ item, onDragStart, onDropAttempt }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const idleAnim = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const delay = Math.random() * 400; 
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(idleAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(idleAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
      ])
    );

    const timeout = setTimeout(() => anim.start(), delay);
    return () => {
      clearTimeout(timeout);
      anim.stop();
    };
  }, []);

  useEffect(() => {
    if (isDragging) {
      Animated.spring(dragScale, { toValue: 1.15, friction: 5, useNativeDriver: true }).start();
    } else {
      Animated.spring(dragScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [isDragging]);

  const idleTranslateY = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4] 
  });

  const idleScale = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02] 
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onTerminationRequest: () => false, 
      
      onPanResponderGrant: () => {
        onDragStart(); 
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);
        const { moveX, moveY } = gesture;
        
        const isDropped = onDropAttempt(item, moveX, moveY);
        
        if (!isDropped) {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  return (
    <View style={{ zIndex: isDragging ? 1000 : 1, elevation: isDragging ? 10 : 0 }}>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: pan.getTranslateTransform() }}
      >
        <Animated.View 
          style={{ 
            transform: [
              { translateY: isDragging ? 0 : idleTranslateY },
              { scale: isDragging ? dragScale : idleScale }
            ] 
          }}
          className={`rounded-2xl border-2 px-6 py-3 items-center shadow-sm bg-white border-[#E5E5E5] border-b-[4px] border-b-[#D7D7D7] ${isDragging ? 'bg-[#DDF4FF] border-[#1CB0F6] border-b-[#1899D6]' : ''}`}
        >
          <Text className={`text-[17px] pt-1 ${isDragging ? 'text-[#1899D6]' : 'text-[#4B4B4B]'}`} style={{ fontFamily: 'BanglaBold' }}>
            {item.text}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default function BucketDropQuiz({ 
  questionText = "সঠিক ক্যাটাগরিতে শব্দগুলো ফেলো:", 
  buckets = [
    { id: "noun", title: "বিশেষ্য" },
    { id: "adj", title: "বিশেষণ" }
  ],
  items = [
    { id: "1", text: "সুন্দর", correctBucket: "adj", explanation: "সুন্দর একটি গুণ বোঝায়, তাই এটি বিশেষণ।" },
    { id: "2", text: "বই", correctBucket: "noun", explanation: "বই একটি বস্তুর নাম, তাই এটি বিশেষ্য।" },
    { id: "3", text: "ভালো", correctBucket: "adj", explanation: "ভালো হচ্ছে একটি গুণ, তাই এটি বিশেষণ।" },
    { id: "4", text: "ঢাকা", correctBucket: "noun", explanation: "ঢাকা একটি শহরের নাম, তাই এটি বিশেষ্য।" }
  ],
  onComplete 
}) {
  const [availableItems, setAvailableItems] = useState([]);
  const [bucketContents, setBucketContents] = useState({});
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnyDragging, setIsAnyDragging] = useState(false); 

  const [errorItem, setErrorItem] = useState(null);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const errorSlideAnim = useRef(new Animated.Value(300)).current;

  const bucketRefs = useRef({});
  const bucketZones = useRef({});
  const bucketScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setAvailableItems([...items]);

    const initialBuckets = {};
    buckets.forEach(b => {
      initialBuckets[b.id] = [];
    });
    setBucketContents(initialBuckets);
  }, [items, buckets]);

  useEffect(() => {
    const totalPlacedItems = Object.values(bucketContents).reduce((sum, currentBucket) => sum + currentBucket.length, 0);

    if (totalPlacedItems > 0 && totalPlacedItems === items.length && !isCompleted) {
      setIsCompleted(true); 
      if (onComplete) {
        setTimeout(() => {
          onComplete(true); 
        }, 600); 
      }
    }
  }, [bucketContents, items, onComplete, isCompleted]);

  useEffect(() => {
    if (isAnyDragging) {
      Animated.spring(bucketScaleAnim, { toValue: 1.05, friction: 4, useNativeDriver: true }).start();
    } else {
      Animated.spring(bucketScaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    }
  }, [isAnyDragging]);

  const handleDragStart = () => {
    setIsAnyDragging(true); 
    buckets.forEach(b => {
      if (bucketRefs.current[b.id]) {
        bucketRefs.current[b.id].measure((x, y, width, height, pageX, pageY) => {
          bucketZones.current[b.id] = { x: pageX, y: pageY, width, height };
        });
      }
    });
  };

  const showErrorModal = (item) => {
    setErrorItem(item);
    setIsErrorModalVisible(true);
    Animated.spring(errorSlideAnim, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const closeErrorModal = () => {
    Animated.spring(errorSlideAnim, {
      toValue: 300,
      friction: 6,
      tension: 40,
      useNativeDriver: true
    }).start(() => {
      setIsErrorModalVisible(false);
      setErrorItem(null);
    });
  };

  const handleDropAttempt = (item, moveX, moveY) => {
    setIsAnyDragging(false); 
    let droppedBucketId = null;
    
    Object.keys(bucketZones.current).forEach(key => {
      const zone = bucketZones.current[key];
      if (moveX >= zone.x - 20 && moveX <= zone.x + zone.width + 20 &&
          moveY >= zone.y - 20 && moveY <= zone.y + zone.height + 20) {
        droppedBucketId = key;
      }
    });

    if (droppedBucketId) {
      if (item.correctBucket === droppedBucketId) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setBucketContents(prev => ({
          ...prev,
          [droppedBucketId]: [...prev[droppedBucketId], item]
        }));
        setAvailableItems(prev => prev.filter(i => i.id !== item.id));
        return true; 
      } else {
        showErrorModal(item);
        return false; 
      }
    }
    return false; 
  };

  return (
    // FIX: Removed flex-1 and justify-center to prevent huge gaps in ScrollView
    <View className="w-full flex-col pt-2 px-1">
      
      <View>
        <View className="flex-row items-center mb-6">
          <View className="bg-[#FF9600] w-10 h-10 rounded-full items-center justify-center mr-4 shadow-sm">
            <FontAwesome5 name="inbox" size={18} color="#FFF" />
          </View>
          <Text className="text-[22px] text-[#4B4B4B] pt-1 flex-1 leading-8" style={{ fontFamily: 'BanglaBold' }}>
            {questionText}
          </Text>
        </View>

        <View className="flex-row justify-between mb-10 px-1" style={{ zIndex: 1 }}>
          {buckets.map((bucket) => {
            const contents = bucketContents[bucket.id] || [];
            const isReadyToDrop = isAnyDragging;

            return (
              <View
                key={bucket.id}
                ref={el => (bucketRefs.current[bucket.id] = el)}
                collapsable={false}
                // FIX: Changed aspect-square to min-h-[160px] to allow it to grow if needed
                className="flex-1 mx-2 min-h-[160px]" 
              >
                <Animated.View 
                  style={{ transform: [{ scale: bucketScaleAnim }] }}
                  className={`flex-1 flex-col rounded-3xl border-2 p-3 ${isReadyToDrop ? 'bg-[#DDF4FF] border-[#1CB0F6] shadow-md' : 'bg-[#F9F9F9] border-[#E5E5E5]'}`}
                >
                  <Text className={`text-[19px] text-center mb-3 pt-1 ${isReadyToDrop ? 'text-[#1899D6]' : 'text-[#777777]'}`} style={{ fontFamily: 'BanglaBold' }}>
                    {bucket.title}
                  </Text>

                  {/* FIX: Ensure dropped chips are compact and side-by-side using gap-x and gap-y */}
                  <View className="flex-row flex-wrap justify-center gap-x-1.5 gap-y-1.5 pb-2">
                    {contents.map(item => (
                      <View key={`in-${item.id}`} className="bg-white border-2 border-[#1CB0F6] rounded-lg px-2.5 py-1 shadow-sm">
                        <Text className="text-[14px] text-[#1899D6] pt-1" style={{ fontFamily: 'BanglaBold' }}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </View>
            );
          })}
        </View>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3 pb-8" style={{ zIndex: 999, elevation: 10 }}>
        {availableItems.map((item) => (
          <DraggableChip 
            key={item.id}
            item={item}
            onDragStart={handleDragStart}
            onDropAttempt={handleDropAttempt}
          />
        ))}
      </View>

      <Modal
        visible={isErrorModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeErrorModal}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={closeErrorModal} 
            className="absolute inset-0 w-full h-full"
          />

          <Animated.View 
            style={{ transform: [{ translateY: errorSlideAnim }] }}
            className="bg-[#FFD7D7] rounded-t-[32px] pt-6 pb-10 px-5 shadow-[0_-5px_20px_rgba(0,0,0,0.15)] elevation-10"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Image 
                  source={{ uri: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Crying%20Face.png" }} 
                  style={{ width: 40, height: 40 }} 
                  resizeMode="contain" 
                />
                <Text className="text-2xl ml-3 pt-1 text-[#D63939]" style={{ fontFamily: 'BanglaBold' }}>
                  সঠিক হয়নি!
                </Text>
              </View>
            </View>
            
            <Text className="text-[16px] mb-5 pt-1 text-[#D63939]" style={{ fontFamily: 'BanglaRegular' }}>
              <Text style={{ fontFamily: 'BanglaBold' }}>ব্যাখ্যা: </Text>
              {errorItem?.explanation || `"${errorItem?.text}" এই বাকেটের জন্য সঠিক নয়।`}
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={closeErrorModal} className="w-full">
              <View className="bg-[#D63939] rounded-2xl pb-[6px]">
                <View className="bg-[#FF4B4B] rounded-2xl pt-4 pb-3 flex-row justify-center items-center">
                  <Text className="text-white text-lg pt-1" style={{ fontFamily: 'BanglaBold' }}>বুঝতে পেরেছি</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}