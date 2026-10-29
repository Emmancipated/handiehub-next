import { prisma } from "@/lib/db/prisma";
import { requirePageRole } from "@/lib/auth/guards";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const instant = false;

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageRole("SELLER", "/dashboard/customer");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { firstName: true, lastName: true, email: true },
  });

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Seller";

  return (
    <DashboardShell variant="seller" name={name}>
      {children}
    </DashboardShell>
  );
}
