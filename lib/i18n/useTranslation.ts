// lib/i18n/useTranslation.ts
"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

export function useTranslation() {
  const { translate, language, isTranslating } = useLanguage();
  const [cache, setCache] = useState<Record<string, string>>({});

  const translateText = async (text: string): Promise<string> => {
    if (!text || language === 'en') return text;
    
    const cacheKey = `${language}:${text}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }
    
    const translated = await translate(text);
    setCache(prev => ({ ...prev, [cacheKey]: translated }));
    return translated;
  };

  const translateBatch = async (texts: string[]): Promise<string[]> => {
    const results = await Promise.all(texts.map(t => translateText(t)));
    return results;
  };

  return {
    translateText,
    translateBatch,
    isTranslating
  };
}
