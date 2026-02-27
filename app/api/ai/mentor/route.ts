import { NextRequest, NextResponse } from "next/server";
import { chatWithMentor } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { messages, projectContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const message = await chatWithMentor(messages, projectContext);
    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Mentor API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response", message: "I'm having trouble connecting right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
