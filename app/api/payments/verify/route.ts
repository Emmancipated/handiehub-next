import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { verifyPayment, PaystackError } from "@/lib/paystack/paystack";
import { z } from "zod";

const verifyQuerySchema = z.object({
  trxref: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = verifyQuerySchema.parse({
      trxref: searchParams.get("trxref"),
    });

    const { trxref } = parsed;

    const payment = await prisma.payment.findUnique({
      where: { providerReference: trxref },
      include: { order: true, user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paystack = await verifyPayment(trxref);
    const paystackData = paystack.data;

    const newStatus =
      paystackData.status === "success" ? "SUCCEEDED" : "FAILED";

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        verifiedAt: newStatus === "SUCCEEDED" ? new Date() : null,
      },
      include: { order: true },
    });

    if (newStatus === "SUCCEEDED" && payment.order.status === "PENDING_PAYMENT") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json({ payment: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof PaystackError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
