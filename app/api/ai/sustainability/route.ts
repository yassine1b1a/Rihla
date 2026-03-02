import { NextRequest, NextResponse } from "next/server";
import { getSustainabilityInsights } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  console.log("🌍 Sustainability API: Received request");
  
  try {
    const body = await req.json();
    console.log("🌍 Request body:", body);

    // Validate input - name is now optional if lat/lon provided
    if (!body.month) {
      return NextResponse.json(
        { error: "Missing required field: month is required" },
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

    // Check if we have either (name and country) or (lat and lon)
    if (!body.name && !body.country && (!body.lat || !body.lon)) {
      return NextResponse.json(
        { error: "Missing location information. Provide either (name and country) or (lat and lon)" },
        { status: 400 }
      );
    }

    // If lat/lon provided but no name/country, reverse geocode to get location name
    let locationName = body.name;
    let locationCountry = body.country;

    if (body.lat && body.lon && (!body.name || !body.country)) {
      try {
        // Reverse geocoding using OpenStreetMap Nominatim API
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${body.lat}&lon=${body.lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Rihla-Tourism-App/1.0'
            }
          }
        );
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          const address = geoData.address || {};
          
          // Extract city/town/village name
          locationName = address.city || address.town || address.village || address.suburb || geoData.display_name?.split(',')[0] || body.name || "Unknown location";
          
          // Extract country
          locationCountry = address.country || body.country || "Unknown";
          
          console.log("🌍 Reverse geocoded:", { locationName, locationCountry });
        }
      } catch (geoError) {
        console.error("🌍 Reverse geocoding error:", geoError);
        // Continue with provided values or defaults
        locationName = body.name || "Unknown location";
        locationCountry = body.country || "Unknown";
      }
    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("🌍 OPENROUTER_API_KEY is not set");
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Call OpenRouter with enhanced location info
    console.log("🌍 Calling getSustainabilityInsights with:", {
      name: locationName,
      country: locationCountry,
      month: body.month,
      hasCoordinates: !!(body.lat && body.lon)
    });

    const result = await getSustainabilityInsights({
      name: locationName,
      country: locationCountry,
      month: body.month,
      visitor_count: body.visitor_count,
      lat: body.lat,
      lon: body.lon
    });

    console.log("🌍 Sustainability insights generated successfully");
    
    // Add location info to response
    return NextResponse.json({
      ...result,
      location: {
        name: locationName,
        country: locationCountry,
        lat: body.lat,
        lon: body.lon
      }
    });

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
