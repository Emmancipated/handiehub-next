import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { verifyJwt, type JWTPayload } from "@/lib/auth/jwt";
import { getCookieName } from "@/lib/auth/cookies";

const COOKIE_NAME = getCookieName();

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(
    message = "Unauthorized",
    status = 401,
    code = "UNAUTHORIZED",
  ) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export async function getCurrentUser(): Promise<JWTPayload> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    throw new AuthError();
  }
  try {
    return verifyJwt(token);
  } catch {
    throw new AuthError();
  }
}

export async function requireUserId(): Promise<string> {
  const payload = await getCurrentUser();
  return payload.sub;
}

/**
 * Like `requireUserId`, but returns `null` instead of throwing when there is no
 * valid session. Use this for routes that are public but enrich their response
 * for signed-in users (for example, a seller seeing their own drafts).
 */
export async function getOptionalUserId(): Promise<string | null> {
  try {
    return await requireUserId();
  } catch {
    return null;
  }
}

export async function getOptionalUser(): Promise<JWTPayload | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<JWTPayload> {
  return getCurrentUser();
}

/**
 * Require an authenticated user whose email has been verified and return the
 * user id. Login already blocks unverified accounts, but tokens issued before a
 * policy change (or a manually created user) must not be able to write data.
 * Use this for mutations and other sensitive operations; profile/logout stay
 * available on `requireUserId` so an unverified user can still finish
 * verification.
 */
export async function requireVerifiedUser(): Promise<string> {
  const payload = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { emailVerifiedAt: true },
  });

  if (!user) {
    throw new AuthError("User not found", 401, "USER_NOT_FOUND");
  }

  if (!user.emailVerifiedAt) {
    throw new AuthError(
      "Please verify your email address to continue",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }

  return payload.sub;
}
