import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();

    const [creditAgg, debitAgg, entryCount] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { userId, direction: "CREDIT" },
        _sum: { amountMinor: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { userId, direction: "DEBIT" },
        _sum: { amountMinor: true },
      }),
      prisma.ledgerEntry.count({ where: { userId } }),
    ]);

    const creditTotal =
      typeof creditAgg._sum.amountMinor === "bigint"
        ? creditAgg._sum.amountMinor.toString()
        : "0";
    const debitTotal =
      typeof debitAgg._sum.amountMinor === "bigint"
        ? debitAgg._sum.amountMinor.toString()
        : "0";

    const availableBalance = BigInt(creditTotal) - BigInt(debitTotal);

    const escrowHoldAgg = await prisma.ledgerEntry.aggregate({
      where: { userId, kind: "ESCROW_HOLD" },
      _sum: { amountMinor: true },
    });
    const escrowReleaseAgg = await prisma.ledgerEntry.aggregate({
      where: { userId, kind: "ESCROW_RELEASE" },
      _sum: { amountMinor: true },
    });

    const escrowHoldTotal =
      typeof escrowHoldAgg._sum.amountMinor === "bigint"
        ? escrowHoldAgg._sum.amountMinor.toString()
        : "0";
    const escrowReleaseTotal =
      typeof escrowReleaseAgg._sum.amountMinor === "bigint"
        ? escrowReleaseAgg._sum.amountMinor.toString()
        : "0";
    const escrowBalance = BigInt(escrowHoldTotal) - BigInt(escrowReleaseTotal);

    return NextResponse.json({
      userId,
      availableBalance: availableBalance.toString(),
      escrowBalance: escrowBalance.toString(),
      currency: "NGN",
      totalEntries: entryCount,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
