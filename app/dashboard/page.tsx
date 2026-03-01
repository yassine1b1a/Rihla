"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Sparkles, Camera, Leaf, Brain, ArrowRight, MapPin, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const TOOLS = [
  { href: "/itinerary",     icon: Sparkles, label: "Plan a Trip",       desc: "AI itinerary generator",          color: "#C84B31" },
  { href: "/explore",       icon: Brain,    label: "AI Travel Guide",   desc: "Chat with your travel expert",    color: "#E8C98A" },
  { href: "/heritage",      icon: Camera,   label: "Heritage Guide",    desc: "Identify & explore sites",        color: "#1A7A6E" },
  { href: "/sustainability", icon: Leaf,    label: "Eco Dashboard",     desc: "Crowd & sustainability insights", color: "#4ADE80" },
];

export default function DashboardPage() {
  const [user, setUser]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router  = useRouter();
  const sb      = createClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
  }, []);

  const signOut = async () => { await sb.auth.signOut(); router.push("/"); };

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <div className="fixed inset-0 zellige-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(200,75,49,0.1), transparent)" }} />

      {/* Topbar */}
      <header className="relative z-10 border-b px-6 h-16 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(15,20,25,0.9)", backdropFilter: "blur(20px)" }}>
        <Link href="/">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-terra-gradient">Rihla</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-sm text-stone-mist font-heading hidden sm:block">
            {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Traveller"}
          </div>
          <button onClick={signOut} className="p-2 rounded-lg text-stone-mist hover:text-foreground transition-colors hover:bg-white/5">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧭</span>
            <h1 className="font-display text-4xl text-foreground">
              Marhaba,{" "}
              <span className="text-terra-gradient">
                {user?.user_metadata?.full_name?.split(" ")[0] || "Explorer"}
              </span>
            </h1>
          </div>
          <p className="text-stone-mist ml-14">Where will your next journey take you?</p>
        </motion.div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div key={tool.href}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link href={tool.href}>
                  <motion.div whileHover={{ y: -3, borderColor: `${tool.color}35` }} whileTap={{ scale: 0.98 }}
                    className="group p-6 rounded-2xl cursor-pointer transition-all"
                    style={{ background: "rgba(28,35,48,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ background: `${tool.color}18`, border: `1px solid ${tool.color}30` }}>
                        <Icon className="w-5 h-5" style={{ color: tool.color }} />
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-mist opacity-0 group-hover:opacity-100 transition-opacity group-hover:text-terra-light" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-foreground mb-1">{tool.label}</h3>
                    <p className="text-sm text-stone-mist">{tool.desc}</p>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Inspiration strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(200,75,49,0.1), rgba(26,122,110,0.08))", border: "1px solid rgba(200,75,49,0.15)" }}>
          <div className="text-arabic text-2xl text-sand-DEFAULT mb-2 text-center" style={{ lineHeight: 1.6 }}>
            كل رحلة تبدأ بخطوة
          </div>
          <p className="text-xs text-stone-mist text-center font-mono mb-4">Every journey begins with a single step</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Tunis Medina", "Sahara Douz", "Sidi Bou Said", "Carthage", "Djerba", "Kairouan"].map(d => (
              <Link key={d} href={`/explore`}>
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all font-heading font-medium"
                  style={{ background: "rgba(200,75,49,0.1)", color: "#E8694A", border: "1px solid rgba(200,75,49,0.2)" }}>
                  <MapPin className="w-3 h-3" />{d}
                </motion.span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
