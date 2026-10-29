import { prisma } from "@/lib/db/prisma";
import { requirePageUser } from "@/lib/auth/guards";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const instant = false;

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageUser();
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { firstName: true, lastName: true, email: true },
  });

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Your account";

  return (
    <DashboardShell variant="customer" name={name}>
      {children}
    </DashboardShell>
  );
}
