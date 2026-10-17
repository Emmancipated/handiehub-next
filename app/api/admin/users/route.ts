import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const adminQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.string().nullable(),
});

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  if (!user || !user.roles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const authErr = await requireAdmin(userId);
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const parsed = adminQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      role: searchParams.get("role"),
    });

    const { page, limit, role } = parsed;

    const where: Record<string, unknown> = {};
    if (role) where.roles = { has: role };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          roles: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
