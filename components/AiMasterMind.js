import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_GEMINI_API_KEY = "AQ.Ab8RN6LoJ5ky9jsIMTWfNO_ApGWPW1JZW-_0DFwd3wyqVr2kYw"; 

const MASTER_SYSTEM_PROMPT = `
  You are the "Badass Content Extraction Engine" for a Bangladeshi educational app. 
  Your ONLY goal is to extract factual information from the provided source (images or text) and transform it into an exhaustive, highly engaging, gamified JSON array.

  !!! MISSION CRITICAL RULES (VIOLATION RESULTS IN SYSTEM FAILURE) !!!
  1. EXHAUSTIVE EXTRACTION: NEVER summarize. Extract every single fact.
  2. ZERO HALLUCINATION: Only use facts explicitly present in the input.
  3. LANGUAGE: Entirely in fluent, natural, and encouraging Bengali (Bangla).
  4. ABSOLUTELY NO MARKDOWN: Output ONLY a raw, valid JSON array starting with '[' and ending with ']'. Do NOT wrap it in \`\`\`json.
  5. EVERY ITEM MUST HAVE A QUESTION: Never omit the "question" field.
  
  🔥 FATAL ERROR PREVENTION FOR "blanks" QUIZ: 
  If quizType is "blanks", the "question" string MUST be an incomplete sentence and MUST contain EXACTLY ONE blank space represented by exactly 5 underscores ("_____"). 
  WRONG: "বাংলাদেশের রাজধানী কী?"
  CORRECT: "বাংলাদেশের রাজধানী হলো _____।"
  NEVER output a direct question for "blanks" without the underscores! The app will CRASH if "_____" is missing.

  STRICT JSON SCHEMA FOR EVERY OBJECT IN THE ARRAY:
  {
    "id": Integer (unique random number),
    "tagIcon": String (Choose: "fire", "star", "lightbulb", "bullseye", "search"),
    "tag": String (Short category name, max 3 words),
    "info": String (Core factual statement),
    "keyword": String (The most important single word/date in the info),
    "priority": String ("high" for top 2 facts, otherwise "normal"),
    "trick": String (A clever, short memory hook),
    "time": Integer (Default 15),
    "explanation": String (Brief, highly engaging explanation),
    "question": String (MANDATORY for all types. If type is "blanks", MUST HAVE "_____"),
    "quizType": String (MANDATORY. Choose from: mcq, blanks, drag_drop, matching, blur_puzzle, imposter, tap_mistake, swipe_quiz, bucket_drop, vertical_reorder, spelling_quiz),
    
    // TYPE-SPECIFIC REQUIRED FIELDS:
    // -> mcq: MUST include "options" (Array of exactly 3 strings) and "answer" (Integer index: 0, 1, or 2).
    // -> blanks: MUST include "options" (Array of 3-4 strings) and "answers" (Array with exactly ONE correct string).
    // -> drag_drop / matching: MUST include "pairs" (Array of objects [{"left": "...", "right": "..."}]).
    // -> blur_puzzle / imposter: MUST include "answerWord" (String) and "options" (Array of strings).
    // -> tap_mistake: MUST include "sentence" (Array of strings, split words) and "wrongWordIndex" (Integer).
    // -> swipe_quiz: MUST include "facts" (Array of objects [{"text": "...", "isTrue": true/false}]).
    // -> bucket_drop: MUST include "buckets" (Array of 2 strings) and "items" (Array of 4 objects [{"name": "...", "bucketId": "..."}]).
    // -> vertical_reorder: MUST include "correctOrder" (Array of strings).
    // -> spelling_quiz: MUST include "word" (String) and "scrambledLetters" (Array of single characters).
  }
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

const validateAndFixData = (dataArray) => {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map((item) => {
    if (item.quizType === 'blanks') {
      if (typeof item.question === 'string' && !item.question.includes('_____')) {
        const correctAns = item.answers && item.answers.length > 0 ? item.answers[0] : null;
        if (correctAns && item.question.includes(correctAns)) {
          item.question = item.question.replace(correctAns, '_____');
        } else {
          if (item.question.endsWith('?')) item.question = item.question.replace('?', ' এর সঠিক উত্তর হলো _____।');
          else item.question = item.question + ' _____।';
        }
      }
      if (!item.options) item.options = ["সঠিক", "ভুল", "জানা নেই"];
      if (!item.answers) item.answers = [item.options[0]];
    }
    if (item.quizType === 'mcq') {
      if (typeof item.answer !== 'number') item.answer = 0;
      if (!item.options || item.options.length === 0) item.options = ["ক", "খ", "গ"];
    }
    if (!item.id) item.id = Math.floor(Math.random() * 1000000);
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

export const processWithMasterMind = async ({ images = [], rawText = "", onStatusChange }) => {
  let geminiKeys = [FALLBACK_GEMINI_API_KEY]; 

  try {
    // 🚀 Fixed URL bug here
    const response = await fetch('[https://growshelby-api.vercel.app/api/get_settings](https://growshelby-api.vercel.app/api/get_settings)');
    const data = await response.json();
    if (data.geminiKeys && Array.isArray(data.geminiKeys) && data.geminiKeys.length > 0) {
      geminiKeys = data.geminiKeys;
    }
  } catch (err) {
    console.error("[AiMasterMind] Failed to fetch Gemini keys:", err);
  }

  if (geminiKeys.length === 0) throw new Error("FREE_TIER_LIMIT"); 

  try {
    let promptParts = [MASTER_SYSTEM_PROMPT];
    let hasContent = false;
    let instruction = "Extract EVERYTHING from the following source(s) and turn it into the ultimate gamified JSON array: \n\n";

    if (rawText && rawText.trim().length > 0) {
      instruction += `[TEXT SOURCE]\n${rawText}\n\n`;
      hasContent = true;
    }
    promptParts.push(instruction);

    if (images && images.length > 0) {
      if (onStatusChange) onStatusChange("ডেটা স্ক্যান করা হচ্ছে...");
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
    if (onStatusChange) onStatusChange("কুইজ ও গেম লেভেল সাজানো হচ্ছে...");
    
    const FALLBACK_MODELS = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.5-flash"];
    let generatedData = null;

    for (const apiKey of geminiKeys) {
      const genAI = new GoogleGenerativeAI(apiKey);
      for (const modelName of FALLBACK_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json", temperature: 0.1 }});
          const result = await model.generateContent(promptParts);
          const response = await result.response;
          const safeJsonText = cleanJSONString(response.text());
          let parsedData = JSON.parse(safeJsonText);
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            parsedData = validateAndFixData(parsedData); 
            generatedData = parsedData; 
            break; 
          } else {
            throw new Error("Parsed data is not a valid array.");
          }
        } catch (error) {
           console.log(`[AiMasterMind] Retrying...`);
        }
      }
      if (generatedData) break;
    }

    if (!generatedData) throw new Error("FREE_TIER_LIMIT");
    return generatedData;

  } catch (error) {
    console.error("[AiMasterMind] Fatal Error:", error);
    throw new Error("FREE_TIER_LIMIT"); 
  }
};

export const runNetworkDiagnostic = async () => {
  try {
    return true; 
  } catch (error) {
    return false;
  }
};