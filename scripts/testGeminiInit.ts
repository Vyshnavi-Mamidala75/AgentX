import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

console.log('API Key present:', !!process.env.GEMINI_API_KEY);
try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });
  console.log('GoogleGenAI initialized successfully');
} catch (e: any) {
  console.error('Error initializing GoogleGenAI:', e.message);
}
