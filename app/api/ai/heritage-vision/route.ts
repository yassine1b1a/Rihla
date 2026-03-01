// app/api/ai/heritage-vision/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

// ✅ Ajoutez cette fonction pour gérer OPTIONS (pré-flight CORS)
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log("👁️ Heritage Vision API: Received POST request");
  
  // ✅ Ajoutez les headers CORS à toutes les réponses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const country = formData.get('country') as string || "Tunisia";
    const userPrompt = formData.get('prompt') as string || "Identify this heritage site";

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convertir l'image en base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const imageUrl = `data:${imageFile.type};base64,${base64Image}`;

    console.log("👁️ Using NVIDIA Nemotron Nano 12B V2 VL (free)");
    console.log("Image size:", Math.round(base64Image.length / 1024), "KB");

    const completion = await openrouter.chat.completions.create({
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      messages: [
        {
          role: "system",
          content: `You are Rihla AI, a heritage recognition expert specializing in North African and Maghrebi cultural sites. 
          Identify monuments, landmarks, and heritage sites from images. Provide rich historical context and practical information.
          Always respond in valid JSON format.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: `${userPrompt} in ${country}. 
              
              IMPORTANT: Return ONLY valid JSON with this exact structure (no other text):
              {
                "site_name": "Name of the site",
                "confidence": 85,
                "country": "${country}",
                "city": "City name if known",
                "period": "Historical period",
                "civilization": "Civilization name",
                "description": "Detailed description of what you see",
                "historical_context": "Historical context and significance",
                "fun_facts": ["Interesting fact 1", "Interesting fact 2", "Interesting fact 3"],
                "visitor_tips": "Practical tips for visitors",
                "nearby_sites": ["Nearby site 1", "Nearby site 2"],
                "best_time_to_visit": "Best time information"
              }`,
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error("No response from vision model");
    }

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error("Empty response from vision model");
    }

    console.log("👁️ Vision response received, length:", response.length);

    // Nettoyer et parser le JSON
    try {
      let jsonContent = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      jsonContent = jsonMatch[0];
      const parsed = JSON.parse(jsonContent);
      
      return NextResponse.json({
        site_name: parsed.site_name || "Heritage Site",
        confidence: parsed.confidence || 70,
        country: parsed.country || country,
        city: parsed.city || "Unknown",
        period: parsed.period || "Historical period",
        civilization: parsed.civilization || "Unknown",
        description: parsed.description || response.substring(0, 200),
        historical_context: parsed.historical_context || "Historical context not available",
        fun_facts: Array.isArray(parsed.fun_facts) ? parsed.fun_facts : ["Site historique important"],
        visitor_tips: parsed.visitor_tips || "Visit during daylight hours",
        nearby_sites: Array.isArray(parsed.nearby_sites) ? parsed.nearby_sites : [],
        best_time_to_visit: parsed.best_time_to_visit || "Spring or Autumn"
      }, { headers: corsHeaders });
      
    } catch (parseError) {
      console.log("Could not parse JSON, returning formatted text");
      
      return NextResponse.json({ 
        site_name: "Heritage Site",
        description: response.substring(0, 500),
        confidence: 60,
        country: country,
        period: "Unknown",
        civilization: "Unknown",
        fun_facts: ["Site identifié avec succès"],
        visitor_tips: "Consultez un guide local pour plus d'informations",
        nearby_sites: []
      }, { headers: corsHeaders });
    }

  } catch (error: any) {
    console.error("👁️ Heritage Vision API Error:", {
      message: error.message,
      status: error.status,
    });
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenRouter API key" },
        { status: 401, headers: corsHeaders }
      );
    }
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  return NextResponse.json({ 
    message: "Heritage Vision API with NVIDIA Nemotron",
    model: "nvidia/nemotron-nano-12b-v2-vl:free",
    status: "running"
  }, { headers: corsHeaders });
}
