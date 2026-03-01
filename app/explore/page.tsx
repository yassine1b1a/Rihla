"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Brain, Send, Compass, RotateCcw, MapPin, Sparkles, ChevronRight } from "lucide-react";
import { DESTINATIONS, COUNTRIES } from "@/lib/data/destinations";
import { Navbar } from "@/components/layout/Navbar";
import { marked } from "marked";

const STARTERS = [
  "What are the absolute must-see places in Tunisia?",
  "Plan a 3-day trip to the Sahara from Tunis",
  "Tell me about the medina of Kairouan",
  "What's the best time to visit Djerba?",
  "What Tunisian food should I definitely try?",
  "Is Tunisia safe for solo female travellers?",
];

const DEST_QUICK = DESTINATIONS.slice(0, 6);

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function ExplorePage() {
  const [msgs, setMsgs]       = useState<Msg[]>([{
    id: "0", role: "assistant",
    content: `# مرحباً — Marhaba! Welcome to Rihla AI 🧭\n\nI'm your personal travel expert for **Tunisia and the Maghreb**. I know every medina, desert track, UNESCO site, hidden beach and local restaurant worth knowing.\n\nAsk me anything:\n- 🏛️ *Ancient ruins and cultural sites*\n- 🍽️ *Local food, where to eat, what to try*\n- 🗺️ *Itinerary ideas and route planning*\n- 🤝 *Cultural etiquette and practical tips*\n- 🌿 *Sustainable and responsible travel*\n\n**Where does your journey begin?**`,
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("Tunisia");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", content: text };
    setMsgs(p => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: { country },
        }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { id: Date.now().toString(), role: "assistant", content: data.message || "I couldn't respond. Please try again." }]);
    } catch {
      setMsgs(p => [...p, { id: Date.now().toString(), role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0F1419] overflow-hidden flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 border-r flex-shrink-0 overflow-y-auto"
          style={{ background: "rgba(15,20,25,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
          {/* Country filter */}
          <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2">Focus Region</div>
            <div className="space-y-1">
              {COUNTRIES.slice(0, 4).map(c => (
                <button key={c.value} onClick={() => setCountry(c.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
                  style={{
                    background: country === c.value ? "rgba(200,75,49,0.12)" : "transparent",
                    color: country === c.value ? "#E8694A" : "#7A6E62",
                    border: `1px solid ${country === c.value ? "rgba(200,75,49,0.25)" : "transparent"}`,
                  }}>
                  <span>{c.emoji}</span>
                  <span className="font-heading font-medium">{c.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick prompts */}
          <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-3">Quick Questions</div>
            <div className="space-y-1">
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="w-full text-left text-xs text-stone-mist hover:text-terra-light px-3 py-2 rounded-lg hover:bg-white/3 transition-colors flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-terra-dark" />{s}
                </button>
              ))}
            </div>
          </div>

          {/* Featured spots */}
          <div className="p-4">
            <div className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-3">Ask About</div>
            {DEST_QUICK.map(d => (
              <button key={d.id} onClick={() => send(`Tell me about ${d.name} in ${d.country}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors text-left mb-1">
                <MapPin className="w-3 h-3 text-terra-dark flex-shrink-0" />
                <div>
                  <div className="text-xs font-heading font-medium text-stone-mist">{d.name}</div>
                  <div className="text-xs text-stone-light opacity-50">{d.country}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(15,20,25,0.8)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-heading font-semibold text-foreground text-sm">Rihla AI Guide</div>
                <div className="flex items-center gap-1.5 text-xs text-stone-mist">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Expert in Tunisia & Maghreb • LLaMA 3.3
                </div>
              </div>
            </div>
            <button onClick={() => { setMsgs([{ id: "0", role: "assistant", content: "Chat reset! Ask me anything about your journey." }]); }}
              className="text-stone-mist hover:text-foreground transition-colors p-2 rounded-lg hover:bg-white/5">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <AnimatePresence initial={false}>
              {msgs.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: msg.role === "assistant" ? "linear-gradient(135deg, #C84B31, #E8C98A)" : "rgba(255,255,255,0.08)" }}>
                    {msg.role === "assistant"
                      ? <Compass className="w-4 h-4 text-white" />
                      : <span className="text-xs font-bold text-foreground">U</span>}
                  </div>

                  {/* Bubble */}
                  <div
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%]"
                    style={{
                      background: msg.role === "user" ? "linear-gradient(135deg, rgba(200,75,49,0.2), rgba(232,201,138,0.12))" : "rgba(28,35,48,0.7)",
                      border: `1px solid ${msg.role === "user" ? "rgba(200,75,49,0.3)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    }}
                  >
                    <div
                      className="prose prose-invert prose-sm max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-stone-mist prose-li:text-stone-mist prose-strong:text-sand-DEFAULT"
                      dangerouslySetInnerHTML={{ __html: marked(msg.content) as string }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
                  <Compass className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                  style={{ background: "rgba(28,35,48,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px 18px 18px 18px" }}>
                  {[0, 0.2, 0.4].map(d => (
                    <motion.span key={d} className="w-2 h-2 rounded-full"
                      style={{ background: "#C84B31" }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(15,20,25,0.9)" }}>
            {/* Mobile quick prompts */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 lg:hidden">
              {STARTERS.slice(0, 3).map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-white/10 text-stone-mist hover:text-terra-light transition-colors flex-shrink-0">
                  {s.length > 30 ? s.slice(0, 28) + "…" : s}
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Ask about destinations, food, culture, routes..."
                  rows={1}
                  className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-stone-mist outline-none resize-none max-h-32"
                  disabled={loading}
                  style={{ minHeight: "44px" }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => send(input)} disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
            <p className="text-xs text-center text-stone-mist mt-2 opacity-50">
              Expert in Tunisia, Morocco, Algeria, Egypt & Jordan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
