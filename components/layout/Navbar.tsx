"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Compass, Menu, X, LogIn, User, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage, type Language } from "@/lib/i18n/LanguageContext";

const LINKS = [
  { href: "/itinerary",     key: "nav.itinerary" },
  { href: "/explore",       key: "nav.explore" },
  { href: "/heritage",      key: "nav.heritage" },
  { href: "/sustainability", key: "nav.sustainability" },
];

// Sélecteur de langue intégré
function LanguageSelector({ dir }: { dir: 'ltr' | 'rtl' }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳' },
  ];

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
                // ✅ Correction: lang.code est déjà du type Language
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
    </div>
  );
}

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { scrollY } = useScroll();
  const bgOp = useTransform(scrollY, [0, 60], [0, 1]);
  const { t, dir } = useLanguage();

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: l } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => l?.subscription.unsubscribe();
  }, []);

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <>
      <motion.header className="fixed top-0 inset-x-0 z-50" dir={dir}>
        <motion.div
          className="absolute inset-0 border-b"
          style={{
            opacity: bgOp,
            background: "rgba(15,20,25,0.92)",
            backdropFilter: "blur(24px)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        />
        <nav className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display text-xl leading-none text-terra-gradient">Rihla</div>
                <div className="text-arabic text-xs text-sand-dark opacity-60 leading-none">رحلة</div>
              </div>
            </motion.div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            {LINKS.map(({ href, key }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}>
                  <motion.div
                    whileHover={{ color: "#E8694A" }}
                    className="px-4 py-2 rounded-lg text-sm font-heading font-medium relative transition-colors"
                    style={{ color: active ? "#C84B31" : "#7A6E62" }}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: "rgba(200,75,49,0.1)", border: "1px solid rgba(200,75,49,0.2)" }}
                      />
                    )}
                    <span className="relative z-10">{t(key)}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right side: Language + Auth */}
          <div className="hidden md:flex items-center gap-3" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            {/* Language Selector */}
            <LanguageSelector dir={dir} />

            {/* Auth buttons */}
            {user ? (
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-semibold btn-terra"
                  style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}
                >
                  <User className="w-4 h-4" /> {t('nav.dashboard')}
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <motion.button whileHover={{ scale: 1.03 }} className="btn-outline px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                    <LogIn className="w-4 h-4" /> {t('nav.signin')}
                  </motion.button>
                </Link>
                <Link href="/auth?mode=signup">
                  <motion.button whileHover={{ scale: 1.03 }} className="btn-terra px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                    {t('nav.signup')}
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Language + Burger */}
          <div className="flex md:hidden items-center gap-2" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            <LanguageSelector dir={dir} />
            <button className="text-stone-mist hover:text-foreground transition-colors" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 top-16 z-40 border-b p-4"
          style={{ background: "rgba(15,20,25,0.97)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.06)" }}
          dir={dir}
        >
          {LINKS.map(({ href, key }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <motion.div
                whileHover={{ x: dir === 'rtl' ? -4 : 4 }}
                className="px-4 py-3 rounded-lg text-sm font-heading font-medium text-stone-mist hover:text-terra-light transition-colors"
              >
                {t(key)}
              </motion.div>
            </Link>
          ))}
          
          {/* Mobile auth */}
          {user ? (
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <motion.div
                whileHover={{ x: dir === 'rtl' ? -4 : 4 }}
                className="mt-2 px-4 py-3 rounded-lg text-sm font-heading font-bold btn-terra text-center"
              >
                {t('nav.dashboard')}
              </motion.div>
            </Link>
          ) : (
            <>
              <Link href="/auth" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: dir === 'rtl' ? -4 : 4 }}
                  className="mt-2 px-4 py-3 rounded-lg text-sm font-heading font-medium btn-outline text-center"
                >
                  {t('nav.signin')}
                </motion.div>
              </Link>
              <Link href="/auth?mode=signup" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: dir === 'rtl' ? -4 : 4 }}
                  className="mt-2 px-4 py-3 rounded-lg text-sm font-heading font-bold btn-terra text-center"
                >
                  {t('nav.signup')}
                </motion.div>
              </Link>
            </>
          )}
        </motion.div>
      )}
    </>
  );
}
