// lib/translation/translate.ts
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type Language = 'en' | 'fr' | 'ar';

interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

export async function translateText(
  text: string, 
  targetLang: Language,
  sourceLang?: Language
): Promise<TranslationResult> {
  try {
    if (!text || text.trim() === '') {
      return { translatedText: text };
    }

    console.log(`🌐 Translating to ${targetLang}...`);

    const languageNames = {
      en: 'English',
      fr: 'French',
      ar: 'Arabic'
    };

    const prompt = sourceLang 
      ? `Translate the following text from ${languageNames[sourceLang]} to ${languageNames[targetLang]}. Preserve all formatting, emojis, and special characters. Return ONLY the translated text, no explanations.
      
      Text: "${text}"`
      : `Detect the language of the following text and translate it to ${languageNames[targetLang]}. Preserve all formatting, emojis, and special characters. Return ONLY the translated text, no explanations.
      
      Text: "${text}"`;

    const completion = await openrouter.chat.completions.create({
      model: "arcee-ai/trinity-large-preview:free",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate accurately while preserving meaning, tone, and cultural nuances. Return ONLY the translated text without any additional comments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim() || text;
    
    console.log(`✅ Translation complete: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`);

    return {
      translatedText,
      detectedLanguage: sourceLang,
      confidence: 85
    };

  } catch (error) {
    console.error("❌ Translation error:", error);
    return { translatedText: text };
  }
}

export async function translateBatch(
  texts: string[],
  targetLang: Language,
  sourceLang?: Language
): Promise<string[]> {
  try {
    if (!texts.length) return [];
    
    const batchText = texts.join('\n---SEPARATOR---\n');
    const result = await translateText(batchText, targetLang, sourceLang);
    
    return result.translatedText.split('\n---SEPARATOR---\n').map(t => t.trim());
    
  } catch (error) {
    console.error("❌ Batch translation error:", error);
    return texts;
  }
}
