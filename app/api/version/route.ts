import { NextResponse } from "next/server";
import { buildInfo } from "@/lib/build-info";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ...buildInfo,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    service: "ouyang-cloud-phone-platform",
    status: "ok"
  });
}
