import { NextRequest, NextResponse } from "next/server";
import { generateProjectIdeas } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { theme, background } = await req.json();

    if (!theme) {
      return NextResponse.json({ error: "Theme required" }, { status: 400 });
    }

    const result = await generateProjectIdeas(theme, background);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ideas API error:", error);
    return NextResponse.json(
      {
        ideas: [
          {
            title: "AI-Powered Smart Monitoring System",
            problem: "Lack of real-time monitoring in the selected domain",
            approach: "Use Computer Vision and ML to detect patterns and anomalies",
            impact: "Could benefit thousands across Algeria through better data-driven decisions",
          },
        ],
      },
      { status: 200 }
    );
  }
}
