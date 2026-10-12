import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, ScrollView, Image, Alert, 
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Animated 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function ChallengeIconToGenerate({ visible, onClose, onGenerate }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // টেক্সট ইনপুটের জন্য নতুন স্টেট
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");

  // ডুওলিঙ্গো বাউন্সি অ্যানিমেশন
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(400); // মডাল বন্ধ হলে আবার নিচে চলে যাবে
    }
  }, [visible, slideAnim]);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("পারমিশন প্রয়োজন", "ছবি তোলার জন্য ক্যামেরার পারমিশন দিন।");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      addFile(result.assets[0], 'image');
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("পারমিশন প্রয়োজন", "ছবি সিলেক্ট করার জন্য গ্যালারির পারমিশন দিন।");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      result.assets.forEach(asset => addFile(asset, 'image'));
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        addFile(result.assets[0], 'pdf');
      }
    } catch (error) {
      console.log("Error picking document: ", error);
    }
  };

  // টেক্সট যুক্ত করার ফাংশন
  const handleAddText = () => {
    if (inputText.trim().length < 10) {
      Alert.alert("মনোযোগ দিন", "দয়া করে অন্তত ১০ অক্ষরের কিছু লিখুন বা পেস্ট করুন।");
      return;
    }
    addFile({ uri: 'text', text: inputText, name: 'টেক্সট নোট (পড়াশোনা)' }, 'text');
    setInputText("");
    setIsTextInputVisible(false);
  };

  const addFile = (file, type) => {
    setSelectedFiles(prev => [...prev, { ...file, type, id: Math.random().toString() }]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleGenerate = () => {
    if (selectedFiles.length === 0) {
      Alert.alert("ফাইল আপলোড করুন", "চ্যালেঞ্জ জেনারেট করার জন্য অন্তত একটি ছবি, পিডিএফ বা টেক্সট দিন।");
      return;
    }
    
    setIsGenerating(true);
    
    // ৩ সেকেন্ডের ফেক AI ডিলে (Delay)
    setTimeout(() => {
        const newChallengeCard = {
            id: Math.random().toString(),
            status: 'in_progress', 
            day: 'নতুন লেভেল', 
            subject: 'সাধারণ জ্ঞান', 
            chapter: 'ভাষা আন্দোলন ও মুক্তিযুদ্ধ', 
            target: '৩টি লেভেল • ১৫টি কুইজ', 
            color: '#FF4B4B', 
            darkColor: '#D63939'
        };

        onGenerate(newChallengeCard);

        setIsGenerating(false);
        setSelectedFiles([]);
        setInputText("");
        setIsTextInputVisible(false);
        onClose();
    }, 3000); 
  };

  // ডুওলিঙ্গো স্টাইলের 3D বাটন কম্পোনেন্ট
  const OptionButton = ({ icon, text, color, darkColor, onPress }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} className="flex-1 mx-1">
      <View style={{ backgroundColor: darkColor, borderRadius: 16, paddingBottom: 6 }}>
        <View style={{ backgroundColor: color, borderRadius: 16, paddingTop: 14, paddingBottom: 12, alignItems: 'center' }}>
          <FontAwesome5 name={icon} size={22} color="#FFFFFF" solid />
          <Text className="text-white text-[13px] mt-2 pt-1" style={{ fontFamily: 'BanglaBold' }}>{text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity className="flex-1 w-full" activeOpacity={1} onPress={onClose} disabled={isGenerating} />

        <Animated.View 
          style={{ transform: [{ translateY: slideAnim }] }} 
          className="bg-[#F2F6F9] w-full rounded-t-[32px] px-5 pt-6 pb-8 border-t-4 border-[#E5E5E5]"
        >
          {isGenerating ? (
             <View className="items-center justify-center py-12">
               <View className="bg-white p-6 rounded-full border-2 border-[#E5E5E5] mb-6 shadow-sm">
                 <ActivityIndicator size="large" color="#CE82FF" />
               </View>
               <Text className="text-xl text-[#3C3C3C] text-center" style={{fontFamily: 'BanglaBold'}}>AI তোমার নোটস পড়ছে...</Text>
               <Text className="text-[15px] text-[#7B92A5] text-center mt-3 px-6 leading-6" style={{fontFamily: 'BanglaBold'}}>
                 ম্যাজিকের মতো কুইজ ও লেসন তৈরি হচ্ছে। একটু অপেক্ষা করো!
               </Text>
             </View>
          ) : (
            <>
              <View className="flex-row justify-between items-center mb-4 px-1">
                <View className="flex-row items-center">
                  <View className="bg-[#CE82FF]/20 p-2 rounded-xl mr-3">
                    <FontAwesome5 name="magic" size={16} color="#CE82FF" solid />
                  </View>
                  <Text className="text-xl text-[#3C3C3C] pt-1" style={{ fontFamily: 'BanglaBold' }}>নতুন চ্যালেঞ্জ তৈরি করো</Text>
                </View>
                <TouchableOpacity onPress={onClose} className="bg-[#E5E5E5]/70 p-2.5 rounded-full">
                  <FontAwesome5 name="times" size={16} color="#777777" />
                </TouchableOpacity>
              </View>

              <Text className="text-[14.5px] text-[#7B92A5] mb-5 px-1 leading-6" style={{ fontFamily: 'BanglaBold' }}>
                বইয়ের ছবি, পিডিএফ বা টেক্সট আপলোড করো। AI নিজে থেকেই তোমার জন্য স্মার্ট কুইজ তৈরি করে দেবে!
              </Text>

              {isTextInputVisible ? (
                // টেক্সট ইনপুট সেকশন (Text Mode)
                <View className="mb-6 bg-white p-1 rounded-2xl border-2 border-[#E5E5E5]">
                  <TextInput
                    className="text-[#3C3C3C] p-4 min-h-[120px] text-[15px]"
                    style={{ fontFamily: 'BanglaRegular', textAlignVertical: 'top' }}
                    multiline
                    placeholder="এখানে তোমার পড়ার নোট বা প্যারাগ্রাফ পেস্ট করো..."
                    placeholderTextColor="#AFAFAF"
                    value={inputText}
                    onChangeText={setInputText}
                    autoFocus
                  />
                  <View className="flex-row justify-end p-2 border-t border-[#F0F0F0] space-x-2">
                    <TouchableOpacity onPress={() => setIsTextInputVisible(false)} className="px-4 py-2 rounded-xl bg-[#F0F0F0] mr-2">
                      <Text className="text-[#777777] text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>বাতিল</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAddText} className="px-5 py-2 rounded-xl bg-[#58CC02]">
                      <Text className="text-white text-sm pt-1" style={{ fontFamily: 'BanglaBold' }}>যুক্ত করো</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // 2x2 গ্রিড বাটন সেকশন (Media Mode)
                <View className="mb-6">
                  <View className="flex-row justify-between mb-3">
                    <OptionButton icon="camera" text="ক্যামেরা" color="#58CC02" darkColor="#58A700" onPress={openCamera} />
                    <OptionButton icon="images" text="গ্যালারি" color="#1CB0F6" darkColor="#1899D6" onPress={openGallery} />
                  </View>
                  <View className="flex-row justify-between">
                    <OptionButton icon="file-pdf" text="পিডিএফ" color="#FF9600" darkColor="#D47B00" onPress={openDocumentPicker} />
                    <OptionButton icon="font" text="টেক্সট" color="#CE82FF" darkColor="#A559D6" onPress={() => setIsTextInputVisible(true)} />
                  </View>
                </View>
              )}

              {/* আপলোড করা ফাইল বা টেক্সটের লিস্ট */}
              {selectedFiles.length > 0 && (
                <View className="mb-5 max-h-[160px]">
                  <Text className="text-[15px] text-[#3C3C3C] mb-2 px-1" style={{ fontFamily: 'BanglaBold' }}>সিলেক্ট করা ম্যাটেরিয়াল:</Text>
                  <ScrollView showsVerticalScrollIndicator={false} className="bg-white rounded-2xl p-2 border-2 border-[#E5E5E5]">
                    {selectedFiles.map((item) => (
                      <View key={item.id} className="flex-row items-center justify-between bg-[#F5F5F5] p-2 rounded-xl mb-2 border border-[#E5E5E5]">
                        <View className="flex-row items-center">
                          {item.type === 'image' ? (
                            <Image source={{ uri: item.uri }} className="w-10 h-10 rounded-lg" />
                          ) : item.type === 'pdf' ? (
                            <View className="w-10 h-10 bg-[#FFD7D7] items-center justify-center rounded-lg">
                              <FontAwesome5 name="file-pdf" size={18} color="#FF4B4B" />
                            </View>
                          ) : (
                            <View className="w-10 h-10 bg-[#E8D7FF] items-center justify-center rounded-lg">
                              <FontAwesome5 name="align-left" size={18} color="#A559D6" />
                            </View>
                          )}
                          <Text className="text-[13px] text-[#4B4B4B] ml-3 w-[180px] pt-1" numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: 'BanglaBold' }}>
                            {item.name || item.fileName || "Uploaded File"}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeFile(item.id)} className="p-3 bg-white rounded-lg shadow-sm">
                          <FontAwesome5 name="trash-alt" size={14} color="#FF4B4B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* মাস্টার জেনারেট বাটন */}
              <TouchableOpacity activeOpacity={0.8} onPress={handleGenerate} className="w-full mt-2">
                <View style={{ backgroundColor: selectedFiles.length > 0 ? '#58A700' : '#E5E5E5', borderRadius: 16, paddingBottom: 6 }}>
                  <View style={{ backgroundColor: selectedFiles.length > 0 ? '#58CC02' : '#F0F0F0', borderRadius: 16, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesome5 name="bolt" size={18} color={selectedFiles.length > 0 ? "#FFFFFF" : "#AFAFAF"} solid />
                    <Text className={`ml-2 text-[17px] pt-1 ${selectedFiles.length > 0 ? "text-white" : "text-[#AFAFAF]"}`} style={{ fontFamily: 'BanglaBold' }}>
                      এআই চ্যালেঞ্জ জেনারেট করো
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}