import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

export const logBackgroundEvent = async (stepName, payload) => {
  try {
    const timestamp = new Date().toLocaleTimeString();
    const existingLogs = await AsyncStorage.getItem('@bg_debug_logs');
    let logs = existingLogs ? JSON.parse(existingLogs) : [];
    
    logs.unshift({
      time: timestamp,
      step: stepName,
      data: payload ? JSON.stringify(payload).substring(0, 150) + '...' : 'No Payload'
    });

    await AsyncStorage.setItem('@bg_debug_logs', JSON.stringify(logs));
  } catch (e) {
    console.log("Logger Error:", e);
  }
};

export default function NotificationDebugger() {
  const [modalVisible, setModalVisible] = useState(false);
  const [logs, setLogs] = useState([]);

  const loadLogs = async () => {
    const savedLogs = await AsyncStorage.getItem('@bg_debug_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    setModalVisible(true);
  };

  const clearLogs = async () => {
    await AsyncStorage.removeItem('@bg_debug_logs');
    setLogs([]);
    Alert.alert("ক্লিয়ারড!", "সব লগ মুছে ফেলা হয়েছে। এবার আবার টেস্ট করুন।");
  };

  return (
    <>
      <TouchableOpacity
        onPress={loadLogs}
        className="absolute top-12 right-4 bg-red-500 w-12 h-12 rounded-full items-center justify-center border-2 border-white shadow-lg z-50"
      >
        <FontAwesome5 name="bug" size={20} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-white w-full h-[80%] rounded-t-[24px] p-5">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-3">
              <Text className="text-xl font-bold text-gray-800">ব্যাকগ্রাউন্ড ট্র্যাকার 🕵️‍♂️</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-200 p-2 rounded-full">
                <FontAwesome5 name="times" size={16} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 mb-4">
              {logs.length === 0 ? (
                <Text className="text-center text-gray-500 mt-10">কোনো ব্যাকগ্রাউন্ড লগ পাওয়া যায়নি। অ্যাপ কিল করে নোটিফিকেশন পাঠান।</Text>
              ) : (
                logs.map((log, index) => (
                  <View key={index} className="bg-gray-100 p-3 rounded-lg mb-3 border border-gray-300">
                    <View className="flex-row justify-between mb-1">
                      <Text className="font-bold text-blue-600">{log.step}</Text>
                      <Text className="text-xs text-gray-500">{log.time}</Text>
                    </View>
                    <Text className="text-sm text-gray-700">{log.data}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity onPress={clearLogs} className="bg-red-500 py-3 rounded-xl items-center">
              <Text className="text-white font-bold text-lg">লগ ক্লিয়ার করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}