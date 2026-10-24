// File: app/community.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import PorarPageEyeComfort from '../components/PorarPageEyeComfort';

export default function CommunityScreen() {
  const router = useRouter();
  const [lessonData, setLessonData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await AsyncStorage.getItem('@temp_community_data');
      if (data) setLessonData(JSON.parse(data));
    };
    loadData();
  }, []);

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