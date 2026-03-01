"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderKanban,
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle,
  Cpu,
  HeartPulse,
  Leaf,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

const THEMES = [
  { id: "technology", label: "Technology", icon: Cpu, color: "#FF5C1A", desc: "AI in tech, smart cities, edtech" },
  { id: "healthcare", label: "Healthcare", icon: HeartPulse, color: "#00C9B1", desc: "Medical AI, diagnostics, mental health" },
  { id: "environment", label: "Environment", icon: Leaf, color: "#4ADE80", desc: "Climate, energy, sustainability" },
  { id: "tourism", label: "Innovative Tourism", icon: MapPin, color: "#FFB830", desc: "Travel AI, heritage, smart destinations" },
];

const AI_TECH_OPTIONS = [
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
  "Generative AI", "LLMs", "Reinforcement Learning", "Knowledge Graphs",
  "Recommendation Systems", "Anomaly Detection", "Time Series",
  "Federated Learning", "RAG", "Voice AI",
];

const STEPS = ["Team", "Theme", "Project", "Solution", "Review"];

function SubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const [form, setForm] = useState({
    teamName: "",
    teamDesc: "",
    theme: searchParams.get("theme") || "",
    title: searchParams.get("title") || "",
    description: "",
    problem: searchParams.get("problem") || "",
    solution: "",
    aiTechs: [] as string[],
    impact: "",
    github: "",
    demo: "",
  });

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggleTech = (tech: string) => {
    setForm((p) => ({
      ...p,
      aiTechs: p.aiTechs.includes(tech)
        ? p.aiTechs.filter((t) => t !== tech)
        : [...p.aiTechs, tech],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      // Create or get team
      const { data: team, error: teamErr } = await supabase
        .from("teams")
        .insert({ name: form.teamName, description: form.teamDesc, leader_id: user.id })
        .select()
        .single();

      if (teamErr) throw teamErr;

      // Add user as team leader
      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "leader",
      });

      // Create project
      const { error: projErr } = await supabase.from("projects").insert({
        team_id: team.id,
        title: form.title,
        description: form.description,
        theme: form.theme as any,
        problem_statement: form.problem,
        proposed_solution: form.solution,
        ai_technologies: form.aiTechs,
        expected_impact: form.impact,
        github_url: form.github || null,
        demo_url: form.demo || null,
        status: "submitted",
      });

      if (projErr) throw projErr;

      // Trigger AI evaluation in background
      fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id }),
      }).catch(() => {});

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ainc-darker flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #FF5C1A, #FFB830)" }}
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="font-heading font-extrabold text-4xl mb-3 text-gradient-orange">
            Project Submitted!
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your project has been submitted to AINC'26. Our AI is now evaluating your
            submission. You'll receive feedback in your dashboard.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 rounded-xl font-heading font-bold"
            style={{ background: "linear-gradient(135deg, #FF5C1A, #FFB830)" }}
          >
            Go to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const selectedTheme = THEMES.find((t) => t.id === form.theme);

  const isStepValid = () => {
    if (step === 0) return form.teamName.trim().length > 0;
    if (step === 1) return form.theme !== "";
    if (step === 2) return form.title.trim() && form.description.trim() && form.problem.trim();
    if (step === 3) return form.solution.trim() && form.aiTechs.length > 0 && form.impact.trim();
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                Team Name *
              </label>
              <input
                value={form.teamName}
                onChange={(e) => update("teamName", e.target.value)}
                placeholder="e.g. Team Innovators"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                Team Description
              </label>
              <textarea
                value={form.teamDesc}
                onChange={(e) => update("teamDesc", e.target.value)}
                placeholder="Brief description of your team and members..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const sel = form.theme === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => update("theme", t.id)}
                  className="p-5 rounded-xl text-left transition-all"
                  style={{
                    background: sel ? `${t.color}12` : "#0A0A0F",
                    border: `2px solid ${sel ? t.color : "#1E1E2E"}`,
                  }}
                >
                  <Icon className="w-6 h-6 mb-3" style={{ color: t.color }} />
                  <div className="font-heading font-bold mb-1" style={{ color: sel ? t.color : "#fff" }}>
                    {t.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </motion.button>
              );
            })}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            {[
              { key: "title", label: "Project Title", placeholder: "A concise, impactful title", multiline: false },
              { key: "description", label: "Project Description", placeholder: "Briefly describe your project (2-3 sentences)...", multiline: true },
              { key: "problem", label: "Problem Statement", placeholder: "What specific problem are you solving? Who is affected?", multiline: true },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  {f.label} *
                </label>
                {f.multiline ? (
                  <textarea
                    value={(form as any)[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                    onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                    onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
                  />
                ) : (
                  <input
                    value={(form as any)[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                    onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                    onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                Proposed Solution *
              </label>
              <textarea
                value={form.solution}
                onChange={(e) => update("solution", e.target.value)}
                placeholder="Describe your AI-powered solution in detail. How does it work?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                AI Technologies Used * (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {AI_TECH_OPTIONS.map((tech) => {
                  const sel = form.aiTechs.includes(tech);
                  return (
                    <motion.button
                      key={tech}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTech(tech)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                      style={{
                        background: sel ? "rgba(255,92,26,0.2)" : "#0A0A0F",
                        border: `1px solid ${sel ? "#FF5C1A" : "#1E1E2E"}`,
                        color: sel ? "#FF5C1A" : "#888",
                      }}
                    >
                      {sel ? "✓ " : ""}{tech}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                Expected Impact *
              </label>
              <textarea
                value={form.impact}
                onChange={(e) => update("impact", e.target.value)}
                placeholder="Who will benefit? What's the scale of impact? How will it improve lives in Algeria?"
                rows={3}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "github", label: "GitHub URL", placeholder: "https://github.com/..." },
                { key: "demo", label: "Demo URL (optional)", placeholder: "https://demo.example.com" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                    {f.label}
                  </label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={{ background: "#0A0A0F", border: "1px solid #1E1E2E", color: "#fff" }}
                    onFocus={(e) => (e.target.style.borderColor = "#FF5C1A")}
                    onBlur={(e) => (e.target.style.borderColor = "#1E1E2E")}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {[
              { label: "Team", value: form.teamName },
              { label: "Theme", value: selectedTheme?.label },
              { label: "Project Title", value: form.title },
              { label: "AI Technologies", value: form.aiTechs.join(", ") || "None selected" },
              { label: "GitHub", value: form.github || "Not provided" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex gap-4 p-4 rounded-lg"
                style={{ background: "#0A0A0F", border: "1px solid #1E1E2E" }}
              >
                <div className="text-xs font-mono text-muted-foreground uppercase w-32 flex-shrink-0 pt-0.5">
                  {item.label}
                </div>
                <div className="text-sm flex-1">{item.value || "—"}</div>
              </div>
            ))}
            <div
              className="p-4 rounded-lg text-sm text-muted-foreground"
              style={{ background: "rgba(255,92,26,0.06)", border: "1px solid rgba(255,92,26,0.2)" }}
            >
              ✨ After submission, our AI will automatically evaluate your project and provide detailed feedback.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-ainc-darker">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="flex items-center gap-2 justify-center mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF5C1A, #FFB830)" }}
            >
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="font-heading font-extrabold text-4xl mb-2">
            Submit Your <span className="text-gradient-orange">Project</span>
          </h1>
          <p className="text-muted-foreground">Complete all steps to submit your AINC'26 entry</p>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all"
                  style={{
                    background:
                      i < step
                        ? "linear-gradient(135deg, #FF5C1A, #FFB830)"
                        : i === step
                        ? "#FF5C1A"
                        : "#1E1E2E",
                    color: i <= step ? "white" : "#555",
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <div
                  className="text-xs mt-1 font-mono hidden sm:block"
                  style={{ color: i === step ? "#FF5C1A" : "#555" }}
                >
                  {s}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-2 transition-all"
                  style={{ background: i < step ? "#FF5C1A" : "#1E1E2E" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-2xl mb-6"
          style={{ background: "#111118", border: "1px solid #1E1E2E" }}
        >
          <h2 className="font-heading font-bold text-xl mb-6">{STEPS[step]}</h2>
          {renderStep()}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading font-semibold text-sm disabled:opacity-40 border"
            style={{ borderColor: "#1E1E2E", color: "#888" }}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </motion.button>

          {step < STEPS.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => isStepValid() && setStep(step + 1)}
              disabled={!isStepValid()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-heading font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #FF5C1A, #FFB830)", color: "white" }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-heading font-bold text-sm disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FF5C1A, #FFB830)", color: "white" }}
            >
              {loading ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Project</>}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense>
      <SubmitContent />
    </Suspense>
  );
}
