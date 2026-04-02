import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: missing bearer token" },
      { status: 401 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized: invalid token" },
      { status: 401 },
    );
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    userId: user.id,
    email: user.email,
    isAdmin: Boolean(profile?.is_admin),
  });
}
