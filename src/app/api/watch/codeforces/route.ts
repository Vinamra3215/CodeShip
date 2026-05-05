import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const handles = await prisma.watchedHandle.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
    select: { cfHandle: true, addedAt: true },
  });

  return NextResponse.json({ handles });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const cfHandle = (body.cfHandle ?? "").trim();

  if (!cfHandle) {
    return NextResponse.json({ error: "cfHandle is required" }, { status: 400 });
  }

  const existing = await prisma.watchedHandle.findUnique({
    where: { userId_cfHandle: { userId: session.user.id, cfHandle } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already watching this handle" }, { status: 409 });
  }

  const cfRes = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(cfHandle)}`,
    { next: { revalidate: 0 } }
  );
  const cfJson = await cfRes.json();

  if (cfJson.status !== "OK") {
    return NextResponse.json(
      { error: `CF handle "${cfHandle}" not found` },
      { status: 404 }
    );
  }

  const cfUser = cfJson.result[0];

  await prisma.$transaction([
    prisma.watchedHandle.create({
      data: { userId: session.user.id, cfHandle },
    }),
    prisma.discoveredUser.upsert({
      where: { cfHandle },
      create: {
        cfHandle,
        cfRating: cfUser.rating ?? 0,
        cfMaxRating: cfUser.maxRating ?? 0,
        cfRank: cfUser.rank ?? null,
        organization: cfUser.organization ?? null,
        avatar: cfUser.avatar ?? null,
        country: cfUser.country ?? null,
      },
      update: {
        cfRating: cfUser.rating ?? 0,
        cfMaxRating: cfUser.maxRating ?? 0,
        cfRank: cfUser.rank ?? null,
        organization: cfUser.organization ?? null,
      },
    }),
  ]);

  return NextResponse.json({ success: true, cfHandle });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const cfHandle = (body.cfHandle ?? "").trim();

  await prisma.watchedHandle.deleteMany({
    where: { userId: session.user.id, cfHandle },
  });

  return NextResponse.json({ success: true });
}
