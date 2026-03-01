"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLanguage, Language } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇹🇳' },
];

export function LanguageSelector() {
  const { language, setLanguage, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-mist hover:text-foreground transition-colors hover:bg-white/5"
        style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-heading">{currentLang?.flag}</span>
        <span className="text-sm font-heading hidden sm:block">{currentLang?.label}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-40 rounded-xl overflow-hidden z-50`}
            style={{ background: "rgba(28,35,48,0.95)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                  language === lang.code ? 'text-terra-light' : 'text-stone-mist'
                } ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
                {language === lang.code && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} text-terra-light`}
                  >
                    ✓
                  </motion.span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
