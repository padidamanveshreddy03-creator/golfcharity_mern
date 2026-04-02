import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse("", {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/css; charset=utf-8",
    },
  });
}
