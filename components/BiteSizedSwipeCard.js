import React, { useRef } from 'react';
import { View, Text, Animated, PanResponder, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function BiteSizedSwipeCard({ item, onSwipedAway }) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > 100 || gesture.dx < -100) {
          Animated.timing(pan, {
            toValue: { x: gesture.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            if(onSwipedAway) onSwipedAway();
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View className="relative w-full min-h-[300px] mb-4 mt-2 items-center justify-center">
      {/* Background Fake Card 2 (Bottom layer) */}
      <View className="absolute w-[85%] h-full bg-[#E5E5E5] rounded-[40px] top-4 border-2 border-[#D5D5D5] opacity-60" />
      
      {/* Background Fake Card 1 (Middle layer) */}
      <View className="absolute w-[92%] h-full bg-[#F5F5F5] rounded-[40px] top-2 border-2 border-[#E5E5E5] opacity-90" />

      {/* Main Draggable Card */}
      <Animated.View 
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX: pan.x }] }}
        className="bg-[#FAFAFA] p-8 w-full rounded-[40px] border-2 border-[#E5E5E5] items-center justify-center min-h-[300px] shadow-sm bg-white"
      >
        <View className="bg-[#CE82FF]/20 p-4 rounded-full mb-6">
          <FontAwesome5 name={item?.tagIcon || "lightbulb"} size={28} color="#A559D6" />
        </View>
        
        <Text className="text-[20px] text-[#3C3C3C] text-center leading-9" style={{ fontFamily: 'BanglaBold' }}>
          {item?.info}
        </Text>

        <View className="absolute bottom-5 flex-row items-center opacity-40">
          <FontAwesome5 name="arrows-alt-h" size={14} color="#3C3C3C" />
          <Text className="ml-2 text-[12px] pt-1" style={{ fontFamily: 'BanglaBold' }}>সরিয়ে দিন</Text>
        </View>
      </Animated.View>
    </View>
  );
}