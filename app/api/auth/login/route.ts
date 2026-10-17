import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { signJwt, REFRESH_TTL_MS } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { comparePassword } from "@/lib/auth/password";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await comparePassword(data.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpires = new Date(Date.now() + REFRESH_TTL_MS);
    const refreshTokenFamily = crypto.randomUUID();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        refreshTokenExpires,
        refreshTokenFamily,
      },
    });

    const accessToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      "7d",
    );

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        emailVerified: user.emailVerifiedAt ? true : false,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      refresh_token_expires: refreshTokenExpires.toISOString(),
    });

    setSessionCookie(res, accessToken, refreshToken, refreshTokenExpires);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}