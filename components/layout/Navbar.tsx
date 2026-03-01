"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Compass, Menu, X, LogIn, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/itinerary",     label: "Plan Trip" },
  { href: "/explore",       label: "AI Guide" },
  { href: "/heritage",      label: "Heritage" },
  { href: "/sustainability", label: "Eco Insights" },
];

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { scrollY } = useScroll();
  const bgOp = useTransform(scrollY, [0, 60], [0, 1]);

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
      <motion.header className="fixed top-0 inset-x-0 z-50">
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
          <div className="hidden md:flex items-center gap-1">
            {LINKS.map(({ href, label }) => {
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
                    <span className="relative z-10">{label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right side: Auth only */}
          <div className="hidden md:flex items-center gap-3">
            {/* Auth buttons */}
            {user ? (
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-semibold btn-terra"
                >
                  <User className="w-4 h-4" /> Dashboard
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <motion.button whileHover={{ scale: 1.03 }} className="btn-outline px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </motion.button>
                </Link>
                <Link href="/auth?mode=signup">
                  <motion.button whileHover={{ scale: 1.03 }} className="btn-terra px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    Start Free
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Burger only */}
          <div className="flex md:hidden items-center gap-2">
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
        >
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="px-4 py-3 rounded-lg text-sm font-heading font-medium text-stone-mist hover:text-terra-light transition-colors"
              >
                {label}
              </motion.div>
            </Link>
          ))}
          
          {/* Mobile auth */}
          {user ? (
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="mt-2 px-4 py-3 rounded-lg text-sm font-heading font-bold btn-terra text-center"
              >
                Dashboard
              </motion.div>
            </Link>
          ) : (
            <>
              <Link href="/auth" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="mt-2 px-4 py-3 rounded-lg text-sm font-heading font-medium btn-outline text-center"
                >
                  Sign In
                </motion.div>
              </Link>
              <Link href="/auth?mode=signup" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="mt-2 px-4 py-3 rounded-lg text-sm font-heading font-bold btn-terra text-center"
                >
                  Start Free
                </motion.div>
              </Link>
            </>
          )}
        </motion.div>
      )}
    </>
  );
}