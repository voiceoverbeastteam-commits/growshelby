import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function MaintainanceScreen({ endTime: initialEndTime, onMaintenanceEnd }) {
  const [endTime, setEndTime] = useState(initialEndTime ? new Date(initialEndTime).getTime() : null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(!initialEndTime);

  // লাইভ সার্ভার চেক (যদি অ্যাডমিন সময় পরিবর্তন করে বা মেইনটেন্যান্স অফ করে দেয়)
  useEffect(() => {
    const fetchLatestStatus = async () => {
      try {
        const response = await fetch('https://growshelby-api.vercel.app/api/get_settings');
        const data = await response.json();

        if (!data.isMaintenance) {
          if (onMaintenanceEnd) onMaintenanceEnd();
        } else if (data.maintenanceEndTime) {
          setEndTime(new Date(data.maintenanceEndTime).getTime());
        }
      } catch (error) {
        console.log("Maintenance sync error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialEndTime) {
      fetchLatestStatus();
    }

    const interval = setInterval(fetchLatestStatus, 30000);
    return () => clearInterval(interval);
  }, [initialEndTime, onMaintenanceEnd]);

  // লাইভ কাউন্টডাউন টাইমার লজিক (Free Fire Style)
  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        if (onMaintenanceEnd) onMaintenanceEnd();
      } else {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onMaintenanceEnd]);

  const formatNumber = (num) => (num < 10 ? `0${num}` : num);

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      
      {/* Duolingo Style 3D Card */}
      <View className="bg-white w-full rounded-[28px] p-6 items-center border-2 border-[#E5E5E5] border-b-[8px] border-b-[#CECECE]">
        
        {/* Top Tools Icon Box */}
        <View className="bg-[#FF4B4B]/10 w-24 h-24 rounded-[30px] items-center justify-center mb-5 border-2 border-[#FF4B4B]/20">
          <FontAwesome5 name="tools" size={42} color="#FF4B4B" solid />
        </View>

        {/* Header Texts */}
        <Text style={{ fontFamily: 'BanglaBold' }} className="text-[22px] text-[#3C3C3C] text-center mb-2">
          সার্ভার মেইনটেন্যান্স চলছে!
        </Text>
        <Text style={{ fontFamily: 'BanglaRegular' }} className="text-[15px] text-[#777777] text-center mb-6 px-2 leading-6">
          অ্যাপের নতুন আপডেট এবং সার্ভারের কাজ চলছে। সার্ভার পুনরায় চালু হওয়া পর্যন্ত অনুগ্রহ করে অপেক্ষা করুন।
        </Text>

        {/* Live Countdown Timer Section */}
        <View className="w-full bg-[#F5F5F5] rounded-3xl p-5 border-2 border-[#E5E5E5]">
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-[#AFAFAF] text-center mb-4 text-sm">
            সার্ভার চালু হতে সময় বাকি:
          </Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#FF4B4B" />
          ) : (
            <View className="flex-row justify-between w-full px-2 space-x-3">
              {/* Hours Box */}
              <View className="flex-1 bg-white rounded-2xl items-center py-4 border-2 border-[#E5E5E5] border-b-[5px] border-b-[#CECECE]">
                <Text style={{ fontFamily: 'PoppinsBold' }} className="text-3xl text-[#1CB0F6]">
                  {formatNumber(timeLeft.hours)}
                </Text>
                <Text style={{ fontFamily: 'BanglaBold' }} className="text-[#777777] text-xs pt-1">
                  ঘণ্টা
                </Text>
              </View>

              {/* Minutes Box */}
              <View className="flex-1 bg-white rounded-2xl items-center py-4 border-2 border-[#E5E5E5] border-b-[5px] border-b-[#CECECE]">
                <Text style={{ fontFamily: 'PoppinsBold' }} className="text-3xl text-[#FF9600]">
                  {formatNumber(timeLeft.minutes)}
                </Text>
                <Text style={{ fontFamily: 'BanglaBold' }} className="text-[#777777] text-xs pt-1">
                  মিনিট
                </Text>
              </View>

              {/* Seconds Box */}
              <View className="flex-1 bg-white rounded-2xl items-center py-4 border-2 border-[#E5E5E5] border-b-[5px] border-b-[#CECECE]">
                <Text style={{ fontFamily: 'PoppinsBold' }} className="text-3xl text-[#FF4B4B]">
                  {formatNumber(timeLeft.seconds)}
                </Text>
                <Text style={{ fontFamily: 'BanglaBold' }} className="text-[#777777] text-xs pt-1">
                  সেকেন্ড
                </Text>
              </View>
            </View>
          )}
        </View>
        
      </View>

    </View>
  );
}