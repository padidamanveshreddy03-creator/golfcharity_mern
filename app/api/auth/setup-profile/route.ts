import { NextResponse } from "next/server";
import { assertSupabaseServerConfigured, supabaseServer } from "@/lib/supabase";

type SetupProfileBody = {
  userId?: string;
  email?: string;
  fullName?: string;
  charityId?: string;
  contributionPercentage?: number;
  wantsAdmin?: boolean;
  adminAccessCode?: string;
};

function normalizeEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^['\"]|['\"]$/g, "");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    assertSupabaseServerConfigured();

    const body = (await request.json()) as SetupProfileBody;
    const userId = body.userId?.trim();
    const email = body.email?.trim();
    const fullName = body.fullName?.trim();
    const charityId = body.charityId?.trim();
    const contributionPercentage = body.contributionPercentage;
    const wantsAdmin = Boolean(body.wantsAdmin);
    const adminAccessCode = body.adminAccessCode?.trim();

    if (!userId || !email || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let isAdmin = false;
    if (wantsAdmin) {
      const expectedCode = normalizeEnv(process.env.ADMIN_SIGNUP_CODE);

      if (!expectedCode) {
        return NextResponse.json(
          {
            error:
              "Admin signup is not configured. Set ADMIN_SIGNUP_CODE on the server.",
          },
          { status: 500 },
        );
      }

      if (!adminAccessCode || adminAccessCode !== expectedCode) {
        return NextResponse.json(
          { error: "Invalid admin access code" },
          { status: 403 },
        );
      }

      isAdmin = true;
    }

    let profileError: { message: string; code?: string } | null = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await supabaseServer.from("profiles").upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          is_admin: isAdmin,
        },
        { onConflict: "id" },
      );

      if (!result.error) {
        profileError = null;
        break;
      }

      profileError = result.error;

      const isForeignKeyError =
        result.error.code === "23503" ||
        /foreign key|fkey|profiles_id_fkey/i.test(result.error.message);

      if (!isForeignKeyError || attempt === 7) {
        break;
      }

      await wait(500);
    }

    if (profileError) {
      return NextResponse.json(
        {
          error:
            profileError.code === "23503"
              ? "Account is still being prepared. Please wait a few seconds and try again."
              : profileError.message,
        },
        { status: 500 },
      );
    }

    if (charityId) {
      const percent = Number.isFinite(contributionPercentage)
        ? Number(contributionPercentage)
        : 10;

      const { error: charityError } = await supabaseServer
        .from("user_charity")
        .upsert(
          {
            user_id: userId,
            charity_id: charityId,
            contribution_percentage: percent,
          },
          { onConflict: "user_id" },
        );

      if (charityError) {
        return NextResponse.json(
          { error: charityError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
