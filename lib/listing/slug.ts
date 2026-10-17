import { prisma } from "@/lib/db/prisma";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(
  base: string,
  opts?: { excludeId?: string },
): Promise<string> {
  const slug = slugify(base) || "listing";
  let candidate = slug;
  let counter = 0;
  while (true) {
    const existing = await prisma.listing.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === opts?.excludeId) {
      return candidate;
    }
    counter += 1;
    candidate = `${slug}-${counter}`;
  }
}
