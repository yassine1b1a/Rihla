# 🧭 Rihla — AI Tourism Ecosystem

**رحلة** (Rihla) — An AI-powered tourism platform designed to transform how travellers discover, plan, and experience Tunisia and the broader Maghreb region.

> Submitted to **AINC'26 — Algeria AI Innovation Challenge** · Theme: Innovative Tourism

---
Production Ready : https://rihla.thprojects.ovh/
Demo Video Link : https://drive.google.com/file/d/1EiIFTieWOUfYV1uNWimLIH2Z2h9s52Lz/view
## 🌟 What is Rihla?

Rihla tackles four interconnected tourism challenges with dedicated AI solutions:

| Challenge | Rihla's AI Solution |
|-----------|-------------------|
| Generic, cookie-cutter travel planning | **Personalised AI Itinerary Generator** |
| Language & knowledge barriers at heritage sites | **AI Travel Concierge Chat** |
| Lost cultural context at ruins & monuments | **Heritage Recognition AI** |
| Overtourism & unsustainable visitor patterns | **Sustainability & Crowd Intelligence Dashboard** |

---

## ✨ Core Features

### 1. 🗺️ AI Itinerary Planner (`/itinerary`)
- 5-step wizard: country → style → interests → generate
- Supports Tunisia, Morocco, Algeria, Egypt, Jordan
- AI crafts day-by-day itineraries with stops, durations, local tips, accommodation, and sustainability advice
- Budget levels: backpacker → mid-range → luxury
- Travel styles: cultural, adventure, relaxation, family, luxury, budget

### 2. 🤖 AI Travel Concierge (`/explore`)
- Real-time chat powered by LLaMA 3.3 70B via OpenRouter
- Expert on: Tunisian medinas, Sahara, coastal towns, food, culture, etiquette, safety
- Country context switching (Tunisia, Morocco, Algeria, Egypt, Jordan)
- Sidebar with quick questions and destination shortcuts
- Supports English, French, Arabic prompts

### 3. 🏛️ Heritage Recognition AI (`/heritage`)
- Two modes: **Describe it** (text) or **Image URL**
- Identifies ruins, mosques, medinas, archaeological sites, monuments
- Returns: site name, civilization, period, historical context, fun facts, visitor tips, nearby sites
- Curated heritage library: El Jem amphitheatre, Carthage, Kairouan Great Mosque, Bardo Museum

### 4. 🌿 Sustainability Dashboard (`/sustainability`)
- Per-destination, per-month eco analysis
- Metrics: eco score, crowd forecast, carbon estimate, water stress
- 12-month visitor and eco-score trend charts (Recharts)
- Responsible travel tips, local eco initiatives, alternative destinations
- Carrying capacity alerts for overcrowded periods

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Animations | Framer Motion |
| Styling | Tailwind CSS + custom design system |
| Database | Supabase (PostgreSQL + Auth) |
| AI/LLM | OpenRouter — LLaMA 3.3 70B |
| Charts | Recharts |
| Typography | Cormorant Garamond + Outfit + Lato + Noto Naskh Arabic |
| Icons | Lucide React |
| Notifications | Sonner |

---

## 🎨 Design System

**Aesthetic:** Mediterranean Luxury — terracotta warmth, sand gold, deep teal, and Arabic geometric (zellige) patterns.

| Token | Value | Use |
|-------|-------|-----|
| `terra` | `#C84B31` | Primary CTAs, accents |
| `sand` | `#E8C98A` | Gold highlights, Arabic text |
| `teal` | `#1A7A6E` | Heritage, eco, secondary |
| `night` | `#0F1419` | Background |
| `stone` | `#4A4033` | Muted text |

**Fonts:**
- **Cormorant Garamond** — display headings (editorial, serif luxury)
- **Outfit** — UI headings and navigation
- **Lato** — body text
- **Noto Naskh Arabic** — Arabic script elements
- **JetBrains Mono** — labels and code

---

## 🚀 Setup

### 1. Install

```bash
git clone <repo>
cd rihla
npm install
```

### 2. Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable Google & GitHub OAuth in Authentication > Providers

### 3. OpenRouter Setup

1. Get API key at [openrouter.ai](https://openrouter.ai)
2. The app uses `meta-llama/llama-3.3-70b-instruct` (chat, itinerary, heritage)
3. And `meta-llama/llama-3.1-8b-instruct:free` for sustainability analysis

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## 📂 Project Structure

```
rihla/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx / globals.css    # Root layout + design system
│   ├── auth/page.tsx               # Login / signup
│   ├── dashboard/page.tsx          # User dashboard
│   ├── itinerary/page.tsx          # 🗺️ AI Itinerary Generator
│   ├── explore/page.tsx            # 🤖 AI Travel Chat
│   ├── heritage/page.tsx           # 🏛️ Heritage Recognition
│   ├── sustainability/page.tsx     # 🌿 Eco Dashboard
│   └── api/ai/
│       ├── chat/route.ts           # Chat API
│       ├── itinerary/route.ts      # Itinerary API
│       ├── heritage/route.ts       # Heritage API
│       └── sustainability/route.ts # Eco insights API
├── components/layout/Navbar.tsx
├── lib/
│   ├── openrouter.ts              # All 4 AI functions
│   ├── supabase/                  # Client, server, middleware
│   └── data/destinations.ts      # Tunisia + regional seed data
├── types/index.ts
├── supabase/schema.sql
└── .env.local.example
```

---

## 🗺️ Pages Overview

| Route | Feature |
|-------|---------|
| `/` | Landing — hero, features, destinations, CTA |
| `/itinerary` | AI Itinerary Generator wizard |
| `/explore` | AI chat travel guide |
| `/heritage` | Heritage recognition (text/image) |
| `/sustainability` | Eco & crowd dashboard |
| `/auth` | Login / signup (email + OAuth) |
| `/dashboard` | User home with quick access |

---

## 🌍 Destinations Covered

**Tunisia:** Sidi Bou Said, Carthage, Kairouan, Djerba, Tataouine & Ksour, Tozeur & Chott el-Jerid, Tunis Medina, Douz Sahara

**Morocco:** Chefchaouen

**Algeria:** Casbah of Algiers

**Heritage Sites:** El Jem Amphitheatre, Dougga, Great Mosque of Kairouan, Bardo National Museum

---

## 🏆 AINC'26 Innovation Angle

Rihla directly addresses the AINC'26 tourism innovation mandate:
- **Personalisation** — AI itineraries matched to each traveller's unique profile
- **Cultural Heritage** — AI unlocks history of every monument, in any language
- **Destination Management** — Crowd intelligence guides sustainable visitation
- **Data-driven Tourism** — Eco scores and monthly trend analytics inform decisions
- **Maghreb Focus** — Deep, specific knowledge of Tunisia and North African destinations

---

## 📄 License

MIT © Rihla Team — Built for AINC'26 AI Innovation Challenge 2026
# Rihla
# Rihla
