import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { AuthError } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

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

const updateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "SELLER", "ADMIN"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireVerifiedUser();
    const authErr = await requireAdmin(userId);
    if (authErr) return authErr;

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateRoleSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data: { roles: [data.role] },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    return NextResponse.json({ user: updated });
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
