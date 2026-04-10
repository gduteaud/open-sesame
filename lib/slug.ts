/** Top-level app paths; event slugs cannot equal these (after slugify). */
const RESERVED_SLUGS = new Set(["admin", "api", "claim"]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function reservedSlugMessage(slug: string): string {
  return `Slug "${slug}" is reserved. Choose a different name.`;
}

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return s || "event";
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
