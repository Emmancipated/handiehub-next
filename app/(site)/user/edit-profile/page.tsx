import { redirect } from "next/navigation";

/** Legacy URL kept as a bridge; account editing lives in `/settings/profile`. */
export default function LegacyEditProfilePage() {
  redirect("/settings/profile");
}
