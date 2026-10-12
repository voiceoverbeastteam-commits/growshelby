import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

// মডিউলার বাটনগুলো ইমপোর্ট করা হলো
import UserProfileButton from './UserProfileButton';
import TournamentButton from './TournamentButton';
import StudyButton from './StudyButton';

export default function Bottombar({ onChallengePress }) {
  const router = useRouter();
  const pathname = usePathname();

  // বর্তমান রাউট অনুযায়ী কোন ট্যাবটি এক্টিভ থাকবে তা নির্ধারণ করা হচ্ছে
  let activeTab = 'home';
  if (pathname === '/profile') activeTab = 'profile';
  if (pathname === '/tournament') activeTab = 'tournament';
  if (pathname === '/study') activeTab = 'study';

  return (
    <View 
      className="absolute bottom-6 self-center w-[92%] bg-white rounded-[32px] flex-row justify-between items-center px-6 py-4 border-2 border-[#E5E5E5] border-b-[6px] border-b-[#D7D7D7]"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 9999, // সবচেয়ে উপরে রাখার জন্য
      }}
    >
      
      {/* Home Button */}
      <View className="w-12 h-12 items-center justify-center z-50">
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => router.push('/')} 
          className="items-center justify-center w-full h-full"
        >
          <FontAwesome5 name="home" size={24} color={activeTab === 'home' ? '#1CB0F6' : '#AFAFAF'} solid={activeTab === 'home'} />
        </TouchableOpacity>
      </View>

      {/* Tournament Button */}
      <View className="w-12 h-12 items-center justify-center z-50">
        <TournamentButton isActive={activeTab === 'tournament'} />
      </View>

      {/* Center Action Button (AI Generate) */}
      {/* নির্দিষ্ট width দিয়ে দেওয়া হলো যাতে এটি ডানদিকের বাটনগুলোকে ব্লক না করে */}
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={onChallengePress ? onChallengePress : () => {}} 
        className="-mt-12 w-16 h-16 items-center justify-center z-50"
      >
        <View className="bg-[#1899D6] rounded-full pb-[6px]">
          <View className="w-16 h-16 bg-[#1CB0F6] rounded-full flex-row justify-center items-center border-[4px] border-white">
            <FontAwesome5 name="bolt" size={26} color="#FFFFFF" solid />
          </View>
        </View>
      </TouchableOpacity>

      {/* Study Button */}
      <View className="w-12 h-12 items-center justify-center z-50">
        <StudyButton isActive={activeTab === 'study'} />
      </View>

      {/* Profile Button */}
      <View className="w-12 h-12 items-center justify-center z-50">
        <UserProfileButton isActive={activeTab === 'profile'} />
      </View>

    </View>
  );
}