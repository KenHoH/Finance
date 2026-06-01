/**
 * Maps a category name to a generated illustration icon path in /public.
 * Returns an empty string when no matching icon exists so callers can fall
 * back to a default (e.g. a Lucide Tag icon).
 */
export function getCategoryIcon(name: string | null | undefined): string {
  if(!name) return "";
  const n = name.toLowerCase();
  if(n.includes("bill")) return "/bills.png";
  if(n.includes("education")) return "/education.png";
  if(n.includes("entertainment")) return "/entertainment.png";
  if(n.includes("food") || n.includes("grocery") || n.includes("dining")) return "/food.png";
  if(n.includes("freelance")) return "/freelance.png";
  if(n.includes("health") || n.includes("medical")) return "/health.png";
  if(n.includes("salary") || n.includes("wage")) return "/salary.png";
  if(n.includes("shop")) return "/shopping.png";
  if(n.includes("transport") || n.includes("travel")) return "/transport.png";
  if(n.includes("crypto")) return "/invest-crypto.png";
  if(n.includes("stock")) return "/invest-stocks.png";
  if(n.includes("bond")) return "/invest-bonds.png";
  if(n.includes("real estate") || n.includes("realestate") || n.includes("property")) return "/invest-realestate.png";
  return "";
}
