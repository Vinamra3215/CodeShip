import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { isStale } from "@/lib/refresh/staleness";
import { Platform } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.platformProfile.findMany({
    where: { userId: session.user.id },
    select: { platform: true, lastFetched: true },
  });

  const stale: Platform[] = profiles
    .filter((p) => isStale(p.lastFetched, p.platform))
    .map((p) => p.platform);

  return NextResponse.json({ stale });
}
