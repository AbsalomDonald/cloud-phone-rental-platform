import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestVmosToken } from "@/lib/vmos";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assignment = await prisma.assignment.findFirst({
    include: { phone: true },
    where: {
      expiresAt: { gt: new Date() },
      phone: {
        internalName: decodeURIComponent(id),
        status: "assigned"
      },
      status: "active",
      userId: user.id
    }
  });

  if (!assignment) {
    return NextResponse.json({ error: "Phone not assigned, expired, disabled, or unavailable." }, { status: 403 });
  }

  try {
    const token = await requestVmosToken(assignment.phone.vmosPadCode, user.id);
    await prisma.vmosApiLog.create({
      data: {
        action: "open_phone_token",
        metadata: { padCode: assignment.phone.vmosPadCode },
        phoneId: assignment.phoneId,
        requestStatus: "success",
        userId: user.id
      }
    });

    return NextResponse.json(token);
  } catch (error) {
    await prisma.vmosApiLog.create({
      data: {
        action: "open_phone_token",
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: { padCode: assignment.phone.vmosPadCode },
        phoneId: assignment.phoneId,
        requestStatus: "failed",
        userId: user.id
      }
    });

    return NextResponse.json({ error: "Cloud phone access failed. Please contact support." }, { status: 502 });
  }
}
