import { NextResponse } from "next/server";
import { requireUserId, requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const messagesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  conversationId: z.string().optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = messagesQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      conversationId: searchParams.get("conversationId") ?? undefined,
    });

    const { page, limit, conversationId } = parsed;

    const where: Record<string, unknown> = {
      OR: [{ senderId: userId }, { recipientId: userId }],
    };
    if (conversationId) where.conversationId = conversationId;

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
          recipient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.message.count({ where }),
      prisma.message.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return NextResponse.json({
      messages,
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

export async function POST(req: Request) {
  try {
    const senderId = await requireVerifiedUser();

    const body = await req.json();
    const data = sendMessageSchema.parse(body);

    if (data.recipientId === senderId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { id: true },
    });
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId,
        recipientId: data.recipientId,
        content: data.content,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        recipient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
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
