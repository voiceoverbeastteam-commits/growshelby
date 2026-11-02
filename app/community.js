// File: app/community.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PorarPageEyeComfort from '../components/PorarPageEyeComfort';

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useLocalSearchParams();
  const [lessonData, setLessonData] = useState(null);

useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLessonData(null); // 🚀 পুরোনো ডেটা ক্লিন করা
        const data = await AsyncStorage.getItem('@temp_community_data');
        if (data) setLessonData(JSON.parse(data));
      };
      loadData();
    }, [t]) // 👈 শুধু এখানে [] এর জায়গায় [t] বসেছে
  );

  if (!lessonData) {
    return (
      <View className="flex-1 bg-[#FDF6E3] items-center justify-center">
        <ActivityIndicator size="large" color="#D47B00" />
      </View>
    );
  }

  return (
    <PorarPageEyeComfort 
      visible={true} 
      onClose={() => router.back()} 
      lessonItem={lessonData} 
      isNativeScreen={true} 
    />
  );
}