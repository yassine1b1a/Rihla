import { NextRequest, NextResponse } from "next/server";
import { getSustainabilityInsights } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  console.log("🌍 Sustainability API: Received request");
  
  try {
    const body = await req.json();
    console.log("🌍 Request body:", body);

    // Validate input
    if (!body.name || !body.country || !body.month) {
      return NextResponse.json(
        { error: "Missing required fields: name, country, and month are required" },
        { status: 400 }
      );
    }

    // Validate month
    const validMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!validMonths.includes(body.month)) {
      return NextResponse.json(
        { error: "Invalid month. Must be three-letter abbreviation (e.g., Jan, Feb)" },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("🌍 OPENROUTER_API_KEY is not set");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Call OpenRouter
    console.log("🌍 Calling getSustainabilityInsights...");
    const result = await getSustainabilityInsights({
      name: body.name,
      country: body.country,
      month: body.month,
      visitor_count: body.visitor_count
    });

    console.log("🌍 Sustainability insights generated successfully");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🌍 Sustainability API Error:", {
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack
    });

    // Check for specific OpenRouter errors
    if (error.status === 404) {
      return NextResponse.json(
        { error: "The selected AI model is not available. Please try again later." },
        { status: 503 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to generate sustainability insights",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}