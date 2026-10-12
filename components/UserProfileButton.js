import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function UserProfileButton({ isActive }) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push('/profile')} 
      className="items-center justify-center w-full h-full"
    >
      <FontAwesome5 
        name="user-alt" 
        size={22} 
        color={isActive ? '#FF4B4B' : '#AFAFAF'} 
        solid={isActive} 
      />
    </TouchableOpacity>
  );
}