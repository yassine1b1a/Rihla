// app/api/ai/heritage-vision/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 45000,
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

    const completion = await openrouter.chat.completions.create({
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      messages: [
        {
          role: "system",
          content: `You are Rihla AI, a heritage recognition expert. You MUST respond with ONLY valid JSON. No other text, no explanations, no markdown. Just pure JSON.`
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
              text: `Identify this heritage site in ${country}. Return ONLY this JSON structure with NO additional text:
{
  "site_name": "Name of the site",
  "confidence": 85,
  "country": "${country}",
  "city": "City name",
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
      temperature: 0.3, // Plus bas pour plus de précision
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error("Empty response from vision model");
    }

    const response = completion.choices[0].message.content;
    console.log("👁️ Raw response:", response.substring(0, 200) + "...");

    // Nettoyer et parser le JSON
    try {
      // Enlever tout ce qui n'est pas du JSON
      let jsonContent = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Trouver le premier { et le dernier }
      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found");
      }
      
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      
      // Parser le JSON
      const parsed = JSON.parse(jsonContent);
      
      // Construire la réponse finale
      return NextResponse.json({
        site_name: parsed.site_name || "Unknown Site",
        confidence: parsed.confidence || 70,
        country: parsed.country || country,
        city: parsed.city || "Unknown",
        period: parsed.period || "Historical period",
        civilization: parsed.civilization || "Ancient",
        description: parsed.description || "No description available",
        historical_context: parsed.historical_context || "Historical context not available",
        fun_facts: Array.isArray(parsed.fun_facts) ? parsed.fun_facts : [],
        visitor_tips: parsed.visitor_tips || "Visit during daylight hours",
        nearby_sites: Array.isArray(parsed.nearby_sites) ? parsed.nearby_sites : [],
        best_time_to_visit: parsed.best_time_to_visit || "Spring or Autumn"
      });
      
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError);
      console.error("Raw response:", response);
      
      // Fallback: extraire les informations manuellement
      return NextResponse.json({
        site_name: extractInfo(response, "site_name") || "Heritage Site",
        confidence: 70,
        country: country,
        city: extractInfo(response, "city") || "Unknown",
        period: extractInfo(response, "period") || "Historical period",
        civilization: extractInfo(response, "civilization") || "Ancient",
        description: response.substring(0, 300).replace(/[{}[\]"]/g, ''),
        historical_context: "Analysis complete",
        fun_facts: [],
        visitor_tips: "Visit during daylight hours",
        nearby_sites: [],
        best_time_to_visit: "Spring or Autumn"
      });
    }

  } catch (error: any) {
    console.error("👁️ Heritage Vision API Error:", error);
    
    return NextResponse.json(
      { error: "Failed to analyze image. Please try again." },
      { status: 500 }
    );
  }
}

// Fonction helper pour extraire des infos du texte brut
function extractInfo(text: string, field: string): string | null {
  const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, 'i');
  const match = text.match(regex);
  return match ? match[1] : null;
}

export async function GET() {
  return NextResponse.json({ 
    message: "Heritage Vision API",
    model: "nvidia/nemotron-nano-12b-v2-vl:free",
    status: "operational"
  });
}
