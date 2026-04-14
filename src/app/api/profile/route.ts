import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      college: true,
      createdAt: true,
      profiles: {
        select: {
          id: true,
          platform: true,
          username: true,
          rating: true,
          maxRating: true,
          rank: true,
          problemsSolved: true,
          lastFetched: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

const UpdateProfileSchema = z.object({
  platform: z.enum(["CODEFORCES", "LEETCODE", "CODECHEF", "GFG"]),
  username: z.string().min(1).max(100).trim(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = UpdateProfileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { platform, username } = result.data;

  const profile = await prisma.platformProfile.upsert({
    where: { userId_platform: { userId: session.user.id, platform } },
    create: { userId: session.user.id, platform, username },
    update: { username },
    select: { id: true, platform: true, username: true, lastFetched: true },
  });

  return NextResponse.json(profile);
}
