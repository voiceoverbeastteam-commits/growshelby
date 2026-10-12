import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TournamentButton({ isActive }) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push('/tournament')} 
      className="items-center justify-center p-1"
    >
      <FontAwesome5 
        name="trophy" 
        size={22} 
        color={isActive ? '#FF9600' : '#AFAFAF'} 
        solid={isActive} 
      />
    </TouchableOpacity>
  );
}