import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { AGE_RANGE_OPTIONS, calculateProfileTrust } from "@/lib/profile-trust";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileSchema = z.object({
  bio: z.string().trim().min(12, "BIO_TOO_SHORT").max(280).optional(),
  gender: z.enum(["woman", "man", "non_binary", "prefer_not_to_say"]).optional(),
  ageRange: z.enum(AGE_RANGE_OPTIONS).nullable().optional(),
  interestTags: z.array(z.string().trim().min(1).max(24)).min(1).max(6).optional(),
  preferredArea: z.string().trim().min(2).max(80).nullable().optional(),
}).strict();

function publicProfile(user: typeof users.$inferSelect) {
  return {
    bio: user.bio,
    gender: user.gender,
    ageRange: user.ageRange,
    interestTags: user.interestTags,
    preferredArea: user.preferredArea,
    avatarUrl: user.avatarUrl,
    verificationStatus: user.verificationStatus,
    trust: calculateProfileTrust(user),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  return NextResponse.json({ profile: publicProfile(user) });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_PROFILE", issues: parsed.error.issues.map((issue) => issue.message) }, { status: 400 });
  const [updated] = await db.update(users).set({ ...parsed.data, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();
  if (!updated) return NextResponse.json({ error: "PROFILE_UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json({ profile: publicProfile(updated) });
}
