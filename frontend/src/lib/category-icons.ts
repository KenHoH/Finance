/**
 * Maps a category name to a generated illustration icon path in /public.
 * Returns an empty string when no matching icon exists so callers can fall
 * back to a default (e.g. a Lucide Tag icon).
 */
export function getCategoryIcon(name: string | null | undefined): string {
  if(!name) return "";
  const n = name.toLowerCase();
  if(n.includes("bill") || n.includes("utility") || n.includes("utilities")) return "/bills.webp";
  if(n.includes("education") || n.includes("school") || n.includes("course") || n.includes("tuition")) return "/education.webp";
  if(n.includes("entertainment") || n.includes("game") || n.includes("movie") || n.includes("hobby")) return "/entertainment.webp";
  if(n.includes("groceries")) return "/groceries.webp";
  if(n.includes("food") || n.includes("dining") || n.includes("restaurant") || n.includes("drink")) return "/food.webp";
  if(n.includes("freelance") || n.includes("consult") || n.includes("contract")) return "/freelance.webp";
  if(n.includes("health") || n.includes("medical") || n.includes("gym") || n.includes("fitness")) return "/health.webp";
  if(n.includes("salary") || n.includes("wage") || n.includes("payroll")) return "/salary.webp";
  if(n.includes("shop") || n.includes("retail") || n.includes("purchase")) return "/shopping.webp";
  if(n.includes("transport") || n.includes("travel") || n.includes("fuel") || n.includes("commute")) return "/transport.webp";
  if(n.includes("crypto")) return "/invest-crypto.webp";
  if(n.includes("stock") || n.includes("equity")) return "/invest-stocks.webp";
  if(n.includes("bond")) return "/invest-bonds.webp";
  if(n.includes("real estate") || n.includes("realestate") || n.includes("property")) return "/invest-realestate.webp";
  if(n === "investment") return "/investment.webp";
  if(n.includes("invest") || n.includes("dividend") || n.includes("interest")) return "/invest-stocks.webp";
  if(n.includes("gift") || n.includes("present")) return "/gift.webp";
  if(n.includes("donation")) return "/salary.webp";
  if(n.includes("rent") || n.includes("mortgage") || n.includes("housing")) return "/invest-realestate.webp";
  if(n.includes("insurance")) return "/health.webp";
  if(n.includes("pet") || n.includes("animal")) return "/entertainment.webp";
  if(n.includes("subscription") || n.includes("membership")) return "/bills.webp";
  if(n.includes("other")) return "/others.webp";
  if(n.includes("income") || n.includes("earning")) return "/salary.webp";
  return "";
}
