import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { DeviceEventEmitter } from 'react-native';


const SMART_GUIDE_PROMPT = `
  You are an expert Bangladeshi HSC and SSC Test Paper Digitizer and Formatter.
  Your ONLY job is to extract exact questions, answers, and context from the provided images or raw text and format them into a highly structured JSON array for a "Smart Reading App".

  CRITICAL RULES:
  1. DO NOT invent or hallucinate. Extract EXACTLY what is in the source.
  2. Fix any OCR typos to perfectly readable Bengali text.
  3. Categorize strictly into: "mcq", "জ্ঞানমূলক", "অনুধাবনমূলক", "সৃজনশীল".
4. TOPIC GROUPING (CRUCIAL): You MUST categorize all questions into a minimum of 4 and a maximum of 7 broad topics. DO NOT create micro-topics. Merge smaller related concepts. 
  - VERY IMPORTANT: The "topic" name itself MUST be extremely short (Maximum 1 to 3 words). Never use long sentences. Keep it concise (e.g., "লজিক গেইট", "ভারত শাসন").
  5. BOARD TAGGING (CRUCIAL): If a question mentions a board year (e.g., "ঢাকা বোর্ড ২০২৩"), extract it into a "board" field. If NO board is mentioned, set it to "ক্রিয়েটিভ প্রশ্ন".
  6. IMAGE HANDLING (CRUCIAL): If a question, stem, or option contains visual cues like "নিচের চিত্রটি লক্ষ করো", "A, B চিহ্নিত অংশ", or missing diagrams, set "needsImage": true. ALSO, extract the original question number or a short hint (e.g., "৫ নং প্রশ্ন", "চিত্র-২", "উদ্দীপক ১") and set it in the "imageHint" field so the user can easily find it in their source book.
 7. GROUPED MCQs (উদ্দীপক নির্ভর বহুনির্বাচনী): If multiple MCQs share a single passage/stem, you MUST prepend the passage to the 'question' field of EACH related MCQ.
  8. BEAUTIFUL FORMATTING (CRUCIAL): You MUST use Markdown INSIDE the JSON string values (especially in the "answer" and "explanation" fields) to make it highly readable and stress-free.
     - Use **bold** for key concepts, important terms, or highlighting the core focus of a sentence.
     - Use Markdown tables if there is any comparison (পার্থক্য), chart, or structured data.
     - Use bullet points (-) for lists or multi-part answers.
     - Add generous line breaks (\n\n) between paragraphs so it looks clean.
  9. STRICTLY REMOVE DUPLICATES. If an answer is missing, leave the "answer" field empty.

  OUTPUT EXACTLY THIS JSON FORMAT (DO NOT WRAP IN "json" MARKDOWN BLOCKS, BUT DO USE MARKDOWN INSIDE THE TEXT VALUES):
  [
    {
      "id": 1,
   "type": "জ্ঞানমূলক",
      "topic": "Short Topic Name",
      "board": "ঢাকা বোর্ড ২০২৩",
      "needsImage": true,
      "image": "",
      "question": "extracted question text here",
      "answer": "extracted exact answer text here"
    },
    {
      "id": 2,
      "type": "mcq",
      "topic": "Topic Name",
      "question": "extracted question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact correct option text",
      "explanation": "If any explanation is given, put it here, else empty string"
    },
    {
      "id": 3,
      "type": "সৃজনশীল",
      "topic": "Topic Name",
      "stem": "The main passage, paragraph, or context (উদ্দীপক)",
      "questions": [
        {"label": "ক", "question": "...", "answer": "..."},
        {"label": "খ", "question": "...", "answer": "..."}
      ]
    }
  ]
`;


const cleanJSONString = (rawString) => {
  try {
    let cleaned = rawString.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
    cleaned = cleaned.trim();
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    return cleaned;
  } catch (e) {
    return rawString;
  }
};

const validateAndFixGuideData = (dataArray) => {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map((item) => {
    if (!item.id) item.id = Math.floor(Math.random() * 1000000);
    if (!item.type) item.type = "জ্ঞানমূলক";
    return item;
  }).filter(item => item !== null);
};

const readFileAsBase64 = async (uri) => {
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  } catch (error) {
    return null;
  }
};

export const processWithGuideEngine = async ({ images = [], rawText = "", onStatusChange, userData = null, targetSubject = null, existingTopics = [] }) => {
  let geminiKeys = [];

  try {
    // 🚀 ১. সার্ভার থেকে লেটেস্ট Gemini API Keys নিয়ে আসা
    if (onStatusChange) onStatusChange("এপিআই কানেকশন চেক করা হচ্ছে...");
    const res = await fetch(`https://growshelby-api.vercel.app/api/get_settings?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const data = await res.json();
    
    if (data && data.geminiKeys && data.geminiKeys.length > 0) {
      // 🚀 ২. কি-গুলোকে রেন্ডমলি রোটেট (Shuffle) করা হচ্ছে
      geminiKeys = [...data.geminiKeys].sort(() => 0.5 - Math.random());
    }
  } catch (error) {
    console.log("Gemini Keys Fetch Error:", error);
  }

  // 🚀 ৩. যদি সার্ভারে কোনো কি না থাকে
  if (geminiKeys.length === 0) throw new Error("সার্ভারে কোনো Gemini API Key পাওয়া যায়নি। অ্যাডমিন প্যানেল থেকে অ্যাড করুন।");

  try {
    let promptParts = [SMART_GUIDE_PROMPT];
    let hasContent = false;
   let instruction = "Extract EVERYTHING from the following source(s) into the strict JSON array format: \n\n";

   if (existingTopics && existingTopics.length > 0) {
      instruction += `CRITICAL INSTRUCTION: This question bank already has the following topics: [${existingTopics.join(', ')}]. \nYou MUST group the new questions into these EXISTING topics. DO NOT create any new topics unless the question is 100% completely unrelated to the existing ones. Keep the total topic count as low as possible (5-6 average).\n\n`;
    }

    if (rawText && rawText.trim().length > 0) {
      instruction += `[TEXT SOURCE]\n${rawText}\n\n`;
      hasContent = true;
    }
    promptParts.push(instruction);

    if (images && images.length > 0) {
      if (onStatusChange) onStatusChange("Test paper scan kora hocche...");
      hasContent = true;
      for (const img of images) {
        const base64Data = await readFileAsBase64(img.uri);
        if (base64Data) {
          const mimeType = img.uri.endsWith('.png') ? "image/png" : (img.mimeType || "image/jpeg");
          promptParts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
        }
      }
    }

    if (!hasContent) throw new Error("No input provided.");
    if (onStatusChange) onStatusChange("Proshno o uttor alada kora hocche...");
    
 // 🚀 ফিক্স: গুগলের ফ্রি টায়ারের সব ফাস্ট মডেল স্পিড অনুযায়ী সাজানো হলো
    const FALLBACK_MODELS = [
      "gemini-3.8-flash",       
      "gemini-3.5-flash-lite",  
      "gemini-3.6-flash",       
      "gemini-3.5-flash",       
      "gemini-2.5-flash"        
    ]; 
    let generatedData = null;
    let lastErrorDetails = "অজানা কোনো সমস্যা হচ্ছে!";

    // 🚀 স্মার্ট টাইমআউট: ২৫ সেকেন্ডের বেশি লাগলে অটো স্কিপ করে পরের ফাস্ট মডেলে যাবে
    const fetchWithTimeout = (promise, ms = 25000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_ERROR")), ms))
      ]);
    };

    for (const apiKey of geminiKeys) {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      for (const modelName of FALLBACK_MODELS) {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.1 }});
        
        try {
          // 🚀 ২৫ সেকেন্ডের টাইমআউট দিয়ে এপিআই কল করা হচ্ছে
          const result = await fetchWithTimeout(model.generateContent(promptParts), 25000);
          const response = await result.response;
          
          const safeJsonText = cleanJSONString(response.text());
          
          try {
            let parsedData = JSON.parse(safeJsonText);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              parsedData = validateAndFixGuideData(parsedData);
              generatedData = parsedData;
              break; // 🚀 JSON পারফেক্ট হলে মডেল লুপ ভাঙবে
            } else {
              lastErrorDetails = `JSON Format Error in ${modelName}.`;
            }
          } catch (jsonError) {
            lastErrorDetails = `JSON Parse Error in ${modelName}.`;
          }

        } catch (error) {
           // 🚀 মডেল 503 ওভারলোডেড বা এরর হলে এই লুপের পরের মডেলে ট্রাই করবে
           lastErrorDetails = `API Error [Model: ${modelName}] [Key: ${apiKey.substring(0, 6)}...]: ${error.message}`; 
           console.log(`[AiGuideEngine] Skipping Model/Key... Reason:`, error.message);
           continue; 
        }
      }
      if (generatedData) break; // 🚀 ডেটা পেয়ে গেলে API Key লুপও ভেঙে যাবে
    }

  if (!generatedData) {
      throw new Error(`DETAILED ERROR:\n${lastErrorDetails}`);
    }
    
  // 🚀 অটো-পাবলিশ এবং নোটিফিকেশন লজিক শুরু
    // 🚀 ফিক্স: যদি এটি কোশ্চেন ব্যাংক হয় (targetSubject থাকে), তবে এখানে অটো-পাবলিশ হবে না
    if (userData && !targetSubject) {
      try {
        const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const guideTitle = `স্মার্ট গাইড - ${new Date().toLocaleDateString('bn-BD')}`;
        const coverImage = 'https://images.unsplash.com/photo-1512820200502-9ed146a8960c?q=80&w=1000'; // ডিফল্ট কভার
        
        const newGuideData = {
          id: 'guide_' + Date.now(),
          shareCode: shareCode,
          notebookName: guideTitle,
          description: "এআই দ্বারা স্বয়ংক্রিয়ভাবে তৈরি করা স্মার্ট গাইড।",
          target: userData.niche || "সাধারণ শিক্ষার্থী",
          questionCount: generatedData.length, 
          isPublic: true,
          thumbnail: coverImage,
          creatorName: userData.name, 
          creatorAvatar: userData.avatar,
          creatorEmail: userData.email,
          channelId: userData.email,
          banner: userData.banner,    
          bio: userData.bio,          
          views: 0,
          failedItems: generatedData
        };

        // 1. লোকাল স্টোরেজে সেভ করা (যাতে সাথে সাথে লাইব্রেরিতে দেখায়)
        const cachedSquads = await AsyncStorage.getItem(`@shelby_guides_${userData.email}`);
        let parsedSquads = cachedSquads ? JSON.parse(cachedSquads) : [];
        parsedSquads = [newGuideData, ...parsedSquads];
        await AsyncStorage.setItem(`@shelby_guides_${userData.email}`, JSON.stringify(parsedSquads));

        // 2. ব্যাকএন্ডে সেভ করা
        fetch('https://growshelby-api.vercel.app/api/update_coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EXPO_PUBLIC_API_KEY },
          body: JSON.stringify({ action: 'save_guide', guideData: newGuideData })
        });
        
        // 3. রিয়েল-টাইম রিফ্রেশ ইভেন্ট ফায়ার করা (যাতে অন্য স্ক্রিন আপডেট হয়)
        DeviceEventEmitter.emit('refresh_library');

    // 4. Notifee দিয়ে লোকাল নোটিফিকেশন ফায়ার করা (যেহেতু Expo banner অফ করা আছে)
        const channelId = await notifee.createChannel({
          id: 'smart_guide_alerts',
          name: 'Guide Auto Publish',
          importance: AndroidImportance.HIGH,
          vibration: true,
        });

        await notifee.displayNotification({
          title: "🎉 তোমার গাইড রেডি!",
          body: `এআই তোমার জন্য ${generatedData.length} টি প্রশ্ন দিয়ে নতুন গাইডটি তৈরি করেছে। ট্যাপ করে দেখে নাও।`,
          data: { 
            type: 'reader',
            guideId: String(shareCode),
            channelId: String(userData.email),
            autoOpenReader: "true" // Notifee তে ডাটা ভ্যালু স্ট্রিং হিসেবে পাঠাতে হয়
          },
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            smallIcon: 'notification_icon', // তোমার ডিফল্ট আইকন
            color: '#1CB0F6',
            pressAction: { id: 'default', launchActivity: 'default' },
          },
        });

      } catch (err) {
        console.log("Auto-Publish Error:", err);
      }
    }
    // 🚀 অটো-পাবলিশ লজিক শেষ

    return generatedData;

  } catch (error) {
    throw error;
  }
};