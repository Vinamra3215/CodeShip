import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withCache } from "@/lib/cache";

const IITJ_ORG_VARIANTS = new Set([
  "iit jodhpur",
  "iit, jodhpur",
  "iitj jodhpur",
  "iitjodhpur",
  "indian institute of technology, jodhpur",
  "indian institute of technology jodhpur",
  "iit jodhpur, 388",
  "iit jodhpur, 346",
  "iit jodhpur,310",
]);

function isIITJ(org: string | null | undefined): boolean {
  if (!org) return false;
  return IITJ_ORG_VARIANTS.has(org.trim().toLowerCase());
}

interface CFRatedUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  organization?: string;
  avatar?: string;
  country?: string;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cache the rated list for 24 hours (the fetch takes ~30s)
  const iitjUsers = await withCache<CFRatedUser[]>(
    "cf:ratedlist:iitj",
    86400, // 24 hours
    async () => {
      const response = await fetch(
        "https://codeforces.com/api/user.ratedList?activeOnly=false&includeRetired=true",
        { next: { revalidate: 0 } }
      );

      if (!response.ok) {
        throw new Error(`CF API returned ${response.status}`);
      }

      const json = await response.json();

      if (json.status !== "OK") {
        throw new Error(json.comment ?? "CF API error");
      }

      return (json.result as CFRatedUser[]).filter((u) => isIITJ(u.organization));
    }
  );

  const upserts = iitjUsers.map((u) =>
    prisma.discoveredUser.upsert({
      where: { cfHandle: u.handle },
      create: {
        cfHandle: u.handle,
        cfRating: u.rating ?? 0,
        cfMaxRating: u.maxRating ?? 0,
        cfRank: u.rank ?? null,
        organization: u.organization ?? null,
        avatar: u.avatar ?? null,
        country: u.country ?? null,
      },
      update: {
        cfRating: u.rating ?? 0,
        cfMaxRating: u.maxRating ?? 0,
        cfRank: u.rank ?? null,
        organization: u.organization ?? null,
        avatar: u.avatar ?? null,
      },
    })
  );

  await Promise.all(upserts);

  return NextResponse.json({
    success: true,
    discovered: iitjUsers.length,
    variants: [...IITJ_ORG_VARIANTS],
  });
}

export async function GET() {
  const count = await prisma.discoveredUser.count();
  return NextResponse.json({ total: count, lastUpdated: new Date() });
}
