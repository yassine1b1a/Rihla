// app/api/ai/heritage-vision/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 45000, // Augmenté à 45 secondes
  maxRetries: 3,
  defaultHeaders: {
    "HTTP-Referer": "https://rihla.thprojects.ovh",
    "X-Title": "Rihla - AI Tourism Ecosystem",
  },
});

export async function POST(req: NextRequest) {
  console.log("👁️ Heritage Vision API: Received request");
  
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const country = formData.get('country') as string || "Tunisia";
    const userPrompt = formData.get('prompt') as string || "Identify this heritage site";

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // Vérifier la taille de l'image (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convertir l'image en base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const imageUrl = `data:${imageFile.type};base64,${base64Image}`;

    console.log("👁️ Using NVIDIA Nemotron Nano 12B V2 VL");
    console.log("Image size:", Math.round(base64Image.length / 1024), "KB");

    // Utiliser un AbortController pour gérer le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const completion = await openrouter.chat.completions.create({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "system",
            content: `You are Rihla AI, a heritage recognition expert. Identify monuments, landmarks, and heritage sites from images. Provide rich historical context and practical information. Always respond in valid JSON format.`
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
                text: `${userPrompt} in ${country}. Return ONLY valid JSON with this structure: {
                  "site_name": "Name of the site",
                  "confidence": 85,
                  "country": "${country}",
                  "city": "City name if known",
                  "period": "Historical period",
                  "civilization": "Civilization name",
                  "description": "Detailed description",
                  "historical_context": "Historical context",
                  "fun_facts": ["Fact 1", "Fact 2", "Fact 3"],
                  "visitor_tips": "Practical tips",
                  "nearby_sites": ["Site 1", "Site 2"],
                  "best_time_to_visit": "Best time"
                }`,
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Vérifier la réponse
      if (!completion.choices?.[0]?.message?.content) {
        throw new Error("Empty response from vision model");
      }

      const response = completion.choices[0].message.content;
      console.log("👁️ Vision response received, length:", response.length);

      // Nettoyer et parser le JSON
      try {
        // Enlever les marqueurs de code markdown
        let jsonContent = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Trouver le premier objet JSON valide
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // Si pas de JSON, retourner la réponse comme description
          return NextResponse.json({
            site_name: "Heritage Site",
            description: response.substring(0, 500),
            confidence: 70,
            country: country,
            historical_context: "Analysis complete",
            fun_facts: ["Site identified successfully"],
            visitor_tips: "Visit during daylight hours",
            nearby_sites: []
          });
        }
        
        jsonContent = jsonMatch[0];
        const parsed = JSON.parse(jsonContent);
        
        return NextResponse.json({
          site_name: parsed.site_name || "Heritage Site",
          confidence: parsed.confidence || 70,
          country: parsed.country || country,
          city: parsed.city || "Unknown",
          period: parsed.period || "Historical period",
          civilization: parsed.civilization || "Ancient",
          description: parsed.description || response.substring(0, 200),
          historical_context: parsed.historical_context || "Historical context not available",
          fun_facts: Array.isArray(parsed.fun_facts) ? parsed.fun_facts : ["Site historique important"],
          visitor_tips: parsed.visitor_tips || "Visit during daylight hours",
          nearby_sites: Array.isArray(parsed.nearby_sites) ? parsed.nearby_sites : [],
          best_time_to_visit: parsed.best_time_to_visit || "Spring or Autumn"
        });
        
      } catch (parseError) {
        console.log("JSON parsing failed, returning raw response");
        return NextResponse.json({ 
          site_name: "Heritage Site",
          description: response.substring(0, 500),
          confidence: 60,
          country: country,
          period: "Unknown",
          civilization: "Unknown",
          fun_facts: ["Site identified successfully"],
          visitor_tips: "Consult a local guide for more information",
          nearby_sites: []
        });
      }

    } catch (timeoutError: any) {
      clearTimeout(timeoutId);
      if (timeoutError.name === 'AbortError' || timeoutError.code === 'ECONNABORTED') {
        throw new Error("Vision model timeout - please try again");
      }
      throw timeoutError;
    }

  } catch (error: any) {
    console.error("👁️ Heritage Vision API Error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    
    // Messages d'erreur spécifiques
    if (error.status === 401 || error.message?.includes('401')) {
      return NextResponse.json(
        { error: "OpenRouter API key is invalid or missing" },
        { status: 401 }
      );
    }
    
    if (error.status === 402 || error.message?.includes('402')) {
      return NextResponse.json(
        { error: "Insufficient credits or billing required" },
        { status: 402 }
      );
    }
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: "Request timeout - the model is taking too long to respond" },
        { status: 504 }
      );
    }
    
    if (error.message?.includes('model')) {
      return NextResponse.json(
        { error: "The selected model is not available. Please try again later." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to analyze image. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Heritage Vision API",
    model: "nvidia/nemotron-nano-12b-v2-vl:free",
    status: "operational",
    note: "Please ensure OPENROUTER_API_KEY is set in environment variables"
  });
}
