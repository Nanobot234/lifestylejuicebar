/**
 * Builds an SEO-friendly, descriptive alt tag for a product image.
 * Pattern: "<name> <category> — cold-pressed juice bar in New York City | Lifestyle 1104"
 * e.g. "Sea Moss Gel — Strawberry sea moss gel — New York City juice bar | Lifestyle 1104"
 */
export function productImageAlt(name: string, category?: string | null): string {
  const cleanName = (name ?? "").replace(/\s*—\s*/g, " ").trim();
  const cat = (category ?? "").trim();
  const parts = [cleanName, cat && cat.toLowerCase()].filter(Boolean);
  return `${parts.join(" ")} — New York City juice bar | Lifestyle 1104`;
}
