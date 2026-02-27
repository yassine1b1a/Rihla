import OpenAI from "openai";

// Initialize OpenAI client with error handling
let openrouter: OpenAI;

try {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables");
  }

  openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Rihla - AI Tourism Ecosystem",
    },
    timeout: 30000,
    maxRetries: 2,
  });

  console.log("✅ OpenRouter client initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize OpenRouter client:", error);
  throw error;
}

// FIXED MODELS - Using only models that definitely work
export const MODEL = "meta-llama/llama-3.3-70b-instruct"; // Paid model (works)
export const MODEL_FAST = "meta-llama/llama-3.2-3b-instruct"; // Paid model (cheap)
export const MODEL_FREE = "gryphe/mythomax-l2-13b:free"; // Free model that works

// For vision tasks (image recognition)
export const MODEL_VISION = "anthropic/claude-3-haiku"; // Paid but reliable for images

// ─── 1. Travel Planning Chat ───────────────────────────────────────────────
export async function travelChat(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: { country?: string; interests?: string[] }
) {
  try {
    console.log("🤖 travelChat called with", { messagesCount: messages.length, context });

    const system = `You are Rihla AI — an expert travel concierge specialising in Tunisia, North Africa and the Maghreb region.
You have deep knowledge of: Tunisian culture, history, cuisine, geography, hidden gems, Sahara Desert, Medinas, Carthage, Djerba, Sidi Bou Said, Kairouan, Douz, Tataouine, Tozeur, Cap Bon, and beyond.
You also know Morocco, Algeria, Libya, Egypt and the broader MENA region.
${context?.country ? `Current focus: ${context.country}` : ""}
${context?.interests?.length ? `Traveller interests: ${context.interests.join(", ")}` : ""}

Be warm, knowledgeable, and inspiring. Give specific, actionable advice. Mention exact places, local dishes, cultural customs.
Respond in 2-4 paragraphs. Use markdown formatting where helpful. Never be generic.`;

    const res = await openrouter.chat.completions.create({
      model: MODEL, // Using the reliable paid model
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 900,
      temperature: 0.7,
    });

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("No content in response");
    
    return content;
  } catch (error) {
    console.error("❌ travelChat error:", error);
    throw error;
  }
}

// ─── 2. Personalised Itinerary Generator ──────────────────────────────────
export async function generateItinerary(params: {
  country: string;
  days: number;
  travel_style: string;
  budget: string;
  interests: string[];
  special_requests?: string;
}) {
  console.log("🗺️ generateItinerary called with:", params);

  try {
    if (!params.country) throw new Error("Country is required");
    if (params.days < 1 || params.days > 30) throw new Error("Days must be between 1 and 30");

    const prompt = `Create a detailed ${params.days}-day travel itinerary for ${params.country}.

Traveller profile:
- Style: ${params.travel_style}
- Budget: ${params.budget}
- Interests: ${params.interests.join(", ")}
${params.special_requests ? `- Special requests: ${params.special_requests}` : ""}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any other text, markdown, or explanations.

The JSON must follow this exact structure:
{
  "title": "A descriptive title for this itinerary",
  "ai_highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "estimated_cost": "Budget estimate in local currency or USD",
  "sustainability_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "theme": "Theme of the day",
      "tips": "Practical tips for the day",
      "accommodation": "Recommended accommodation",
      "destinations": [
        {
          "name": "Place name",
          "duration_hours": 2,
          "activity": "Activity description",
          "notes": "Additional notes",
          "order": 1
        }
      ]
    }
  ]
}

Make it deeply specific to ${params.country}. Include local cuisine recommendations, cultural etiquette, hidden gems.
For Tunisia: include medinas, archaeological sites, desert experiences, coastal towns as appropriate.`;

    console.log("🗺️ Sending request to OpenRouter...");

    const res = await openrouter.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    console.log("🗺️ Received response from OpenRouter");

    const content = res.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenRouter");
    }

    console.log("🗺️ Raw response preview:", content.substring(0, 200) + "...");

    let jsonContent = content;
    jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonContent);
      console.log("🗺️ Successfully parsed JSON response");
      return parsed;
    } catch (parseError) {
      console.error("❌ Failed to parse JSON. Raw content:", content);
      throw new Error(`AI response was not valid JSON: ${parseError.message}`);
    }
    
  } catch (error: any) {
    console.error("❌ generateItinerary error:", {
      message: error.message,
      status: error.status,
      response: error.response?.data
    });
    throw error;
  }
}

// ─── 3. Cultural Heritage Recognition ──────────────────────────
export async function recognizeHeritage(input: {
  type: "description" | "image_url";
  value: string;
  country_hint?: string;
}) {
  try {
    console.log("🏛️ recognizeHeritage called with:", { type: input.type, country_hint: input.country_hint });

    const prompt = input.type === "description"
      ? `A traveller describes this heritage site or landmark: "${input.value}"
${input.country_hint ? `It may be in: ${input.country_hint}` : ""}

Identify the site and provide rich cultural context.`
      : `Analyze this heritage site image from ${input.country_hint || "North Africa / Mediterranean"}.
Image URL: ${input.value}
Identify and describe the cultural heritage site shown.`;

    const fullPrompt = `${prompt}

Return ONLY valid JSON. Do not include any other text, markdown, or explanations.

The JSON must follow this exact structure:
{
  "site_name": "Name of the site",
  "confidence": 85,
  "country": "Country name",
  "city": "City name",
  "period": "Historical period",
  "civilization": "Civilization name",
  "description": "Detailed description",
  "historical_context": "Historical context information",
  "fun_facts": ["Fun fact 1", "Fun fact 2", "Fun fact 3"],
  "visitor_tips": "Tips for visitors",
  "nearby_sites": ["Nearby site 1", "Nearby site 2", "Nearby site 3"],
  "best_time_to_visit": "Best time information",
  "unesco": true,
  "significance": "Cultural significance"
}`;

    // FIXED: Use the appropriate model based on input type
    const modelToUse = input.type === "image_url" 
      ? "anthropic/claude-3-haiku" // For images
      : MODEL_FAST; // For text descriptions - using the working fast model

    console.log(`🏛️ Using model: ${modelToUse}`);

    const messages: any[] = input.type === "image_url"
      ? [{ 
          role: "user", 
          content: [
            { type: "image_url", image_url: { url: input.value } },
            { type: "text", text: fullPrompt }
          ]
        }]
      : [{ role: "user", content: fullPrompt }];

    const res = await openrouter.chat.completions.create({
      model: modelToUse,
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    console.log("🏛️ Raw response preview:", content.substring(0, 200) + "...");

    // Clean and parse JSON
    let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonContent = jsonMatch[0];

    const parsed = JSON.parse(jsonContent);
    console.log("🏛️ Successfully parsed JSON response");
    return parsed;
    
  } catch (error) {
    console.error("❌ recognizeHeritage error:", error);
    throw error;
  }
}

// ─── 4. Sustainability & Crowd Insights ───────────────────────────────────
export async function getSustainabilityInsights(destination: {
  name: string;
  country: string;
  month: string;
  visitor_count?: number;
}) {
  try {
    console.log("🌱 getSustainabilityInsights called with:", destination);

    const prompt = `Provide sustainability and crowd management insights for "${destination.name}", ${destination.country} in ${destination.month}.
${destination.visitor_count ? `Current monthly visitors: ${destination.visitor_count}` : ""}

Return ONLY valid JSON. Do not include any other text, markdown, or explanations.

The JSON must follow this exact structure:
{
  "crowd_forecast": "low|moderate|high",
  "crowd_score": 65,
  "best_visit_times": ["Early morning (7-9am)", "Late afternoon (4-6pm)"],
  "eco_score": 72,
  "carbon_estimate_kg": 12.5,
  "water_stress": "low|moderate|high",
  "sustainability_rating": "A|B|C|D",
  "green_practices": ["Use public transport", "Support local businesses"],
  "responsible_tips": ["Bring reusable water bottle", "Respect local customs"],
  "avoid_periods": ["Peak tourist season (Jul-Aug)", "Weekend afternoons"],
  "local_initiatives": ["Beach cleanup program", "Local conservation project"],
  "alternative_destinations": ["Nearby less-visited site 1", "Nearby less-visited site 2"],
  "carrying_capacity_alert": false,
  "monthly_trend": [
    {"month": "Jan", "visitors": 1200, "eco_score": 85},
    {"month": "Feb", "visitors": 1100, "eco_score": 87},
    {"month": "Mar", "visitors": 1500, "eco_score": 80},
    {"month": "Apr", "visitors": 2200, "eco_score": 74},
    {"month": "May", "visitors": 3100, "eco_score": 68},
    {"month": "Jun", "visitors": 4200, "eco_score": 58},
    {"month": "Jul", "visitors": 5500, "eco_score": 45},
    {"month": "Aug", "visitors": 6200, "eco_score": 40},
    {"month": "Sep", "visitors": 3800, "eco_score": 62},
    {"month": "Oct", "visitors": 2500, "eco_score": 72},
    {"month": "Nov", "visitors": 1600, "eco_score": 81},
    {"month": "Dec", "visitors": 1300, "eco_score": 84}
  ]
}

Base your response on typical Mediterranean/North African tourism patterns.
For ${destination.name} in ${destination.country}, consider:
- Peak tourist seasons (spring and autumn for cultural sites, summer for coastal)
- Local climate and environmental pressures
- Typical visitor patterns
- Local sustainability initiatives`;

    console.log("🌱 Sending request to OpenRouter with model:", MODEL_FAST);

    const res = await openrouter.chat.completions.create({
      model: MODEL_FAST, // Using the working fast model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    console.log("🌱 Received response from OpenRouter");

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    console.log("🌱 Raw response preview:", content.substring(0, 200) + "...");

    // Clean and parse JSON
    let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonContent = jsonMatch[0];

    const parsed = JSON.parse(jsonContent);
    console.log("🌱 Successfully parsed JSON response");
    return parsed;
    
  } catch (error: any) {
    console.error("❌ getSustainabilityInsights error:", {
      message: error.message,
      status: error.status,
      response: error.response?.data
    });
    throw error;
  }
}