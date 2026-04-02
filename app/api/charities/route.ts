import { supabaseServer } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { formatErrorResponse } from "@/lib/utils";

/**
 * GET /api/charities - Get all charities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");

    if (featured === "true") {
      const { data, error } = await supabase
        .from("charities")
        .select("*")
        .eq("is_featured", true)
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data ? [data] : [],
      });
    }

    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name");

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
 * POST /api/charities - Create charity (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { name, description, image_url, website_url, is_featured } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Charity name is required" },
        { status: 400 },
      );
    }

    // TODO: Add admin authorization check

    const { data, error } = await supabaseServer
      .from("charities")
      .insert({
        name,
        description,
        image_url,
        website_url,
        is_featured: is_featured || false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Charity created successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * PUT /api/charities - Update charity (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, image_url, website_url, is_featured } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Charity ID is required" },
        { status: 400 },
      );
    }

    // TODO: Add admin authorization check

    const { data, error } = await supabaseServer
      .from("charities")
      .update({
        name,
        description,
        image_url,
        website_url,
        is_featured,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Charity updated successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/**
 * DELETE /api/charities - Delete charity (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Charity ID is required" },
        { status: 400 },
      );
    }

    // TODO: Add admin authorization check

    const { error } = await supabaseServer
      .from("charities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Charity deleted successfully",
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
