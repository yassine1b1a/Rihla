# 🧭 Rihla — AI Tourism Ecosystem

**رحلة** (Rihla) — An AI-powered tourism platform designed to transform how travellers discover, plan, and experience destinations across the globe.

> Submitted to **AINC'26** · Theme: Innovative Tourism

---

## 🌐 Live Demo

**Production Ready:** [https://rihla.thprojects.ovh/](https://rihla.thprojects.ovh/)

**Demo Video:** [https://drive.google.com/file/d/1EiIFTieWOUfYV1uNWimLIH2Z2h9s52Lz/view](https://drive.google.com/file/d/1EiIFTieWOUfYV1uNWimLIH2Z2h9s52Lz/view)

**GitHub Repository:** [https://github.com/yassine1b1a/Rihla](https://github.com/yassine1b1a/Rihla)

---

## 🌟 What is Rihla?

Rihla (رحلة) means "journey" in Arabic. It is an AI-powered tourism ecosystem that tackles four interconnected tourism challenges with dedicated AI systems.

⚠️ **Important Note:**
All destinations are dynamically AI-generated and technically support all countries worldwide. For the AINC'26 challenge scope, the platform is intentionally limited to six countries: Tunisia, Morocco, Algeria, Egypt, Jordan, and Libya.

| Challenge                                    | Rihla's AI Solution                               |
| -------------------------------------------- | ------------------------------------------------- |
| Generic, cookie-cutter travel planning       | **Personalised AI Itinerary Generator**           |
| Lack of accessible travel knowledge          | **AI Travel Concierge Chat**                      |
| Lost cultural context at ruins & monuments   | **Heritage Recognition AI** (image & text)        |
| Overtourism & unsustainable visitor patterns | **Sustainability & Crowd Intelligence Dashboard** |

---

## ✨ Core Features

### 1. 🗺️ AI Itinerary Planner (`/itinerary`)

* 5-step wizard: country → style → interests → budget → generate
* Currently limited to 6 countries (challenge scope)
* AI crafts day-by-day itineraries with stops, durations, local tips, accommodation suggestions, and sustainability advice
* Budget levels: budget, mid-range, luxury
* Travel styles: cultural, adventure, relaxation, family, luxury, budget
* Real-time itinerary generation with structured fallback handling
* Destinations are AI-generated dynamically

### 2. 🤖 AI Travel Concierge (`/explore`)

* Real-time conversational assistant
* Expert-level knowledge about selected destinations
* Country context switching within the 6 supported countries
* Sidebar with quick prompts and destination shortcuts
* Conversation history with markdown rendering

### 3. 🏛️ Heritage Recognition AI (`/heritage`)

* Two modes: **Describe it** (text) or **Upload Image**
* Vision model integration for monument recognition
* Identifies ruins, mosques, medinas, archaeological sites, and monuments
* Returns structured cultural data: civilization, period, historical context, key facts, visitor advice, nearby landmarks
* Confidence scoring and UNESCO-style detection logic

### 4. 🌿 Sustainability Dashboard (`/sustainability`)

* Per-destination, per-month environmental analysis
* Metrics:

  * Eco score (0–100)
  * Crowd forecast (low / moderate / high)
  * Carbon footprint estimate (kg per visitor)
  * Water stress indicator
* 12-month trend visualisation
* Responsible travel recommendations
* Alternative destination suggestions during overcrowded periods
* AI-generated sustainability insights

---

## 🛠 Tech Stack

| Layer                    | Technology                             |
| ------------------------ | -------------------------------------- |
| **Framework**            | Next.js 14 (App Router)                |
| **Language**             | TypeScript                             |
| **Styling**              | Tailwind CSS                           |
| **Database & Auth**      | Supabase (PostgreSQL + Authentication) |
| **AI/LLM Gateway**       | OpenRouter                             |
| **Vision Model**         | NVIDIA Nemotron Nano 12B 2 VL          |
| **Large Language Model** | LLaMA 3.3 70B                          |
| **Charts**               | Recharts                               |
| **Animations**           | Framer Motion                          |
| **Deployment**           | Vercel                                 |

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yassine1b1a/Rihla.git
cd Rihla
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 3. Database Setup

1. Create a Supabase project
2. Run the schema from `supabase/schema.sql`
3. Enable OAuth providers if needed

### 4. Run Development Server

```bash
npm run dev
```

### 5. Production Build

```bash
npm run build
npm start
```

---

## 🗺️ Pages Overview

| Route             | Feature                | Description                                           |
| ----------------- | ---------------------- | ----------------------------------------------------- |
| `/`               | Landing                | Hero section, features grid, destination preview, CTA |
| `/itinerary`      | AI Itinerary Generator | 5-step AI wizard                                      |
| `/explore`        | AI Travel Guide        | Conversational travel assistant                       |
| `/heritage`       | Heritage Recognition   | Image & text monument analysis                        |
| `/sustainability` | Eco Dashboard          | Monthly eco & crowd analytics                         |
| `/auth`           | Authentication         | Email & OAuth login                                   |
| `/dashboard`      | User Dashboard         | Central access to tools                               |

---

## 🌍 Destinations Scope

Rihla's AI engine can technically generate travel plans for **any country worldwide**.

For AINC'26, the platform is intentionally focused on:

* 🇹🇳 Tunisia
* 🇲🇦 Morocco
* 🇩🇿 Algeria
* 🇪🇬 Egypt
* 🇯🇴 Jordan
* 🇱🇾 Libya

This controlled scope ensures depth, cultural accuracy, and strong regional specialization while keeping the architecture globally scalable.

---

## 🏆 AINC'26 Innovation Angle

| Innovation                | Implementation                                    |
| ------------------------- | ------------------------------------------------- |
| **Personalisation**       | AI-generated itineraries tailored to user profile |
| **Cultural Intelligence** | Monument recognition via vision AI                |
| **Sustainable Tourism**   | Eco scoring & crowd forecasting system            |
| **Data-Driven Insights**  | Monthly environmental trend analytics             |
| **Scalable Architecture** | Globally adaptable AI destination engine          |

---

## 👥 Team

**Taha Yassine Ben Ali**

* ICT Engineering Student (Networks & Embedded Systems)
* Full-stack Developer & AI Enthusiast
* ENIG, Tunisia

---

## 📄 License

© Rihla Team — Developed for AI Innovation Challenge AINC'26 2026

---

*Rihla — Your journey begins here.* 🧭
