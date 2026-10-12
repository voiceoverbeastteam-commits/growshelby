import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { FontAwesome5 } from '@expo/vector-icons'; // 🚀 ইমোজির বদলে আইকন ইমপোর্ট করা হলো

// আপনার অ্যাপের বর্তমান রিলিজ ভার্সন এখানে সেট করুন
const CURRENT_APP_VERSION = "1.0.0"; 

export default function Autoupdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apkUrl, setApkUrl] = useState('');

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      // আপনার অ্যাডমিন প্যানেলের get_settings এপিআই কল করা হচ্ছে
      const response = await fetch('https://growshelby-api.vercel.app/api/get_settings');
      const data = await response.json();

      if (data.apkVersion && data.apkVersion !== CURRENT_APP_VERSION) {
        setApkUrl(data.apkUrl);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.log("Update check failed:", error);
    }
  };

  const downloadAndInstall = async () => {
    setDownloading(true);
    const fileUri = FileSystem.documentDirectory + 'growshelby_update.apk';

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      fileUri,
      {},
      (downloadProgress) => {
        const currentProgress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        setProgress(currentProgress);
      }
    );

    try {
      const { uri } = await downloadResumable.downloadAsync();
      setDownloading(false);

      // ডাউনলোড শেষে অটোমেটিক অ্যান্ড্রয়েড ইনস্টলার ওপেন করা
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: 'application/vnd.android.package-archive',
      });
    } catch (e) {
      console.error("Download Error:", e);
      setDownloading(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <Modal visible={true} transparent={false} animationType="fade">
      <View className="flex-1 bg-white justify-center items-center px-6">
        
        {/* Duolingo Style Main Card */}
        <View className="bg-white w-full rounded-[28px] p-6 items-center border-2 border-[#E5E5E5] border-b-[8px] border-b-[#CECECE]">
          
          {/* Top Icon Box */}
          <View className="bg-[#1CB0F6]/10 w-24 h-24 rounded-[30px] items-center justify-center mb-5 border-2 border-[#1CB0F6]/20">
            <FontAwesome5 name="cloud-download-alt" size={42} color="#1CB0F6" solid />
          </View>

          {/* Texts */}
          <Text style={{ fontFamily: 'BanglaBold' }} className="text-[22px] text-[#3C3C3C] text-center mb-2">
            নতুন আপডেট এসেছে!
          </Text>
          <Text style={{ fontFamily: 'BanglaRegular' }} className="text-[15px] text-[#777777] text-center mb-6 px-2 leading-6">
            অ্যাপটির নতুন ফিচার এবং স্মুথ এক্সপেরিয়েন্স পেতে এখনই আপডেট করুন।
          </Text>

          {/* Action Section */}
          <View className="w-full">
            {downloading ? (
              <View className="w-full bg-[#F5F5F5] rounded-3xl p-5 border-2 border-[#E5E5E5] items-center">
                <Text style={{ fontFamily: 'BanglaBold' }} className="text-[#AFAFAF] text-center mb-2 text-sm">
                  ডাউনলোড হচ্ছে...
                </Text>
                
                <View className="flex-row items-center justify-center mb-3">
                  <Text style={{ fontFamily: 'PoppinsBold' }} className="text-3xl text-[#1CB0F6]">
                    {Math.round(progress * 100)}
                  </Text>
                  <Text style={{ fontFamily: 'PoppinsBold' }} className="text-xl text-[#1CB0F6] pt-1">
                    %
                  </Text>
                </View>

                {/* Custom Progress Bar */}
                <View className="w-full h-4 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-[#1CB0F6] rounded-full" 
                    style={{ width: `${Math.round(progress * 100)}%` }} 
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={downloadAndInstall}
                activeOpacity={0.8}
                className="w-full bg-[#58CC02] py-4 rounded-2xl items-center justify-center border-2 border-[#58CC02] border-b-[5px] border-b-[#46A302]"
              >
                <Text style={{ fontFamily: 'BanglaBold' }} className="text-white text-xl pt-1">
                  এখনই আপডেট করুন
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>

      </View>
    </Modal>
  );
}