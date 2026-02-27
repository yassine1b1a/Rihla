// app/api/ai/itinerary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  // Log the request
  console.log("📡 API Route: Received POST request to /api/ai/itinerary");
  
  try {
    // Parse request body
    const body = await req.json();
    console.log("📡 Request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.country) {
      console.log("📡 Validation failed: Missing country");
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("📡 OPENROUTER_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Generate itinerary
    console.log("📡 Calling generateItinerary with params:", {
      country: body.country,
      days: body.days || 7,
      style: body.style || "cultural",
      budget: body.budget || "mid-range",
      interests: body.interests || [],
    });

    const result = await generateItinerary({
      country: body.country,
      days: Number(body.days) || 7,
      travel_style: body.style || "cultural",
      budget: body.budget || "mid-range",
      interests: Array.isArray(body.interests) ? body.interests : [],
      special_requests: body.special || undefined,
    });

    console.log("📡 Itinerary generated successfully");
    return NextResponse.json(result);
    
  } catch (error: any) {
    // Log the full error details
    console.error("📡 API Route Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Return a user-friendly error message
    return NextResponse.json(
      { 
        error: "Failed to generate itinerary",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      }, 
      { status: 500 }
    );
  }
}