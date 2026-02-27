"use client";

import { motion } from "framer-motion";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Mail, Lock, Eye, EyeOff, User, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function AuthForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initMode     = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode]   = useState<"signin" | "signup">(initMode);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm]   = useState({ email: "", password: "", name: "" });
  const sb = createClient();

  const submit = async (e: React.FormEvent) => {
  e.preventDefault(); 
  setError(""); 
  setLoading(true);
  
  try {
    if (mode === "signup") {
      console.log("Attempting signup with:", { email: form.email, name: form.name });
      
      const { data, error } = await sb.auth.signUp({ 
        email: form.email, 
        password: form.password,
        options: { 
          data: { 
            full_name: form.name,
            created_at: new Date().toISOString()
          }, 
          emailRedirectTo: `${window.location.origin}/auth/callback` 
        } 
      });
      
      if (error) {
        console.error("Signup error:", error);
        throw error;
      }
      
      console.log("Signup response:", data);
      
      if (data.user && !data.session) {
        // Email confirmation required
        toast.success("Check your email to confirm your account!", {
          duration: 6000,
        });
        // Optionally redirect to a confirmation page
        // router.push("/auth/verify-email");
      } else {
        toast.success("Account created! Welcome to Rihla.");
        router.push("/dashboard");
      }
    } else {
      // Sign in
      const { error } = await sb.auth.signInWithPassword({ 
        email: form.email, 
        password: form.password 
      });
      if (error) throw error;
      
      toast.success("Marhaba! Welcome back.");
      router.push("/dashboard");
    }
  } catch (e: any) {
    console.error("Auth error:", e);
    
    // Handle specific Supabase error messages
    if (e.message?.includes("Email rate limit exceeded")) {
      setError("Too many attempts. Please try again later.");
    } else if (e.message?.includes("User already registered")) {
      setError("This email is already registered. Please sign in instead.");
    } else if (e.message?.includes("Password should be at least 6 characters")) {
      setError("Password must be at least 6 characters long.");
    } else {
      setError(e.message || "Something went wrong. Please try again.");
    }
  } finally { 
    setLoading(false); 
  }
};
 const socialAuth = async (provider: "google" | "github") => {
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      }
    });
    if (error) throw error;
  } catch (e: any) {
    setError(e.message || "Failed to authenticate with " + provider);
  }
};

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 zellige-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(200,75,49,0.1), transparent)" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10">
        <Link href="/">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}>
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-display text-2xl text-terra-gradient leading-none">Rihla</div>
              <div className="text-arabic text-sm text-sand-dark opacity-60 leading-none">رحلة</div>
            </div>
          </div>
        </Link>

        <div className="p-8 rounded-2xl" style={{ background: "rgba(28,35,48,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "#0F1419" }}>
            {(["signin", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-heading font-semibold transition-all"
                style={{ background: mode === m ? "linear-gradient(135deg, #C84B31, #E8C98A)" : "transparent", color: mode === m ? "white" : "#7A6E62" }}>
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h2 className="font-display text-3xl text-foreground text-center mb-1">
            {mode === "signin" ? "Welcome back" : "Start your journey"}
          </h2>
          <p className="text-stone-mist text-sm text-center mb-6">
            {mode === "signin" ? "Sign in to your Rihla account" : "Discover Tunisia & the Maghreb with AI"}
          </p>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[{ id: "google", label: "Google" }, { id: "github", label: "GitHub" }].map(({ id, label }) => (
              <motion.button key={id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => socialAuth(id as any)}
                className="btn-outline py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs text-stone-mist font-mono">OR</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name" className="w-full input-rihla pl-10 pr-4 py-3 rounded-xl text-sm" />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className="w-full input-rihla pl-10 pr-4 py-3 rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                <input type={showPwd ? "text" : "password"} required minLength={6}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="w-full input-rihla pl-10 pr-12 py-3 rounded-xl text-sm" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-mist hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
              </motion.div>
            )}
            <motion.button whileHover={{ scale: 1.01 }} type="submit" disabled={loading}
              className="w-full btn-terra py-3.5 rounded-xl text-sm disabled:opacity-60"
              style={{ boxShadow: "0 6px 24px rgba(200,75,49,0.25)" }}>
              {loading ? "Loading…" : mode === "signin" ? "Sign In" : "Create Account"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>;
}
