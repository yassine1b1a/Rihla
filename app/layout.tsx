import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Rihla — AI Tourism Ecosystem",
  description: "Discover Tunisia and beyond with AI-powered travel planning, cultural heritage guides, personalized itineraries, and sustainable destination insights.",
  keywords: ["Tunisia tourism", "AI travel", "cultural heritage", "itinerary planner", "sustainable travel"],
  openGraph: {
    title: "Rihla — Your AI Journey Companion",
    description: "Experience the Maghreb like never before — intelligently",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#1C2330", border: "1px solid #252F3F", color: "#F0EBE3" },
          }}
        />
      </body>
    </html>
  );
}