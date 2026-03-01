"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  HeartPulse,
  Leaf,
  MapPin,
  Search,
  Filter,
  ExternalLink,
  Github,
  Star,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import type { Project } from "@/types";

const THEME_ICONS: Record<string, any> = {
  technology: Cpu, healthcare: HeartPulse, environment: Leaf, tourism: MapPin,
};
const THEME_COLORS: Record<string, string> = {
  technology: "#FF5C1A", healthcare: "#00C9B1", environment: "#4ADE80", tourism: "#FFB830",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", under_review: "Under Review",
  selected: "Selected 🏆", rejected: "Not Selected",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#888", submitted: "#FFB830", under_review: "#00C9B1",
  selected: "#4ADE80", rejected: "#EF4444",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from("projects")
        .select("*, team:teams(name)")
        .in("status", ["submitted", "under_review", "selected"])
        .order("created_at", { ascending: false });

      const { data } = await query;
      setProjects(data as any || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchTheme = themeFilter === "all" || p.theme === themeFilter;
    return matchSearch && matchTheme;
  });

  return (
    <div className="min-h-screen bg-ainc-darker">
      <Navbar />

      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,92,26,0.03) 1px, transparent 1px), linear-gradient(to right, rgba(255,92,26,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="font-mono text-xs text-ainc-orange tracking-widest uppercase">AINC'26</span>
          <h1 className="font-heading font-extrabold text-5xl mt-2 mb-3">
            Innovation <span className="text-gradient-orange">Showcase</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Explore AI projects from Algeria's brightest minds tackling real-world challenges.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div
            className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg"
            style={{ background: "#111118", border: "1px solid #1E1E2E" }}
          >
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex gap-2">
            {["all", "technology", "healthcare", "environment", "tourism"].map((t) => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.95 }}
                onClick={() => setThemeFilter(t)}
                className="px-3 py-2 rounded-lg text-xs font-mono capitalize transition-all"
                style={{
                  background: themeFilter === t ? "rgba(255,92,26,0.15)" : "#111118",
                  border: `1px solid ${themeFilter === t ? "#FF5C1A" : "#1E1E2E"}`,
                  color: themeFilter === t ? "#FF5C1A" : "#888",
                }}
              >
                {t === "tourism" ? "tourism" : t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl animate-pulse"
                style={{ background: "#111118" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading font-bold text-xl mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to submit your innovation!</p>
            <Link href="/submit">
              <motion.button
                whileHover={{ scale: 1.04 }}
                className="px-6 py-3 rounded-xl font-heading font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #FF5C1A, #FFB830)" }}
              >
                Submit Project
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project, i) => {
              const Icon = THEME_ICONS[project.theme] || Cpu;
              const color = THEME_COLORS[project.theme] || "#FF5C1A";

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="group p-6 rounded-xl cursor-pointer flex flex-col transition-all"
                  style={{
                    background: "#111118",
                    border: "1px solid #1E1E2E",
                  }}
                >
                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {project.status === "selected" && (
                        <Trophy className="w-4 h-4 text-ainc-gold" />
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{
                          background: `${STATUS_COLORS[project.status]}15`,
                          color: STATUS_COLORS[project.status],
                          border: `1px solid ${STATUS_COLORS[project.status]}30`,
                        }}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-lg mb-2 leading-snug group-hover:text-ainc-orange transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(project.ai_technologies || []).slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2 py-0.5 rounded font-mono"
                        style={{ background: "#0A0A0F", color: "#666", border: "1px solid #1E1E2E" }}
                      >
                        {tech}
                      </span>
                    ))}
                    {(project.ai_technologies?.length || 0) > 3 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        +{project.ai_technologies!.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#1E1E2E" }}>
                    <span className="text-xs text-muted-foreground font-mono">
                      {(project as any).team?.name || "Team"}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 text-muted-foreground hover:text-white" />
                        </a>
                      )}
                      {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-white" />
                        </a>
                      )}
                      {project.ai_score && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-ainc-gold" />
                          <span className="text-xs font-mono text-ainc-gold">{project.ai_score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
