import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  console.log("[client-event]", JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
