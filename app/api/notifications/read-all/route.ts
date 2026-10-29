import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function PATCH() {
  try {
    const userId = await requireUserId();

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
