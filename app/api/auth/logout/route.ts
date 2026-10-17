import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/current-user";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    // Invalidate any stored refresh token so it can't be reused.
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpires: null,
        refreshTokenFamily: null,
      },
    });
  } catch {
    // Even if the user is not authenticated, still clear the cookie.
  }

  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set(
    process.env.AUTH_COOKIE_NAME || "hh_session",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
    },
  );
  return res;
}