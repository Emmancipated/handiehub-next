import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import type { JWTPayload } from "@/lib/auth/jwt";

/**
 * Server-side page guard. API routes authorize themselves; this exists so a
 * dashboard layout never renders its shell for an anonymous visitor (and never
 * flashes the page before a client-side redirect).
 */
export async function requirePageUser(): Promise<JWTPayload> {
  try {
    return await getCurrentUser();
  } catch {
    redirect("/auth/login");
  }
}

export async function requirePageRole(
  role: "CUSTOMER" | "SELLER" | "ADMIN",
  fallback = "/",
): Promise<JWTPayload> {
  const user = await requirePageUser();

  // Roles can change during a session (for example, a buyer completing seller
  // onboarding), so authorize against the database rather than the JWT claim.
  const record = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { roles: true },
  });

  if (
    !record ||
    (!record.roles.includes(role) && !record.roles.includes("ADMIN"))
  ) {
    redirect(fallback);
  }

  return user;
}
