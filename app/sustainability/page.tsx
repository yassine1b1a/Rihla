"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Leaf, BarChart3, Users, Droplets, Wind, TreePine, 
  AlertTriangle, CheckCircle, RefreshCw, TrendingDown, 
  Globe, MapPin, Search, X 
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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

// Interface for location search results
interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

export default function SustainabilityPage() {
  const [location, setLocation] = useState<LocationSuggestion | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [month, setMonth] = useState("Jun");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Search locations using OpenStreetMap Nominatim API
  const searchLocations = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching locations:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    setLocation(suggestion);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    // Clear previous results when location changes
    setData(null);
  };

  const clearLocation = () => {
    setLocation(null);
    setSearchQuery("");
    setData(null);
  };

  const getInsights = async () => {
    if (!location) {
      setError("Please select a location first");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      // Extract city and country from address
      const address = location.address || {};
      const city = address.city || address.town || address.village || location.name || location.display_name.split(',')[0];
      const country = address.country || "Unknown";

      const res = await fetch("/api/ai/sustainability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: city, 
          country: country,
          month,
          lat: location.lat,
          lon: location.lon
        }),
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

  // Get display name for the selected location
  const getLocationDisplay = () => {
    if (!location) return "";
    const address = location.address || {};
    const city = address.city || address.town || address.village || location.name;
    const country = address.country;
    if (city && country) return `${city}, ${country}`;
    return location.display_name.split(',').slice(0, 2).join(',');
  };

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(26,122,110,0.08), transparent)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-mono text-teal-light uppercase tracking-widest mb-2">Eco Dashboard</p>
          <h1 className="font-display text-5xl md:text-6xl text-foreground mb-3">
            Travel responsibly with{" "}
            <span className="text-teal-gradient">real-time insights</span>
          </h1>
          <p className="text-stone-mist text-lg max-w-2xl">
            Get AI-powered sustainability data for any city in the world. 
            Search for your destination below.
          </p>
        </motion.div>

        {/* Search and Control panel */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl mb-8"
          style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex flex-wrap gap-4 items-end">
            {/* Location Search */}
            <div className="flex-1 min-w-64 relative">
              <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Destination
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for any city in the world..."
                  className="w-full input-rihla pl-10 pr-10 py-2.5 rounded-xl text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                {location && (
                  <button
                    onClick={clearLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-mist hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Location suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden max-h-60 overflow-y-auto"
                  style={{ background: "#1C2330", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(suggestion)}
                      className="w-full text-left px-4 py-2.5 text-sm text-stone-mist hover:text-foreground hover:bg-white/5 transition-colors flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{suggestion.display_name}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {searchLoading && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-light" />
                </div>
              )}

              {/* Selected location display */}
              {location && (
                <div className="mt-2 flex items-center gap-1 text-xs text-teal-light">
                  <MapPin className="w-3 h-3" />
                  <span>{getLocationDisplay()}</span>
                </div>
              )}
            </div>

            {/* Month selector */}
            <div>
              <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">Month</label>
              <div className="flex flex-wrap gap-1">
                {MONTHS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMonth(m)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all"
                    style={{
                      background: month === m ? "rgba(26,122,110,0.2)" : "rgba(28,35,48,0.6)",
                      border: `1px solid ${month === m ? "rgba(26,122,110,0.4)" : "rgba(255,255,255,0.05)"}`,
                      color: month === m ? "#2BA899" : "#7A6E62",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={getInsights}
              disabled={loading || !location}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-heading font-semibold disabled:opacity-50"
              style={{ 
                background: "linear-gradient(135deg, #1A7A6E, #2BA899)", 
                color: "white", 
                whiteSpace: "nowrap" 
              }}
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><BarChart3 className="w-4 h-4" /> Get Eco Insights</>
              )}
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* AI Results */}
        {data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Score meters */}
            <div className="p-6 rounded-2xl" style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                {getLocationDisplay()} · {month} Analysis
              </h2>
              <div className="flex flex-wrap justify-around gap-6">
                <ScoreMeter value={data.eco_score} label="Eco Score" color="#4ADE80" />
                <ScoreMeter value={data.crowd_score} label="Crowd Load" color={CROWD_COLORS[data.crowd_forecast]} />
                <ScoreMeter value={Math.round((data.carbon_estimate_kg / 50) * 100)} label="Carbon Level" color="#E8C98A" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5">
                {[
                  { icon: Users, label: "Crowd Level",    value: data.crowd_forecast,    color: CROWD_COLORS[data.crowd_forecast] },
                  { icon: Droplets, label: "Water Stress", value: data.water_stress,      color: WATER_COLORS[data.water_stress] },
                  { icon: Wind, label: "CO₂/Visitor",     value: `${data.carbon_estimate_kg} kg`, color: "#E8C98A" },
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
        {!data && !loading && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-center py-16">
            <TreePine className="w-16 h-16 text-teal-dark mx-auto mb-4" />
            <h3 className="font-heading font-bold text-xl text-foreground mb-2">Search for a destination</h3>
            <p className="text-stone-mist text-sm max-w-md mx-auto">
              Enter any city in the world to get AI-powered sustainability insights, 
              crowd forecasts, and responsible travel recommendations.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
