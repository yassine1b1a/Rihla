"use client";

import { motion } from "framer-motion";
import { useState, Suspense, useEffect } from "react";
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (user) router.push("/dashboard");
    };
    checkUser();
  }, [router, sb]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.name, created_at: new Date().toISOString() },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
        if (data.user && !data.session) {
          toast.success("Check your email to confirm your account!", { duration: 6000 });
        } else {
          toast.success("Account created! Welcome to Rihla.");
          router.push("/dashboard");
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("Marhaba! Welcome back.");
        router.push("/dashboard");
      }
    } catch (e: any) {
      console.error("Auth error:", e);
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

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        }
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || "Failed to authenticate with Google");
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      setLoading(true);
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || "Failed to authenticate with GitHub");
      setLoading(false);
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

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGoogle}
              disabled={loading}
              className="btn-outline py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {"Google"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGithub}
              disabled={loading}
              className="btn-outline py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {"GitHub"}
            </motion.button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs text-stone-mist font-mono">{"OR"}</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">{"Full Name"}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                  <input
                    type="text"
                    required={mode === "signup"}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={"Your name"}
                    className="w-full input-rihla pl-10 pr-4 py-3 rounded-xl text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">{"Email"}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={"you@example.com"}
                  className="w-full input-rihla pl-10 pr-4 py-3 rounded-xl text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-stone-mist uppercase tracking-widest mb-2 block">{"Password"}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-mist" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full input-rihla pl-10 pr-12 py-3 rounded-xl text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-mist hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              type="submit"
              disabled={loading}
              className="w-full btn-terra py-3.5 rounded-xl text-sm disabled:opacity-60"
              style={{ boxShadow: "0 6px 24px rgba(200,75,49,0.25)" }}
            >
              {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
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
