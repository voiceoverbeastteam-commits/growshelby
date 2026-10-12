import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function StudyButton({ isActive }) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push('/study')} 
      className="items-center justify-center w-full h-full"
    >
      <FontAwesome5 
        name="book-open" 
        size={22} 
        color={isActive ? '#58CC02' : '#AFAFAF'} 
        solid={isActive} 
      />
    </TouchableOpacity>
  );
}