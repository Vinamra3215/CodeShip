import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform } from "@prisma/client";

const VALID_PLATFORMS: string[] = ["CODEFORCES", "LEETCODE", "CODECHEF", "GFG"];

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform: platformParam } = await params;
  const platform = platformParam.toUpperCase();

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  await prisma.platformProfile.deleteMany({
    where: { userId: session.user.id, platform: platform as Platform },
  });

  return NextResponse.json({ success: true });
}
