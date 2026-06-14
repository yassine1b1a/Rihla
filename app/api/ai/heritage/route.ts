import { NextRequest, NextResponse } from "next/server";
import { recognizeHeritage } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  console.log("📸 Heritage API: Received request");
  
  try {
    const body = await req.json();
    console.log("📸 Request body:", { type: body.type, country_hint: body.country_hint });

    // Validate input
    if (!body.value || !body.value.trim()) {
      return NextResponse.json(
        { error: "Description or image URL is required" },
        { status: 400 }
      );
    }

    if (body.type !== "description" && body.type !== "image_url") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'description' or 'image_url'" },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("📸 OPENROUTER_API_KEY is not set");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Call OpenRouter with openrouter/auto
    console.log("📸 Calling recognizeHeritage with openrouter/auto...");
    const result = await recognizeHeritage({
      type: body.type,
      value: body.value,
      country_hint: body.country_hint || "Tunisia",
      model: "openrouter/auto"  // Added this line
    });

    console.log("📸 Recognition successful");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("📸 Heritage API Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: "Failed to recognize heritage site",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
