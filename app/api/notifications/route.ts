import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const notificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  // Query strings are not booleans: parse "true"/"false" explicitly so
  // `?isRead=false` does not coerce to `true`.
  isRead: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .nullable()
    .default(null),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = notificationsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      isRead: searchParams.get("isRead"),
    });

    const { page, limit, isRead } = parsed;

    const where: Record<string, unknown> = { userId };
    if (isRead !== null) where.isRead = isRead;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
