"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Brain,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  Menu,
  Compass,
  Sparkles,
  Camera,
  Leaf,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/itinerary", label: "Plan a Trip", icon: Sparkles },
  { href: "/explore", label: "AI Guide", icon: Brain },
  { href: "/heritage", label: "Heritage", icon: Camera },
  { href: "/sustainability", label: "Eco Dashboard", icon: Leaf },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Créer un profil compatible avec UserProfile
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email ?? "",
          full_name: data.user.user_metadata?.full_name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          travel_style: data.user.user_metadata?.travel_style || null,
          saved_destinations: data.user.user_metadata?.saved_destinations || [],
          created_at: data.user.created_at,
        };
        setProfile(userProfile);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "#1E1E2E" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}
        >
          <Compass className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-2xl text-terra-gradient"
          >
            Rihla
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {SIDEBAR_LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative"
                style={{
                  background: active ? "rgba(200,75,49,0.12)" : "transparent",
                  border: `1px solid ${active ? "rgba(200,75,49,0.25)" : "transparent"}`,
                  color: active ? "#C84B31" : "#888",
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-heading font-medium">{link.label}</span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Profile + sign out */}
      <div className="px-3 pb-4 border-t pt-4 space-y-2" style={{ borderColor: "#1E1E2E" }}>
        {profile && !collapsed && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: "#0A0A0F" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C84B31, #E8C98A)" }}
            >
              {(profile.full_name || profile.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{profile.full_name || "Explorer"}</div>
              <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-heading">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0F1419] overflow-hidden">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col relative border-r flex-shrink-0"
        style={{ background: "rgba(15,20,25,0.95)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center border text-stone-mist hover:text-white transition-colors z-10"
          style={{ background: "#0F1419", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft className="w-3 h-3" />
          </motion.div>
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 border-r flex flex-col" style={{ background: "#0F1419", borderColor: "rgba(255,255,255,0.06)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 h-14 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(15,20,25,0.95)" }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-stone-mist hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display text-xl text-terra-gradient">Rihla</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}