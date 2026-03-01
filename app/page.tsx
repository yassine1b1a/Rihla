"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, Brain, Compass, Leaf, Camera, Sparkles,
  ArrowRight, Star, ChevronDown, Wind, Landmark,
  Globe, Users, TreePine,
} from "lucide-react";
import { DESTINATIONS } from "@/lib/data/destinations";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/* ─── Animated background: geometric zellige tiles ─── */
function ZelligeBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Radial atmosphere */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 90% 50% at 50% -10%, rgba(200,75,49,0.15) 0%, transparent 60%)",
      }} />
      {/* Subtle geometric pattern */}
      <div className="absolute inset-0 zellige-bg opacity-100" />
      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 120% 100% at 50% 100%, rgba(15,20,25,0.8) 0%, transparent 60%)",
      }} />
    </div>
  );
}

/* ─── Floating destination cards in hero ─── */
function FloatingCard({ dest, delay, x, y }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [y, y - 8, y] }}
      transition={{ opacity: { delay, duration: 0.6 }, y: { delay, duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" } }}
      className="absolute hidden lg:block card-glass rounded-xl p-3 w-44"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-3 h-3 text-terra-light flex-shrink-0" />
        <span className="text-xs font-heading font-semibold text-foreground truncate">{dest.name}</span>
      </div>
      <div className="text-xs text-stone-mist">{dest.country}</div>
      <div className="flex items-center gap-1 mt-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-2.5 h-2.5" fill={i < 4 ? "#C84B31" : "none"} stroke="#C84B31" strokeWidth={1.5} />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Feature card ─── */
/* ─── Feature card avec t en prop ─── */
function FeatureCard({ icon: Icon, title, desc, color, href, delay, t }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ y: -4, borderColor: `${color}50` }}
          className="group p-6 rounded-2xl card-glass border border-white/5 cursor-pointer h-full transition-all duration-300"
          style={{ "--hover-color": color } as any}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{title}</h3>
          <p className="text-sm text-stone-mist leading-relaxed">{desc}</p>
          <div className="flex items-center gap-2 mt-4 text-xs font-heading font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color }}>
            {t('features.explore')} <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── Destination card ─── */
function DestCard({ dest, index }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ height: index % 3 === 0 ? "320px" : "260px" }}
    >
      {/* Image bg via gradient (no Next/Image needed for demo) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night-DEFAULT"
        style={{ zIndex: 1 }} />
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${
            dest.type === "desert" ? "#C84B31, #9A3420" :
            dest.type === "coastal" ? "#1A7A6E, #105248" :
            dest.type === "historical" ? "#4A4033, #252F3F" :
            "#1C2330, #0F1419"
          })`,
        }}
      />
      {/* Zellige overlay */}
      <div className="absolute inset-0 zellige-bg opacity-30" style={{ zIndex: 1 }} />

      <div className="absolute inset-0 p-5 flex flex-col justify-end" style={{ zIndex: 2 }}>
        {dest.unesco && (
          <span className="self-start mb-2 text-xs px-2 py-0.5 rounded-full font-mono font-medium"
            style={{ background: "rgba(232,201,138,0.2)", color: "#E8C98A", border: "1px solid rgba(232,201,138,0.3)" }}>
            UNESCO
          </span>
        )}
        <h3 className="font-display text-2xl text-foreground leading-tight">{dest.name}</h3>
        {dest.name_ar && (
          <span className="text-arabic text-sm text-sand-DEFAULT opacity-70 mt-0.5">{dest.name_ar}</span>
        )}
        <p className="text-xs text-stone-mist mt-1.5 line-clamp-2 leading-relaxed">{dest.short_desc}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-mist">
            <MapPin className="w-3 h-3" />
            {dest.country}
          </div>
          <div className="flex items-center gap-1">
            <TreePine className="w-3 h-3 text-teal-light" />
            <span className="text-xs text-teal-light font-mono">{dest.sustainability_score}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Stats counter ─── */
function Stat({ value, label, icon: Icon }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center p-6"
    >
      <Icon className="w-5 h-5 text-terra-DEFAULT mx-auto mb-2" />
      <div className="font-display text-4xl text-terra-gradient mb-1">{value}</div>
      <div className="text-sm text-stone-mist font-heading">{label}</div>
    </motion.div>
  );
}

export default function HomePage() {
  const { t, dir } = useLanguage();
  
  console.log("🏠 HomePage rendering started");
  
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOp = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const [mounted, setMounted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  console.log("🏠 Hooks initialized:", {
    hasHeroRef: !!heroRef.current,
    scrollYProgress: !!scrollYProgress,
    mounted,
    apiError
  });

  useEffect(() => {
    console.log("🏠 Component mounted at:", new Date().toISOString());
    setMounted(true);
    
    const checkForApiCalls = () => {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';
        console.log("🌐 Fetch detected:", url);
        
        if (url.includes('/api/ai/itinerary')) {
          console.warn("⚠️ Unexpected API call to /api/ai/itinerary detected on homepage!");
          console.log("Request details:", args[1]);
          setApiError(`Unexpected API call to ${url}`);
        }
        
        try {
          const response = await originalFetch.apply(window, args);
          console.log("🌐 Fetch response:", response.status, response.statusText);
          return response;
        } catch (error) {
          console.error("🌐 Fetch error:", error);
          throw error;
        }
      };

      return () => {
        window.fetch = originalFetch;
      };
    };

    const cleanup = checkForApiCalls();
    return cleanup;
  }, []);

  try {
    console.log("🏠 Rendering with mounted =", mounted);
    
    if (!mounted) {
      console.log("🏠 Not mounted yet, returning null");
      return null;
    }

    const features = [
      { icon: Compass, title: t('features.itinerary'), desc: t('features.itinerary.desc'), color: "#C84B31", href: "/itinerary" },
      { icon: Brain, title: t('features.guide'), desc: t('features.guide.desc'), color: "#E8C98A", href: "/explore" },
      { icon: Camera, title: t('features.heritage'), desc: t('features.heritage.desc'), color: "#1A7A6E", href: "/heritage" },
      { icon: Leaf, title: t('features.sustainability'), desc: t('features.sustainability.desc'), color: "#4ADE80", href: "/sustainability" },
    ];

    const floatingDests = [
      { ...DESTINATIONS[0], x: 72, y: 15, delay: 1.2 },
      { ...DESTINATIONS[2], x: 8,  y: 35, delay: 1.5 },
      { ...DESTINATIONS[4], x: 78, y: 55, delay: 1.8 },
    ];

    console.log("🏠 Data loaded:", {
      featuresCount: features.length,
      destinationsCount: DESTINATIONS?.length || 0,
      floatingDestsCount: floatingDests.length
    });

    return (
      <main className="relative min-h-screen bg-[#0F1419] overflow-x-hidden" dir={dir}>
        <ZelligeBg />
        <Navbar />

        {/* Show API error if detected */}
        {apiError && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
            ⚠️ Debug: {apiError}
          </div>
        )}

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-16">
          {/* Floating destination cards */}
          {floatingDests.map((d, i) => (
            <FloatingCard key={d.id} dest={d} delay={d.delay} x={d.x} y={d.y} />
          ))}

          <motion.div style={{ y: heroY, opacity: heroOp }} className="text-center max-w-5xl mx-auto">
            {/* Arabic calligraphy badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full mb-8 card-glass border border-white/10"
            >
              <span className="text-arabic text-lg text-sand-DEFAULT" style={{ lineHeight: 1.4 }}>رحلة</span>
              <span className="w-px h-4 bg-white/20" />
              <span className="text-xs font-heading font-medium text-stone-mist tracking-widest uppercase">
                {t('hero.subtitle')}
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-display text-[clamp(3.5rem,12vw,9rem)] leading-[0.9] tracking-tight mb-6"
            >
              <span className="block text-foreground">{t('hero.title')}</span>
              <span className="block text-terra-gradient">Tunisia</span>
              <span className="block text-foreground opacity-80 text-[0.7em]">&amp; Beyond</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-stone-mist text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-light"
            >
              {t('hero.description')}
            </motion.p>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/itinerary">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-terra px-8 py-4 rounded-xl text-base flex items-center gap-2 shadow-lg"
                  style={{ boxShadow: "0 8px 32px rgba(200,75,49,0.35)" }}
                  onClick={() => console.log("🏠 Clicked: Plan My Journey")}
                >
                  <Sparkles className="w-5 h-5" />
                  {t('hero.cta1')}
                </motion.button>
              </Link>
              <Link href="/explore">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-outline px-8 py-4 rounded-xl text-base flex items-center gap-2"
                  onClick={() => console.log("🏠 Clicked: Talk to AI Guide")}
                >
                  <Brain className="w-5 h-5" />
                  {t('hero.cta2')}
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-stone-mist"
            >
              {[
                t('stats.destinations'),
                t('stats.unesco'),
                t('stats.sustainable'),
                t('stats.languages')
              ].map((text) => (
                <div key={text} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-terra-DEFAULT" />
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-stone-mist font-mono tracking-widest uppercase">{t('hero.explore')}</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="w-5 h-5 text-terra-DEFAULT" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-28 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs font-mono tracking-widest text-terra-DEFAULT uppercase mb-3">{t('features.powered')}</p>
              <h2 className="font-display text-5xl md:text-6xl text-foreground mb-4">
                {t('features.title')} <span className="text-terra-gradient">{t('features.subtitle')}</span>
              </h2>
              <p className="text-stone-mist text-lg max-w-xl mx-auto">
                {t('features.description')}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f, i) => (
                <FeatureCard key={f.title} {...f} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── DESTINATIONS MASONRY ─────────────────────────────────────────── */}
        <section className="relative z-10 py-16 px-4">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(26,122,110,0.06), transparent)" }}
          />
          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <p className="text-xs font-mono tracking-widest text-teal-light uppercase mb-2">{t('destinations.featured')}</p>
                <h2 className="font-display text-5xl md:text-6xl">
                  <span className="text-foreground">{t('destinations.places')}</span>{" "}
                  <span className="text-teal-gradient">{t('destinations.endure')}</span>
                </h2>
              </div>
              <Link href="/explore">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  className="btn-outline px-5 py-2.5 rounded-xl text-sm hidden md:flex items-center gap-2"
                >
                  {t('destinations.viewAll')} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DESTINATIONS.slice(0, 8).map((d, i) => (
                <DestCard key={d.id} dest={d} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-20 px-4 border-y border-white/5">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
            <Stat value="10+" label={t('stats.destinations')} icon={MapPin} />
            <Stat value="4"   label={t('stats.unesco')} icon={Landmark} />
            <Stat value="AI"  label={t('stats.insights')} icon={Sparkles} />
            <Stat value="3"   label={t('stats.languages')} icon={Globe} />
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section className="relative z-10 py-28 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs font-mono tracking-widest text-terra-DEFAULT uppercase mb-3">{t('how.simple')}</p>
              <h2 className="font-display text-5xl md:text-6xl text-foreground">
                {t('how.yourJourney')}, <span className="text-terra-gradient">{t('how.reimagined')}</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: "01", title: t('how.step1.title'), desc: t('how.step1.desc'), icon: Sparkles },
                { n: "02", title: t('how.step2.title'), desc: t('how.step2.desc'), icon: Brain },
                { n: "03", title: t('how.step3.title'), desc: t('how.step3.desc'), icon: Compass },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative"
                >
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px -translate-x-8"
                      style={{ background: "linear-gradient(to right, rgba(200,75,49,0.4), transparent)" }} />
                  )}
                  <div className="font-display text-6xl text-terra-DEFAULT opacity-20 mb-4 leading-none">{step.n}</div>
                  <step.icon className="w-6 h-6 text-terra-light mb-3" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{step.title}</h3>
                  <p className="text-stone-mist text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-3xl overflow-hidden text-center"
              style={{
                background: "linear-gradient(135deg, rgba(200,75,49,0.15) 0%, rgba(26,122,110,0.12) 100%)",
                border: "1px solid rgba(200,75,49,0.2)",
              }}
            >
              {/* Decorative arch */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-terra" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(200,75,49,0.15), transparent)" }} />

              <div className="relative z-10">
                <div className="text-arabic text-4xl text-sand-DEFAULT mb-2" style={{ lineHeight: 1.6 }}>أهلاً وسهلاً</div>
                <p className="text-xs text-stone-mist font-mono mb-6">{t('cta.welcome')} — Marhaba</p>
                <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
                  {t('cta.begin')} <span className="text-terra-gradient">Rihla</span> {t('cta.today')}
                </h2>
                <p className="text-stone-mist max-w-xl mx-auto mb-8 leading-relaxed">
                  {t('cta.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      className="btn-terra px-8 py-4 rounded-xl flex items-center gap-2"
                      style={{ boxShadow: "0 8px 32px rgba(200,75,49,0.3)" }}
                    >
                      <Users className="w-5 h-5" /> {t('cta.createAccount')}
                    </motion.button>
                  </Link>
                  <Link href="/itinerary">
                    <motion.button whileHover={{ scale: 1.03 }} className="btn-outline px-8 py-4 rounded-xl flex items-center gap-2">
                      <Wind className="w-5 h-5" /> {t('cta.tryWithout')}
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="relative z-10 border-t py-12 px-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
              <div>
                <div className="font-display text-3xl text-terra-gradient mb-1">Rihla</div>
                <div className="text-arabic text-lg text-sand-DEFAULT opacity-60 mb-2">رحلة</div>
                <p className="text-stone-mist text-sm max-w-xs">
                  {t('footer.description')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <div className="text-foreground font-heading font-semibold mb-3">{t('footer.explore')}</div>
                  {[
                    [t('features.itinerary'), "/itinerary"],
                    [t('features.guide'), "/explore"],
                    [t('features.heritage'), "/heritage"],
                    [t('features.sustainability'), "/sustainability"]
                  ].map(([l, h]) => (
                    <Link key={l as string} href={h as string}>
                      <div className="text-stone-mist hover:text-terra-light transition-colors py-1 cursor-pointer">{l}</div>
                    </Link>
                  ))}
                </div>
                <div>
                  <div className="text-foreground font-heading font-semibold mb-3">{t('footer.platform')}</div>
                  {[
                    [t('nav.signin'), "/auth"],
                    [t('nav.dashboard'), "/dashboard"],
                    [t('footer.about'), "#"],
                  ].map(([l, h]) => (
                    <Link key={l as string} href={h as string}>
                      <div className="text-stone-mist hover:text-terra-light transition-colors py-1 cursor-pointer">{l}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-stone-mist font-mono"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span>© 2026 Rihla — {t('footer.rights')}</span>
              <span>Tunisia · Morocco · Algeria · Egypt · Jordan</span>
            </div>
          </div>
        </footer>
      </main>
    );
  } catch (error) {
    console.error("🔥 Critical error in HomePage render:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1419] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-display mb-4">{t('error.title')}</h1>
          <p className="text-stone-mist">{t('error.description')}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 btn-terra px-6 py-2 rounded-lg"
          >
            {t('error.reload')}
          </button>
        </div>
      </div>
    );
  }
}
