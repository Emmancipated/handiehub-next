import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

function isAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("AuthError") ||
      (error as any).status === 401 ||
      error.name === "AuthError")
  );
}

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        roles: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        emailVerified: user.emailVerifiedAt ? true : false,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}