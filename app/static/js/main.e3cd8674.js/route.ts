import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse("", {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/javascript; charset=utf-8",
    },
  });
}
