"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Leaf, BarChart3, Users, Droplets, Wind, TreePine, AlertTriangle, CheckCircle, RefreshCw, TrendingDown, Globe } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DESTINATIONS } from "@/lib/data/destinations";
import { Navbar } from "@/components/layout/Navbar";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function ScoreMeter({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1C2330" strokeWidth="8" />
          <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl" style={{ color }}>{value}</span>
        </div>
      </div>
      <div className="text-xs text-stone-mist mt-2 text-center font-heading">{label}</div>
    </div>
  );
}

const CROWD_COLORS: Record<string, string> = { low: "#4ADE80", moderate: "#E8C98A", high: "#EF4444" };
const WATER_COLORS: Record<string, string> = { low: "#4ADE80", moderate: "#E8C98A", high: "#EF4444" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 rounded-xl text-xs" style={{ background: "#1C2330", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="font-heading font-semibold text-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function SustainabilityPage() {
  const [dest, setDest]       = useState(DESTINATIONS[0]);
  const [month, setMonth]     = useState("Jun");
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<any>(null);
  const [error, setError]     = useState("");

  const getInsights = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/ai/sustainability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dest.name, country: dest.country, month }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (e: any) {
      setError(e.message || "Failed to load insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(26,122,110,0.08), transparent)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-mono text-teal-light uppercase tracking-widest mb-2">{"Eco Dashboard"}</p>
          <h1 className="font-display text-5xl md:text-6xl text-foreground mb-3">
            {"Travel responsibly with real-time insights"} <span className="text-teal-gradient">{"Eco Score"}</span>
          </h1>
          <p className="text-stone-mist text-lg max-w-2xl">
            {"Recommendations"}
          </p>
        </motion.div>

        {/* Control panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl mb-8 flex flex-wrap gap-4 items-end"
          style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 min-w-48">
            <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">{"Select Destination"}</label>
            <select value={dest.id} onChange={e => setDest(DESTINATIONS.find(d => d.id === e.target.value) || DESTINATIONS[0])}
              className="w-full input-rihla px-4 py-2.5 rounded-xl text-sm">
              {DESTINATIONS.map(d => <option key={d.id} value={d.id}>{d.name} — {d.country}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">{"Select Month"}</label>
            <div className="flex flex-wrap gap-1">
              {MONTHS.map(m => (
                <button key={m} onClick={() => setMonth(m)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all"
                  style={{
                    background: month === m ? "rgba(26,122,110,0.2)" : "rgba(28,35,48,0.6)",
                    border: `1px solid ${month === m ? "rgba(26,122,110,0.4)" : "rgba(255,255,255,0.05)"}`,
                    color: month === m ? "#2BA899" : "#7A6E62",
                  }}>{m}</button>
              ))}
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={getInsights} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-heading font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1A7A6E, #2BA899)", color: "white", whiteSpace: "nowrap" }}>
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> {"Analyzing..."}</>
                     : <><BarChart3 className="w-4 h-4" /> {"Get Eco Insights"}</>}
          </motion.button>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* Static overview cards (always visible) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {DESTINATIONS.slice(0, 4).map((d, i) => (
            <motion.div key={d.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setDest(d)}
              className="p-4 rounded-2xl cursor-pointer transition-all"
              style={{
                background: dest.id === d.id ? "rgba(26,122,110,0.1)" : "rgba(28,35,48,0.6)",
                border: `1px solid ${dest.id === d.id ? "rgba(26,122,110,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}>
              <div className="font-heading font-semibold text-sm text-foreground mb-1 truncate">{d.name}</div>
              <div className="text-xs text-stone-mist mb-3">{d.country}</div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold" style={{ color: "#4ADE80" }}>{d.sustainability_score}</div>
                  <div className="text-xs text-stone-mist">Eco</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-heading font-medium" style={{ color: CROWD_COLORS[d.crowd_level] }}>
                    {d.crowd_level}
                  </div>
                  <div className="text-xs text-stone-mist">Crowd</div>
                </div>
                {d.unesco && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "rgba(232,201,138,0.15)", color: "#E8C98A" }}>UN</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Results */}
        {data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Score meters */}
            <div className="p-6 rounded-2xl" style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                {dest.name} · {month} Analysis
              </h2>
              <div className="flex flex-wrap justify-around gap-6">
                <ScoreMeter value={data.eco_score}     label="Eco Score"     color="#4ADE80" />
                <ScoreMeter value={data.crowd_score}   label="Crowd Load"    color={CROWD_COLORS[data.crowd_forecast]} />
                <ScoreMeter value={Math.round((data.carbon_estimate_kg / 50) * 100)} label="Carbon Level" color="#E8C98A" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5">
                {[
                  { icon: Users, label: "Crowd Level",    value: data.crowd_forecast,    color: CROWD_COLORS[data.crowd_forecast] },
                  { icon: Droplets, label: "Water Stress",  value: data.water_stress,      color: WATER_COLORS[data.water_stress] },
                  { icon: Wind, label: "CO₂/Visitor",   value: `${data.carbon_estimate_kg} kg`, color: "#E8C98A" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl" style={{ background: "#0F1419" }}>
                    <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                    <div className="text-xs text-stone-mist mb-1 font-mono">{label}</div>
                    <div className="text-sm font-heading font-semibold capitalize" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            {data.monthly_trend?.length > 0 && (
              <div className="p-6 rounded-2xl" style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-teal-light" /> Visitor & Eco Score Trends
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.monthly_trend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C84B31" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C84B31" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="eco" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "#7A6E62", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#7A6E62", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="visitors" stroke="#C84B31" fill="url(#visitors)" strokeWidth={2} name="Visitors" />
                    <Area type="monotone" dataKey="eco_score" stroke="#4ADE80" fill="url(#eco)" strokeWidth={2} name="Eco Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tips grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {data.responsible_tips?.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: "rgba(26,122,110,0.07)", border: "1px solid rgba(26,122,110,0.18)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-teal-light" />
                    <h3 className="font-heading font-semibold text-foreground text-sm">Responsible Travel Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {data.responsible_tips.map((t: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-stone-mist">
                        <span className="text-teal-light mt-0.5">•</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.local_initiatives?.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: "rgba(28,35,48,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-sand-DEFAULT" />
                    <h3 className="font-heading font-semibold text-foreground text-sm">Local Eco Initiatives</h3>
                  </div>
                  <ul className="space-y-2">
                    {data.local_initiatives.map((t: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-stone-mist">
                        <span className="text-sand-DEFAULT mt-0.5">•</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Alternatives */}
            {data.alternative_destinations?.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: "rgba(200,75,49,0.06)", border: "1px solid rgba(200,75,49,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-terra-light" />
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    {data.carrying_capacity_alert ? "Overcrowding Alert — Consider Alternatives" : "Less Crowded Alternatives"}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.alternative_destinations.map((a: string, i: number) => (
                    <span key={i} className="text-sm px-3 py-1.5 rounded-full font-heading"
                      style={{ background: "rgba(200,75,49,0.1)", color: "#E8694A", border: "1px solid rgba(200,75,49,0.2)" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-center py-16">
            <TreePine className="w-16 h-16 text-teal-dark mx-auto mb-4" />
            <h3 className="font-heading font-bold text-xl text-foreground mb-2">Select a destination and month</h3>
            <p className="text-stone-mist text-sm max-w-md mx-auto">
              Get AI-powered sustainability insights, crowd forecasts, and responsible travel recommendations.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
