import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { verifyPayment, PaystackError } from "@/lib/paystack/paystack";
import { settleSuccessfulPayment } from "@/lib/payments/settle";
import { z } from "zod";

const verifyQuerySchema = z.object({
  trxref: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const userId = await requireVerifiedUser();

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

    if (paystackData.status !== "success") {
      const failed = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", verifiedAt: null },
        include: { order: true },
      });
      return NextResponse.json({ payment: failed });
    }

    const providerAmountMinor =
      typeof paystackData.amount === "number"
        ? BigInt(paystackData.amount)
        : payment.amountMinor;

    const settlement = await settleSuccessfulPayment({
      paymentId: payment.id,
      providerAmountMinor,
      providerCurrency:
        typeof paystackData.currency === "string"
          ? paystackData.currency
          : payment.currency,
      reference: trxref,
    });

    if (settlement.status === "amount_mismatch") {
      return NextResponse.json(
        {
          error: "The amount paid does not match this order.",
          code: "PAYMENT_AMOUNT_MISMATCH",
        },
        { status: 400 },
      );
    }

    if (settlement.status === "currency_mismatch") {
      return NextResponse.json(
        {
          error: "The payment currency does not match this order.",
          code: "PAYMENT_CURRENCY_MISMATCH",
        },
        { status: 400 },
      );
    }

    if (settlement.status === "order_not_pending") {
      return NextResponse.json(
        {
          error:
            "This payment was received after the order closed. Contact support for a refund.",
          code: "ORDER_NOT_PAYABLE",
        },
        { status: 409 },
      );
    }

    const updated = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });

    return NextResponse.json({ payment: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
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
