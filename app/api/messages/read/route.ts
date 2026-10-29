import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const markReadSchema = z.object({
  conversationId: z.string().min(1),
});

/**
 * Mark every message the current user has received in a conversation as read.
 * Only rows addressed to the caller are touched, so a user cannot mark another
 * participant's inbox state.
 */
export async function PATCH(req: Request) {
  try {
    const userId = await requireUserId();

    const body = await req.json();
    const { conversationId } = markReadSchema.parse(body);

    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        recipientId: userId,
        isRead: false,
      },
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
