import { supabaseServer } from "@/lib/supabase";
import { uploadImage } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { formatErrorResponse } from "@/lib/utils";

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
      .from("winnings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

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

/**
 * POST /api/winnings - Upload winning proof
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const winningId = formData.get("winning_id") as string;
    const proofFile = formData.get("proof") as File;

    if (!winningId || !proofFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Upload image to Supabase Storage
    const fileName = `${winningId}-${Date.now()}-${proofFile.name}`;
    const imageUrl = await uploadImage("winnings-proof", fileName, proofFile);

    // Update winning record
    const { data, error } = await supabaseServer
      .from("winnings")
      .update({
        proof_image_url: imageUrl,
      })
      .eq("id", winningId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Proof uploaded successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * PATCH /api/winnings - Admin approve/reject winning
 */
export async function PATCH(request: NextRequest) {
  try {
    const { winning_id, verification_status, rejection_reason, verified_by } =
      await request.json();

    if (!winning_id || !verification_status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updateData: any = {
      verification_status,
      verified_at: new Date().toISOString(),
    };

    if (verified_by) {
      updateData.verified_by = verified_by;
    }

    if (verification_status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabaseServer
      .from("winnings")
      .update(updateData)
      .eq("id", winning_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Winning updated successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
