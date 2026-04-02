import { supabaseServer } from "@/lib/supabase";
import { formatErrorResponse } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { user_id, score, score_date } = await request.json();

    if (!user_id || !score || !score_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (score < 1 || score > 45) {
      return NextResponse.json(
        { error: "Score must be between 1 and 45" },
        { status: 400 },
      );
    }

    // Get existing scores for user (sorted by date, limit 5)
    const { data: existingScores } = await supabaseServer
      .from("scores")
      .select("id, score_date")
      .eq("user_id", user_id)
      .order("score_date", { ascending: false })
      .limit(5);

    // If we already have 5 scores, delete the oldest one
    if (existingScores && existingScores.length >= 5) {
      const oldestScore = existingScores[existingScores.length - 1];
      await supabaseServer.from("scores").delete().eq("id", oldestScore.id);
    }

    // Insert new score
    const { data, error } = await supabaseServer
      .from("scores")
      .insert({
        user_id,
        score,
        score_date,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Score recorded successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseServer
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("score_date", { ascending: false })
      .limit(5);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
