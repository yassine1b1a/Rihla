import { NextRequest, NextResponse } from "next/server";
import { travelChat } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();
    const message = await travelChat(messages, context);
    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, message: "I'm having trouble connecting. Please try again." }, { status: 500 });
  }
}
