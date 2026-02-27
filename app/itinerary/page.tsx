"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Sparkles, ChevronRight, ChevronLeft, MapPin, Clock, Leaf, Star, 
  Download, Share2, RefreshCw, Sun, Utensils, BedDouble, Info,
  AlertCircle, CheckCircle, XCircle, Loader2
} from "lucide-react";
import { COUNTRIES, TRAVEL_INTERESTS } from "@/lib/data/destinations";
import { Navbar } from "@/components/layout/Navbar";
import type { Itinerary, ItineraryDay, Destination } from "@/types";

// Styles and budgets (unchanged)
const STYLES = [
  { id: "cultural",   label: "Cultural",   emoji: "🏛️", desc: "History, art & local life" },
  { id: "adventure",  label: "Adventure",  emoji: "🏔️", desc: "Hiking, desert & outdoors" },
  { id: "relaxation", label: "Relaxation", emoji: "🌊", desc: "Beaches, hammam & slow pace" },
  { id: "family",     label: "Family",     emoji: "👨‍👩‍👧", desc: "Kid-friendly with variety" },
  { id: "luxury",     label: "Luxury",     emoji: "✨", desc: "Premium stays & experiences" },
  { id: "budget",     label: "Budget",     emoji: "🎒", desc: "Maximum value, local style" },
];

const BUDGETS = [
  { id: "budget",     label: "Budget", sub: "< $50/day" },
  { id: "mid-range",  label: "Mid-range", sub: "$50–150/day" },
  { id: "luxury",     label: "Luxury", sub: "$150+/day" },
];

// DayCard component (unchanged from your working version)
function DayCard({ day, isOpen, onToggle }: { day: ItineraryDay; isOpen: boolean; onToggle: () => void }) {
  // Safely access day properties with defaults
  const dayNumber = day?.day || 0;
  const dayTitle = day?.title || "Day " + dayNumber;
  const dayTheme = day?.theme || "Exploration";
  const destinations = Array.isArray(day?.destinations) ? day.destinations : [];
  const dayTips = day?.tips || "";
  const accommodation = day?.accommodation || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-white/6"
      style={{ background: "rgba(28,35,48,0.6)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(200,75,49,0.2), rgba(200,75,49,0.08))", border: "1px solid rgba(200,75,49,0.25)" }}>
            <span className="text-terra-light text-sm font-heading font-bold">{dayNumber}</span>
          </div>
          <div>
            <div className="font-heading font-semibold text-foreground">{dayTitle}</div>
            <div className="text-xs text-stone-mist mt-0.5">{dayTheme}</div>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-5 h-5 text-stone-mist" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
              {/* Stops */}
              {destinations.length > 0 ? (
                destinations.map((stop, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#C84B31" }} />
                      {i < destinations.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(200,75,49,0.2)" }} />}
                    </div>
                    <div className="pb-3">
                      <div className="font-heading font-medium text-foreground text-sm">{stop.name || "Unnamed location"}</div>
                      <div className="text-xs text-stone-mist mt-0.5 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {stop.duration_hours || 1}h — {stop.activity || "Visit"}
                      </div>
                      {stop.notes && <div className="text-xs text-stone-light mt-1 opacity-70">{stop.notes}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-stone-mist italic">No destinations specified for this day.</div>
              )}

              {/* Tip & accommodation */}
              {dayTips && (
                <div className="flex gap-2 p-3 rounded-lg mt-2"
                  style={{ background: "rgba(232,201,138,0.07)", border: "1px solid rgba(232,201,138,0.15)" }}>
                  <Info className="w-4 h-4 text-sand-DEFAULT flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-sand-dark leading-relaxed">{dayTips}</p>
                </div>
              )}
              {accommodation && (
                <div className="flex items-center gap-2 text-xs text-stone-mist">
                  <BedDouble className="w-3.5 h-3.5 text-teal-light" /> {accommodation}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-white/5 rounded mb-4"></div>
          <div className="h-12 w-96 bg-white/5 rounded mb-6"></div>
          <div className="flex gap-4 mb-8">
            <div className="h-6 w-24 bg-white/5 rounded"></div>
            <div className="h-6 w-24 bg-white/5 rounded"></div>
            <div className="h-6 w-24 bg-white/5 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded"></div>)}
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 rounded"></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error display component
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="p-8 rounded-2xl text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-foreground mb-2">Failed to Generate Itinerary</h2>
          <p className="text-stone-mist mb-6">{message}</p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            onClick={onRetry}
            className="btn-terra px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryPage() {
  const [step, setStep] = useState(0);
  const [openDay, setOpenDay] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const [form, setForm] = useState({
    country: "Tunisia",
    days: 7,
    style: "cultural",
    budget: "mid-range",
    interests: [] as string[],
    special: "",
  });

  // Reset open day when result changes
  useEffect(() => {
    if (result) {
      setOpenDay(0);
    }
  }, [result]);

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(x => x !== interest)
        : [...prev.interests, interest]
    }));
  };

  const STEPS = ["Destination", "Style", "Interests", "Review"];

  // FIXED: useCallback to prevent recreation on every render
  const validateStep = useCallback((stepIndex: number): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (stepIndex === 0) {
      if (!form.country) errors.country = "Please select a country";
      if (form.days < 1 || form.days > 30) errors.days = "Days must be between 1 and 30";
    }
    
    if (stepIndex === 1) {
      if (!form.style) errors.style = "Please select a travel style";
      if (!form.budget) errors.budget = "Please select a budget";
    }
    
    if (stepIndex === 2 && form.interests.length === 0) {
      errors.interests = "Please select at least one interest";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form.country, form.days, form.style, form.budget, form.interests.length]);

  // FIXED: useMemo to cache the validation result
  const isValid = useMemo(() => {
    return validateStep(step);
  }, [step, validateStep]);

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const generate = async () => {
    if (!validateStep(2)) return;
    
    setLoading(true);
    setError("");
    setValidationErrors({});
    
    try {
      console.log("Generating itinerary with:", form);
      
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to generate itinerary");
      }

      // Validate the response structure
      if (!data.days || !Array.isArray(data.days)) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid itinerary format received from AI");
      }

      // Ensure each day has the required fields
      const validatedDays = data.days.map((day: any, index: number) => ({
        day: day.day || index + 1,
        title: day.title || `Day ${index + 1}`,
        theme: day.theme || "Exploration",
        tips: day.tips || "",
        accommodation: day.accommodation || "",
        destinations: Array.isArray(day.destinations) ? day.destinations.map((d: any, i: number) => ({
          name: d.name || "Unnamed location",
          duration_hours: d.duration_hours || 1,
          activity: d.activity || "Visit",
          notes: d.notes || "",
          order: d.order || i + 1
        })) : []
      }));

      // Construct full itinerary object
      const itinerary: Itinerary = {
        id: crypto.randomUUID(),
        user_id: "",
        created_at: new Date().toISOString(),
        country: form.country,
        duration_days: form.days,
        travel_style: form.style as any,
        budget: form.budget,
        interests: form.interests,
        special_requests: form.special,
        title: data.title || `${form.days}-Day Journey Through ${form.country}`,
        ai_highlights: Array.isArray(data.ai_highlights) ? data.ai_highlights : [],
        estimated_cost: data.estimated_cost || "Price on request",
        sustainability_tips: Array.isArray(data.sustainability_tips) ? data.sustainability_tips : [],
        days: validatedDays
      };

      setResult(itinerary);
      
    } catch (e: any) {
      console.error("Generation error:", e);
      setError(e.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(0);
    setError("");
    setValidationErrors({});
  };

  // ── Results view ──────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !result) {
    return <ErrorDisplay message={error} onRetry={generate} />;
  }

  if (result) {
    // Safely access result properties
    const title = result.title || `${result.duration_days}-Day Journey Through ${result.country}`;
    const highlights = Array.isArray(result.ai_highlights) ? result.ai_highlights : [];
    const days = Array.isArray(result.days) ? result.days : [];
    const tips = Array.isArray(result.sustainability_tips) ? result.sustainability_tips : [];

    return (
      <div className="min-h-screen bg-[#0F1419]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-mono text-terra-DEFAULT uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Your AI Itinerary
                </p>
                <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">{title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-stone-mist">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-terra-light" />
                    {result.country}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-terra-light" />
                    {result.duration_days} days
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-sand-DEFAULT" />
                    {result.travel_style}
                  </span>
                  {result.estimated_cost && (
                    <span className="text-xs font-mono text-teal-light">{result.estimated_cost}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <motion.button 
                  whileHover={{ scale: 1.04 }} 
                  onClick={handleReset}
                  className="btn-outline px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> New Itinerary
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* AI Highlights */}
          {highlights.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8"
            >
              {highlights.map((h, i) => (
                <div 
                  key={i} 
                  className="flex gap-2.5 p-4 rounded-xl"
                  style={{ background: "rgba(200,75,49,0.08)", border: "1px solid rgba(200,75,49,0.15)" }}
                >
                  <Sparkles className="w-4 h-4 text-terra-light flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-mist leading-snug">{h}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Days */}
          {days.length > 0 ? (
            <div className="space-y-3 mb-8">
              {days.map((day, i) => (
                <DayCard
                  key={i}
                  day={day}
                  isOpen={openDay === i}
                  onToggle={() => setOpenDay(openDay === i ? null : i)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-stone-mist">
              No days found in itinerary. Please try again.
            </div>
          )}

          {/* Sustainability tips */}
          {tips.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl"
              style={{ background: "rgba(26,122,110,0.08)", border: "1px solid rgba(26,122,110,0.2)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-teal-light" />
                <h3 className="font-heading font-semibold text-foreground">Sustainable Travel Tips</h3>
              </div>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-stone-mist">
                    <span className="text-teal-light mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── Builder wizard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />
      {/* Background */}
      <div className="fixed inset-0 zellige-bg opacity-100 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(200,75,49,0.12), transparent)" }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-5xl text-foreground mb-2">Plan Your Journey</h1>
          <p className="text-stone-mist">AI-crafted itinerary in seconds</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all"
                  style={{
                    background: i < step ? "linear-gradient(135deg, #C84B31, #E8C98A)" : i === step ? "#C84B31" : "#252F3F",
                    color: i <= step ? "white" : "#4A4033",
                  }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <div className="text-xs mt-1 font-mono hidden sm:block" style={{ color: i === step ? "#C84B31" : "#4A4033" }}>{s}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 transition-all" style={{ background: i < step ? "#C84B31" : "#252F3F" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-7 rounded-2xl mb-6"
          style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold text-xl text-foreground">Where are you headed?</h2>
              
              {validationErrors.country && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.country}
                </div>
              )}
              
              <div>
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">Country</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COUNTRIES.map(c => (
                    <motion.button 
                      key={c.value} 
                      whileTap={{ scale: 0.97 }} 
                      onClick={() => updateForm("country", c.value)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        background: form.country === c.value ? "rgba(200,75,49,0.15)" : "rgba(28,35,48,0.6)",
                        border: `1px solid ${form.country === c.value ? "rgba(200,75,49,0.4)" : "rgba(255,255,255,0.06)"}`,
                        color: form.country === c.value ? "#E8694A" : "#7A6E62",
                      }}>
                      <div className="text-lg mb-0.5">{c.emoji}</div>
                      <div className="text-xs font-heading font-medium">{c.value}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">
                  Duration: <span className="text-terra-light">{form.days} days</span>
                </label>
                <input 
                  type="range" 
                  min={2} 
                  max={21} 
                  value={form.days} 
                  onChange={e => updateForm("days", +e.target.value)}
                  className="w-full accent-terra" 
                />
                <div className="flex justify-between text-xs text-stone-mist mt-1 font-mono">
                  <span>2 days</span>
                  <span>21 days</span>
                </div>
                {validationErrors.days && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.days}</p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold text-xl text-foreground">What's your travel style?</h2>
              
              {validationErrors.style && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.style}
                </div>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STYLES.map(s => (
                  <motion.button 
                    key={s.id} 
                    whileTap={{ scale: 0.97 }} 
                    onClick={() => updateForm("style", s.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: form.style === s.id ? "rgba(200,75,49,0.12)" : "rgba(28,35,48,0.6)",
                      border: `1px solid ${form.style === s.id ? "rgba(200,75,49,0.35)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="text-2xl mb-2">{s.emoji}</div>
                    <div className="font-heading font-semibold text-sm" style={{ color: form.style === s.id ? "#E8694A" : "#F0EBE3" }}>{s.label}</div>
                    <div className="text-xs text-stone-mist mt-0.5">{s.desc}</div>
                  </motion.button>
                ))}
              </div>
              
              <div>
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-3 block">Budget per day</label>
                {validationErrors.budget && (
                  <p className="text-xs text-red-400 mb-2">{validationErrors.budget}</p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {BUDGETS.map(b => (
                    <motion.button 
                      key={b.id} 
                      whileTap={{ scale: 0.97 }} 
                      onClick={() => updateForm("budget", b.id)}
                      className="p-3 rounded-xl text-center transition-all"
                      style={{
                        background: form.budget === b.id ? "rgba(200,75,49,0.12)" : "rgba(28,35,48,0.6)",
                        border: `1px solid ${form.budget === b.id ? "rgba(200,75,49,0.35)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                      <div className="font-heading font-semibold text-sm" style={{ color: form.budget === b.id ? "#E8694A" : "#F0EBE3" }}>{b.label}</div>
                      <div className="text-xs text-stone-mist">{b.sub}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold text-xl text-foreground">What excites you most?</h2>
              <p className="text-sm text-stone-mist">Select all that apply</p>
              
              {validationErrors.interests && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.interests}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {TRAVEL_INTERESTS.map(i => {
                  const selected = form.interests.includes(i);
                  return (
                    <motion.button 
                      key={i} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => toggleInterest(i)}
                      className="px-3 py-1.5 rounded-full text-xs font-heading transition-all"
                      style={{
                        background: selected ? "rgba(200,75,49,0.18)" : "rgba(28,35,48,0.8)",
                        border: `1px solid ${selected ? "rgba(200,75,49,0.4)" : "rgba(255,255,255,0.06)"}`,
                        color: selected ? "#E8694A" : "#7A6E62",
                      }}>
                      {selected && "✓ "}{i}
                    </motion.button>
                  );
                })}
              </div>
              
              <div>
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">Special requests (optional)</label>
                <textarea 
                  value={form.special} 
                  onChange={e => updateForm("special", e.target.value)}
                  placeholder="e.g. I need wheelchair-accessible sites, I'm vegetarian, I want to avoid tourist traps..."
                  rows={3} 
                  className="w-full input-rihla px-4 py-3 rounded-xl text-sm resize-none" 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-heading font-bold text-xl text-foreground">Ready to generate?</h2>
              {[
                ["Destination", `${form.country} · ${form.days} days`],
                ["Style", `${form.style} · ${form.budget}`],
                ["Interests", form.interests.join(", ") || "None selected"],
                ...(form.special ? [["Special", form.special]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 p-3 rounded-xl" style={{ background: "#0F1419" }}>
                  <div className="text-xs font-mono text-stone-mist uppercase w-24 flex-shrink-0 pt-0.5">{k}</div>
                  <div className="text-sm text-foreground">{v}</div>
                </div>
              ))}
              
              {error && (
                <div className="p-3 rounded-xl text-sm text-red-400 flex items-start gap-2" 
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            onClick={() => step > 0 && setStep(step - 1)} 
            disabled={step === 0}
            className="btn-outline px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </motion.button>
          
          {step < STEPS.length - 1 ? (
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              onClick={handleNext}
              disabled={!isValid}
              className="btn-terra px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-40"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              onClick={generate} 
              disabled={loading}
              className="btn-terra px-7 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-60"
              style={{ boxShadow: "0 6px 24px rgba(200,75,49,0.3)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 
                  Crafting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> 
                  Generate Itinerary
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}