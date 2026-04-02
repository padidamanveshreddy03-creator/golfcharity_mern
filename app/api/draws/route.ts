import { supabaseServer } from "@/lib/supabase";
import { runDraw } from "@/lib/draw-logic";
import { NextRequest, NextResponse } from "next/server";
import { formatErrorResponse } from "@/lib/utils";

/**
 * POST /api/draws - Run a draw (simulate or publish)
 */
export async function POST(request: NextRequest) {
  try {
    const { draw_date, draw_mode, publish } = await request.json();

    if (!draw_date || !draw_mode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check admin access (in production, validate auth token)
    // For now, we'll trust the caller

    // Run the draw
    const drawResults = await runDraw(draw_date, draw_mode);

    // Save draw to database
    const { data: drawData, error: drawError } = await supabaseServer
      .from("draws")
      .insert({
        draw_date,
        draw_numbers: drawResults.drawNumbers,
        draw_mode,
        status: publish ? "published" : "simulated",
        total_pool_amount_cents: drawResults.stats.totalPoolAmount,
        five_match_pool_cents: Math.floor(
          drawResults.stats.totalPoolAmount * 0.4,
        ),
        four_match_pool_cents: Math.floor(
          drawResults.stats.totalPoolAmount * 0.35,
        ),
        three_match_pool_cents: Math.floor(
          drawResults.stats.totalPoolAmount * 0.25,
        ),
        results_published: publish ? true : false,
        published_at: publish ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (drawError) throw drawError;

    // If publishing, create winning records
    if (publish && drawData) {
      const winningRecords = [
        ...drawResults.winners.five.map((w) => ({
          user_id: w.user_id,
          draw_id: drawData.id,
          matches_count: 5,
          amount_won_cents: w.amount,
          verification_status: "pending",
          payment_status: "pending",
        })),
        ...drawResults.winners.four.map((w) => ({
          user_id: w.user_id,
          draw_id: drawData.id,
          matches_count: 4,
          amount_won_cents: w.amount,
          verification_status: "pending",
          payment_status: "pending",
        })),
        ...drawResults.winners.three.map((w) => ({
          user_id: w.user_id,
          draw_id: drawData.id,
          matches_count: 3,
          amount_won_cents: w.amount,
          verification_status: "pending",
          payment_status: "pending",
        })),
      ];

      if (winningRecords.length > 0) {
        const { error: winningError } = await supabaseServer
          .from("winnings")
          .insert(winningRecords);

        if (winningError) throw winningError;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        draw: drawData,
        results: drawResults,
      },
      message: publish
        ? "Draw published successfully"
        : "Draw simulated successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * GET /api/draws - Get draws
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "published";

    const { data, error } = await supabaseServer
      .from("draws")
      .select("*")
      .eq("status", status)
      .order("draw_date", { ascending: false })
      .limit(12);

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
