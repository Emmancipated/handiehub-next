import { NextResponse } from "next/server";
import { requireUserId, requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const addressSchema = z.object({
  label: z.enum(["home", "work", "other"]).default("home"),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(1).max(32),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().nullable(),
  country: z.string().length(2).default("NG"),
  postalCode: z.string().max(20).optional().nullable(),
  isDefault: z.coerce.boolean().default(false),
});

export async function GET() {
  try {
    const userId = await requireUserId();

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
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

export async function POST(req: Request) {
  try {
    const userId = await requireVerifiedUser();

    const body = await req.json();
    const data = addressSchema.parse(body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state ?? null,
        country: data.country,
        postalCode: data.postalCode ?? null,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
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
