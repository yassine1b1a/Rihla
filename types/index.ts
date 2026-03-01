// types/index.ts

// ─── Destinations ──────────────────────────────────────────────────────────
export type DestinationType = "historical" | "natural" | "coastal" | "urban" | "desert" | "culinary";

// ✅ SOLUTION 1: Garder seulement l'interface (supprimer la ligne 5)
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
  preferences?: {
    theme?: 'dark' | 'light';
    notifications?: boolean;
    language?: 'en' | 'fr' | 'ar';
  };
  sustainability_score?: number;
  saved_itineraries?: string[];
}

export interface Destination {
  id: string;
  name: string;
  name_ar?: string;
  country: string;
  region: string;
  description: string;
  short_desc: string;
  type: DestinationType;
  tags: string[];
  image_url: string;
  lat: number;
  lng: number;
  best_season: string[];
  avg_visit_hours: number;
  sustainability_score: number;
  crowd_level: "low" | "moderate" | "high";
  heritage_site: boolean;
  unesco: boolean;
  created_at: string;
}

// ─── YouTube Videos ────────────────────────────────────────────────────────
export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

// ─── Itinerary Stops with Video Support ───────────────────────────────────
export interface ItineraryStop {
  destination_id?: string;
  name: string;
  duration_hours: number;
  activity: string;
  notes?: string;
  order: number;
  videos?: VideoResult[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  theme: string;
  destinations: ItineraryStop[];
  tips: string;
  accommodation?: string;
}

export type TravelStyle = "adventure" | "cultural" | "relaxation" | "family" | "luxury" | "budget";
export type Budget = "budget" | "mid-range" | "luxury";

export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  country: string;
  duration_days: number;
  travel_style: TravelStyle;
  budget: Budget;
  interests: string[];
  days: ItineraryDay[];
  ai_highlights: string[];
  sustainability_tips: string[];
  estimated_cost: string;
  created_at: string;
  special_requests?: string;
}

// ─── Heritage ──────────────────────────────────────────────────────────────
export interface HeritageSite {
  id: string;
  name: string;
  name_ar?: string;
  country: string;
  city: string;
  period: string;
  civilization: string;
  description: string;
  historical_context: string;
  image_url: string;
  lat: number;
  lng: number;
  unesco: boolean;
  tags: string[];
  visitor_tips: string;
  best_time: string;
}

// ─── Sustainability ────────────────────────────────────────────────────────
export interface DestinationStats {
  destination_id: string;
  destination_name: string;
  month: string;
  visitor_count: number;
  capacity: number;
  co2_per_visitor: number;
  water_stress: "low" | "moderate" | "high";
  eco_score: number;
  tips: string[];
}

// ─── Chat ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

// ─── User / Auth ───────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: "en" | "fr" | "ar";
  travel_style: TravelStyle | null;
  saved_destinations: string[];
  created_at: string;
  university?: string | null;
}

// ─── Heritage Recognition ─────────────────────────────────────────────────
export interface RecognitionResult {
  site_name: string;
  confidence: number;
  country: string;
  period: string;
  civilization: string;
  description: string;
  fun_facts: string[];
  visitor_tips: string;
  nearby_sites: string[];
}