// app/api/ai/translate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translation/translate";

export async function POST(req: NextRequest) {
  console.log("🌐 Translation API: Received request");
  
  try {
    const { text, targetLang, sourceLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await translateText(text, targetLang, sourceLang);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🌐 Translation API Error:", error);
    
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
