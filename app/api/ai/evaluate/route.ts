import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateProject } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

    const supabase = createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const feedback = await evaluateProject({
      title: project.title,
      theme: project.theme,
      problem_statement: project.problem_statement,
      proposed_solution: project.proposed_solution,
      ai_technologies: project.ai_technologies || [],
      expected_impact: project.expected_impact,
    });

    // Save AI evaluation to project
    await supabase
      .from("projects")
      .update({
        ai_score: feedback.score,
        ai_feedback: JSON.stringify(feedback),
        status: "under_review",
      })
      .eq("id", project.id);

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("Evaluate API error:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
