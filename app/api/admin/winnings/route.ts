import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { formatErrorResponse } from "@/lib/utils";

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Unauthorized: missing bearer token" },
        { status: 401 },
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Unauthorized: invalid token" },
        { status: 401 },
      ),
    };
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await supabaseServer
      .from("winnings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { winning_id, verification_status, rejection_reason } =
      await request.json();

    if (!winning_id || !verification_status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      verification_status,
      verified_at: new Date().toISOString(),
      verified_by: auth.userId,
    };

    if (verification_status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabaseServer
      .from("winnings")
      .update(updateData)
      .eq("id", winning_id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
