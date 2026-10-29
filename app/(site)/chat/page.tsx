import { redirect } from "next/navigation";

/** Legacy chat URL; conversations now live under `/messages`. */
export default async function LegacyChatPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const params = await searchParams;
  const to = Array.isArray(params.to) ? params.to[0] : params.to;
  redirect(to ? `/messages/${encodeURIComponent(to)}` : "/messages");
}
