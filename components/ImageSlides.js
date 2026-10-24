import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Animated } from 'react-native';

// 🚀 ব্যানার লোডিং শিমার ইফেক্ট
const SkeletonSlide = () => {
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
    <Animated.View style={{ opacity: shimmerAnim }} className="w-full h-52 bg-[#F5F5F5] rounded-2xl border-2 border-[#E5E5E5] border-b-[5px] border-b-[#CECECE] items-center justify-center">
       <View className="w-32 h-4 bg-[#E5E5E5] rounded-full mb-3" />
       <View className="w-20 h-4 bg-[#E5E5E5] rounded-full" />
    </Animated.View>
  );
};

export default function ImageSlides({ refreshTrigger }) {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 🔥 ডাটা আসার আগ পর্যন্ত true থাকবে
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);       
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

 useEffect(() => {
    const fetchBanners = () => {
      setIsLoading(true);
      fetch('https://growshelby-api.vercel.app/api/get_slides')
        .then(response => response.json())
        .then(data => {
          if (data.slides && data.slides.length > 0) {
            setSlides(data.slides);
            setCurrentIndex(0);
            if (data.slides.length > 1) {
                setNextIndex(1);
            }
            fadeAnim.setValue(0);
          }
        })
       .catch(error => console.error("Error fetching slides:", error))
        .finally(() => setIsLoading(false)); // 🔥 ডাটা চলে আসলে শিমার অফ হয়ে যাবে
    };

    fetchBanners();
  }, [refreshTrigger]); 

  useEffect(() => {
    if (slides.length <= 1) return;
    
    const listenerId = fadeAnim.addListener(() => {});

    const slideInterval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % slides.length);
        fadeAnim.setValue(0);
      });
    }, 4000);

    return () => {
        clearInterval(slideInterval);
        fadeAnim.removeListener(listenerId);
    };
  }, [slides, nextIndex, fadeAnim]);

  return (
    <View className="px-5 mt-2">
      {isLoading ? (
        <SkeletonSlide />
      ) : slides.length > 0 ? (
        <View className="w-full h-52 bg-white rounded-2xl overflow-hidden border-2 border-[#E5E5E5] border-b-[5px] border-b-[#CECECE]">
          
          <Image
            source={{ uri: slides[currentIndex] }}
            className="w-full h-full absolute top-0 left-0 rounded-xl"
            resizeMode="cover"
          />
          
          {slides.length > 1 && (
            <Animated.Image
              source={{ uri: slides[nextIndex] }}
              className="w-full h-full absolute top-0 left-0 rounded-xl"
              resizeMode="cover"
              style={{ opacity: fadeAnim }} 
            />
          )}
          
          <View className="absolute bottom-3 w-full flex-row justify-center space-x-2 z-10">
            {slides.map((_, index) => {
                const isActive = (fadeAnim.__getValue() > 0.5) ? index === nextIndex : index === currentIndex;
                
                return (
                    <View 
                        key={index} 
                        className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-5 bg-[#1CB0F6]' : 'w-2 bg-[#E5E5E5]'}`}
                    />
                )
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}