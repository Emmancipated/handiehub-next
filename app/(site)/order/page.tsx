import { redirect } from "next/navigation";

/** Legacy URL kept as a bridge for links created before the customer dashboard. */
export default function LegacyOrdersPage() {
  redirect("/dashboard/customer/orders");
}
