import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';



const SMART_GUIDE_PROMPT = `
  You are an expert Bangladeshi HSC and SSC Test Paper Digitizer and Formatter.
  Your ONLY job is to extract exact questions, answers, and context from the provided images or raw text and format them into a highly structured JSON array for a "Smart Reading App".

  CRITICAL RULES:
  1. DO NOT invent, hallucinate, or create any new questions. Extract EXACTLY what is in the source.
  2. Fix any OCR typos or spelling mistakes to perfectly readable Bengali text.
  3. Categorize every extracted question into one of these 4 types strictly:
     "mcq" (Multiple Choice Question)
     "জ্ঞানমূলক" (Short answer/Knowledge-based)
     "অনুধাবনমূলক" (Comprehension/Medium answer)
     "সৃজনশীল" (Creative/Board Question with a stem/উদ্দীপক)
  4. ADD A TOPIC: For each question, add a "topic" field indicating the core concept (e.g., "লজিক গেইট", "কোষ বিভাজন"). Keep it short (max 2-3 words).
  5. STRICTLY REMOVE DUPLICATES: If two or more questions test the exact same concept or have highly similar options, keep the best one and SKIP the duplicates. Never include the same concept twice.
  6. If an answer is missing in the source, leave the "answer" field empty.

  JSON OUTPUT FORMAT MUST BE A STRICT ARRAY OF OBJECTS (DO NOT USE MARKDOWN LIKE \`\`\`json):
  [
    {
      "id": 1,
      "type": "জ্ঞানমূলক",
      "topic": "Topic Name",
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

export const processWithGuideEngine = async ({ images = [], rawText = "", onStatusChange }) => {
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
    
    return generatedData;

  } catch (error) {
    throw error;
  }
};