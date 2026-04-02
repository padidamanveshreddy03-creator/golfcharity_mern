import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
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

  return { ok: true as const };
}

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get users
    const { data, error, count } = await supabaseServer
      .from("profiles")
      .select("*, subscriptions(*)", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * PATCH /api/admin/users - Update user (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { user_id, is_admin, full_name } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (is_admin !== undefined) updateData.is_admin = is_admin;
    if (full_name) updateData.full_name = full_name;

    const { data, error } = await supabaseServer
      .from("profiles")
      .update(updateData)
      .eq("id", user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "User updated successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * GET /api/admin/stats - Get admin statistics
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    // Get total users
    const { count: totalUsers } = await supabaseServer
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabaseServer
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    // Get total revenue
    const { data: subscriptions } = await supabaseServer
      .from("subscriptions")
      .select("amount_in_cents")
      .eq("status", "active");

    const totalRevenue =
      (subscriptions?.reduce((sum, s) => sum + s.amount_in_cents, 0) || 0) /
      100;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue,
      },
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
