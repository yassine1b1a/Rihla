/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display:  ["'Cormorant Garamond'", "Georgia", "serif"],
        heading:  ["'Outfit'", "sans-serif"],
        body:     ["'Lato'", "sans-serif"],
        arabic:   ["'Noto Naskh Arabic'", "serif"],
        mono:     ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        /* Brand palette — Tunisian terracotta + Mediterranean teal */
        terra:  { DEFAULT: "#C84B31", light: "#E8694A", dark: "#9A3420" },
        sand:   { DEFAULT: "#E8C98A", light: "#F5E4BE", dark: "#C4A55A" },
        teal:   { DEFAULT: "#1A7A6E", light: "#2BA899", dark: "#105248" },
        night:  { DEFAULT: "#0F1419", mid: "#1C2330", soft: "#252F3F" },
        stone:  { DEFAULT: "#4A4033", light: "#7A6E62", mist: "#BDB5A8" },
        /* Semantic */
        background: "#0F1419",
        foreground:  "#F0EBE3",
        border:      "#252F3F",
        muted:       "#3A4556",
      },
      backgroundImage: {
        "zellige": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C84B31' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        "gradient-terra": "linear-gradient(135deg, #C84B31 0%, #E8694A 50%, #C4A55A 100%)",
        "gradient-teal":  "linear-gradient(135deg, #105248 0%, #1A7A6E 100%)",
        "gradient-hero":  "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,75,49,0.18) 0%, rgba(15,20,25,0) 70%)",
      },
      borderRadius: {
        lg: "0.75rem", md: "0.5rem", sm: "0.25rem",
      },
      keyframes: {
        "fade-up":    { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in":    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer:      { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float:        { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
        "spin-slow":  { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        pulse:        { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
      },
      animation: {
        "fade-up":   "fade-up 0.6s ease-out forwards",
        "fade-in":   "fade-in 0.4s ease-out forwards",
        shimmer:     "shimmer 2s linear infinite",
        float:       "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        pulse:       "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
