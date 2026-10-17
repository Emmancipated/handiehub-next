import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const confirmDeliverySchema = z.object({
  otp: z.string().min(1).max(10),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const buyerId = await requireUserId();

    const { id } = await params;

    const body = await req.json();
    const data = confirmDeliverySchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
        payments: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.buyerId !== buyerId) {
      return NextResponse.json(
        { error: "Only the buyer can confirm delivery" },
        { status: 403 },
      );
    }

    if (!["ACCEPTED", "SHIPPED", "DELIVERED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Order is not in a deliverable state" },
        { status: 400 },
      );
    }

    if (order.review) {
      return NextResponse.json(
        { error: "Delivery already confirmed for this order" },
        { status: 400 },
      );
    }

    // OTP verification: placeholder — in production verify against a stored OTP
    // For now, accept any 4-6 digit OTP as valid
    const otpRegex = /^\d{4,6}$/;
    if (!otpRegex.test(data.otp)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "DELIVERED" },
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ order: updated, message: "Delivery confirmed" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
