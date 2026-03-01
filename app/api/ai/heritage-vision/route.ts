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

    const completion = await openrouter.chat.completions.create({
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      messages: [
        {
          role: "system",
          content: `You are Rihla AI, an expert in North African and Maghrebi heritage sites. 
          You have perfect knowledge of all historical sites in Tunisia, Morocco, Algeria, Egypt, and Libya.
          
          CRITICAL INSTRUCTIONS:
          1. You MUST identify the EXACT heritage site shown in the image
          2. For Tunisian sites: know that Dougga is in Béja, El Jem is in El Jem, Carthage is in Tunis, etc.
          3. Return ONLY valid JSON with no additional text, explanations, or markdown
          4. If you recognize the site, provide accurate historical information
          5. Confidence should reflect how sure you are (70-95% for confident identifications)`
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
              text: `Analyze this image and identify the heritage site. This image was taken in or around ${country}.

              First, determine if this is:
              - A Roman/Ancient site (amphitheatre, columns, ruins, temples)
              - An Islamic site (mosque, minaret, medina, zaouia)
              - A Berber/indigenous site (ksour, cave dwellings, granaries)
              - A natural landmark or other

              Then, identify the SPECIFIC site name. For example:
              - If you see a massive Roman amphitheatre with three levels of arches in Tunisia → "Amphitheatre of El Jem"
              - If you see a blue and white village on a cliff near Tunis → "Sidi Bou Said"
              - If you see a large mosque with a square minaret in central Tunisia → "Great Mosque of Kairouan"
              - If you see Roman columns and ruins by the sea near Tunis → "Carthage Ruins"
              - If you see a well-preserved Roman temple complex in northwestern Tunisia → "Dougga"

              Return ONLY this exact JSON structure with NO other text:
              {
                "site_name": "Full name of the site (be specific)",
                "confidence": 85,
                "country": "${country}",
                "city": "Exact city/location",
                "period": "Historical period (e.g., 3rd century CE, 8th century, Punic era)",
                "civilization": "Civilization that built it (Roman, Punic, Aghlabid, Andalusian, etc.)",
                "description": "Detailed 2-3 sentence description of what you see in the image",
                "historical_context": "Brief historical significance (2-3 sentences)",
                "fun_facts": ["Fact 1 about the site", "Fact 2 about the site", "Fact 3 about the site"],
                "visitor_tips": "Practical advice for visitors",
                "nearby_sites": ["Another site 1", "Another site 2"],
                "best_time_to_visit": "Season or months recommendation"
              }`,
            },
          ],
        },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error("Empty response from vision model");
    }

    const response = completion.choices[0].message.content;
    console.log("👁️ Raw response:", response.substring(0, 300) + "...");

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
        console.error("No JSON object found in response");
        return NextResponse.json(
          { error: "Invalid response format from AI" },
          { status: 500 }
        );
      }
      
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      
      // Parser le JSON
      const parsed = JSON.parse(jsonContent);
      
      // Valider que les champs essentiels sont présents
      if (!parsed.site_name || parsed.site_name === "Unknown" || parsed.site_name === "Heritage Site") {
        console.error("AI could not identify the site");
        return NextResponse.json(
          { 
            site_name: "Site non identifié",
            description: "L'IA n'a pas pu identifier ce site avec certitude. Veuillez réessayer avec une image plus claire ou utiliser la description textuelle.",
            confidence: 40,
            country: country,
            historical_context: "Analyse non concluante",
            fun_facts: [],
            visitor_tips: "Essayez de prendre une photo plus claire ou d'ajouter une description",
            nearby_sites: []
          }
        );
      }
      
      return NextResponse.json(parsed);
      
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError);
      console.error("Raw response:", response);
      
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("👁️ Heritage Vision API Error:", error);
    
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
    status: "operational"
  });
}
