"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  Camera, Search, Landmark, Sparkles, MapPin, Clock, Star,
  ChevronRight, Info, Lightbulb, Navigation, AlertCircle,
  Upload, X, Image as ImageIcon,
} from "lucide-react";
import { HERITAGE_SITES } from "@/lib/data/destinations";
import { Navbar } from "@/components/layout/Navbar";
import type { RecognitionResult } from "@/types";

type Mode = "describe" | "upload";

const SAMPLE_SITES = [
  { name: "Amphitheatre of El Jem",    hint: "I see a massive ancient Roman arena in Tunisia, oval-shaped with multiple arched tiers, very well preserved", country: "Tunisia" },
  { name: "Sidi Bou Said",             hint: "A blue and white painted village on a cliff with cobblestone streets in Tunisia", country: "Tunisia" },
  { name: "Kairouan Great Mosque",     hint: "A large mosque with a distinctive three-tiered square minaret in central Tunisia", country: "Tunisia" },
  { name: "Carthage Ruins",            hint: "Ancient ruins near the sea with Roman pillars and foundations overlooking a gulf in Tunisia", country: "Tunisia" },
];

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Heritage Library card ────────────────────────────────────────────────────

function SiteCard({ site }: { site: typeof HERITAGE_SITES[0] }) {
  return (
    <motion.div
      whileHover={{ y: -3, borderColor: "rgba(200,75,49,0.3)" }}
      className="p-5 rounded-2xl cursor-pointer transition-all"
      style={{ background: "rgba(28,35,48,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-foreground">{site.name}</h3>
          {site.name_ar && (
            <span className="text-arabic text-sm text-sand-DEFAULT opacity-70">{site.name_ar}</span>
          )}
        </div>
        {site.unesco && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono flex-shrink-0 ml-2"
            style={{ background: "rgba(232,201,138,0.15)", color: "#E8C98A", border: "1px solid rgba(232,201,138,0.25)" }}
          >
            UNESCO
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-stone-mist mb-2">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {site.city}, {site.country}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {site.period}</span>
      </div>
      <p className="text-xs text-stone-mist line-clamp-2 leading-relaxed">{site.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {site.tags.slice(0, 3).map(t => (
          <span
            key={t}
            className="text-xs px-2 py-0.5 rounded font-mono"
            style={{ background: "rgba(255,255,255,0.05)", color: "#7A6E62", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── AI result card ───────────────────────────────────────────────────────────

function ResultCard({ result }: { result: RecognitionResult & any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Main identity */}
      <div className="p-6 rounded-2xl" style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(200,75,49,0.2)" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-3xl text-foreground">{result.site_name}</h2>
              {result.unesco && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ background: "rgba(232,201,138,0.15)", color: "#E8C98A", border: "1px solid rgba(232,201,138,0.25)" }}
                >
                  UNESCO
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-mist">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-terra-light" />
                {result.city || result.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-terra-light" />
                {result.period}
              </span>
              <span
                className="font-mono text-xs px-2 py-0.5 rounded"
                style={{ background: "rgba(26,122,110,0.15)", color: "#2BA899", border: "1px solid rgba(26,122,110,0.25)" }}
              >
                {result.confidence}% confident
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-mist font-mono">Civilization</div>
            <div className="text-sm font-heading font-semibold text-sand-DEFAULT">{result.civilization}</div>
          </div>
        </div>
        <p className="text-sm text-stone-mist leading-relaxed">{result.description}</p>
        {result.significance && (
          <div
            className="mt-3 p-3 rounded-xl flex gap-2"
            style={{ background: "rgba(200,75,49,0.07)", border: "1px solid rgba(200,75,49,0.15)" }}
          >
            <Star className="w-4 h-4 text-terra-light flex-shrink-0 mt-0.5" />
            <p className="text-xs text-stone-mist">{result.significance}</p>
          </div>
        )}
      </div>

      {/* Historical context */}
      {result.historical_context && (
        <div className="p-5 rounded-2xl" style={{ background: "rgba(28,35,48,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-4 h-4 text-sand-DEFAULT" />
            <h3 className="font-heading font-semibold text-foreground">Historical Context</h3>
          </div>
          <p className="text-sm text-stone-mist leading-relaxed">{result.historical_context}</p>
        </div>
      )}

      {/* Fun facts + visitor tips */}
      <div className="grid md:grid-cols-2 gap-4">
        {result.fun_facts?.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: "rgba(28,35,48,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-sand-DEFAULT" />
              <h3 className="font-heading font-semibold text-foreground text-sm">Fascinating Facts</h3>
            </div>
            <ul className="space-y-2">
              {result.fun_facts.map((f: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-stone-mist">
                  <span className="text-terra-light font-bold">{i + 1}.</span>{f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.visitor_tips && (
          <div className="p-5 rounded-2xl" style={{ background: "rgba(26,122,110,0.06)", border: "1px solid rgba(26,122,110,0.15)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-teal-light" />
              <h3 className="font-heading font-semibold text-foreground text-sm">Visitor Tips</h3>
            </div>
            <p className="text-xs text-stone-mist leading-relaxed">{result.visitor_tips}</p>
            {result.best_time_to_visit && (
              <div className="mt-2 text-xs flex items-center gap-1.5 text-teal-light">
                <Clock className="w-3 h-3" /> Best time: {result.best_time_to_visit}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nearby sites */}
      {result.nearby_sites?.length > 0 && (
        <div className="p-5 rounded-2xl" style={{ background: "rgba(28,35,48,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-terra-light" />
            <h3 className="font-heading font-semibold text-foreground text-sm">Nearby Sites Worth Visiting</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.nearby_sites.map((s: string, i: number) => (
              <span
                key={i}
                className="text-xs px-3 py-1.5 rounded-full font-heading font-medium"
                style={{ background: "rgba(200,75,49,0.1)", color: "#E8694A", border: "1px solid rgba(200,75,49,0.2)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeritagePage() {
  const [mode, setMode]             = useState<Mode>("describe");
  const [input, setInput]           = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [country, setCountry]       = useState("Tunisia");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<any>(null);
  const [error, setError]           = useState("");
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  const resetState = () => {
    setResult(null);
    setError("");
  };

  const handleModeSwitch = (m: Mode) => {
    setMode(m);
    setInput("");
    setSelectedImage(null);
    setImageFile(null);
    resetState();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Fill the describe input with a sample hint and switch to describe mode */
  const handleSampleClick = (sample: typeof SAMPLE_SITES[0]) => {
    handleModeSwitch("describe");
    setInput(sample.hint);
    setCountry(sample.country);
  };

  // ── identify ───────────────────────────────────────────────────────────────

  const identify = async () => {
    if (mode === "describe" && !input.trim()) { setError("Please enter a description"); return; }
    if (mode === "upload"   && !imageFile)    { setError("Please select an image to upload"); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response: Response;

      if (mode === "upload" && imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("country", country);
        if (input.trim()) formData.append("prompt", input);

        response = await fetch("/api/ai/heritage-vision", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/ai/heritage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "description", value: input, country_hint: country }),
        });
      }

      if (!response.ok) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.error || `API error: ${response.status}`);
        } catch {
          throw new Error(`API error ${response.status}: ${text.slice(0, 120)}`);
        }
      }

      const data = await response.json();

      if (!data.site_name && !data.description) {
        throw new Error("Invalid response format from AI");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message || "Recognition failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  const canSubmit =
    !loading &&
    (mode === "describe" ? !!input.trim() : !!selectedImage);

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />
      <div className="fixed inset-0 zellige-bg pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(26,122,110,0.1), transparent)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #1A7A6E, #2BA899)" }}
          >
            <Camera className="w-7 h-7 text-white" />
          </div>
          <p className="text-xs font-mono text-teal-light uppercase tracking-widest mb-3">AI Heritage Recognition</p>
          <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
            Every Stone <span className="text-teal-gradient">Has a Story</span>
          </h1>
          <p className="text-stone-mist text-lg max-w-xl mx-auto">
            Upload a photo or describe what you see to instantly unlock the history, legends and secrets of any heritage site.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left: input panel ── */}
          <div className="lg:col-span-2 space-y-5">
            <div
              className="p-6 rounded-2xl"
              style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Mode toggle */}
              <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "#0F1419" }}>
                {(["describe", "upload"] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => handleModeSwitch(m)}
                    className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold transition-all capitalize"
                    style={{
                      background: mode === m ? "linear-gradient(135deg, #1A7A6E, #2BA899)" : "transparent",
                      color: mode === m ? "white" : "#7A6E62",
                    }}
                  >
                    {m === "describe" ? "Describe it" : "Upload Photo"}
                  </button>
                ))}
              </div>

              {mode === "describe" ? (
                <div className="mb-4">
                  <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">
                    Describe the site
                  </label>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="e.g. I see a massive ancient Roman arena with three levels of arches, very well preserved, in North Africa..."
                    rows={5}
                    className="w-full input-rihla px-4 py-3 rounded-xl text-sm resize-none"
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">
                    Upload a photo
                  </label>

                  {!selectedImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-teal-500/50 transition-colors"
                      style={{ borderColor: "rgba(26,122,110,0.3)" }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-teal-light mx-auto mb-2" />
                      <p className="text-sm text-stone-mist">Click to upload or drag and drop</p>
                      <p className="text-xs text-stone-mist mt-1 opacity-50">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={selectedImage} alt="Preview" className="w-full rounded-xl object-cover max-h-64" />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}

                  {selectedImage && (
                    <div className="mt-3">
                      <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">
                        Optional: Ask something specific
                      </label>
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="e.g. What is the history of this place?"
                        className="w-full input-rihla px-4 py-2.5 rounded-xl text-sm"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Country hint */}
              <div className="mb-4">
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">
                  Country hint
                </label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full input-rihla px-4 py-2.5 rounded-xl text-sm"
                  disabled={loading}
                >
                  {["Tunisia", "Morocco", "Algeria", "Egypt", "Jordan", "Libya"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div
                  className="mb-4 p-3 rounded-xl text-xs flex items-start gap-2 text-red-400"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={identify}
                disabled={!canSubmit}
                className="w-full btn-terra py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ boxShadow: "0 6px 24px rgba(26,122,110,0.3)", background: "linear-gradient(135deg, #1A7A6E, #2BA899)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analysing…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Identify Site
                  </>
                )}
              </motion.button>
            </div>

            {/* Quick samples */}
            <div>
              <div className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-3">Try a sample</div>
              <div className="space-y-2">
                {SAMPLE_SITES.map(s => (
                  <button
                    key={s.name}
                    onClick={() => handleSampleClick(s)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all"
                    style={{ background: "rgba(28,35,48,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(26,122,110,0.3)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
                    disabled={loading}
                  >
                    <Landmark className="w-4 h-4 text-teal-light flex-shrink-0" />
                    <span className="text-xs font-heading font-medium text-stone-mist">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: results / heritage library ── */}
          <div className="lg:col-span-3">
            {loading ? (
              <LoadingSkeleton />
            ) : result ? (
              <ResultCard result={result} />
            ) : (
              <div>
                <div className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-4">Heritage Library</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {HERITAGE_SITES.map(s => <SiteCard key={s.id} site={s} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}