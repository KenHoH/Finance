/**
 * Maps a category name to a generated illustration icon path in /public.
 * Returns an empty string when no matching icon exists so callers can fall
 * back to a default (e.g. a Lucide Tag icon).
 */
export function getCategoryIcon(name: string | null | undefined): string {
  if(!name) return "";
  const n = name.toLowerCase();
  if(n.includes("bill") || n.includes("utility") || n.includes("utilities")) return "/bills.png";
  if(n.includes("education") || n.includes("school") || n.includes("course") || n.includes("tuition")) return "/education.png";
  if(n.includes("entertainment") || n.includes("game") || n.includes("movie") || n.includes("hobby")) return "/entertainment.png";
  if(n.includes("food") || n.includes("grocery") || n.includes("dining") || n.includes("restaurant") || n.includes("drink")) return "/food.png";
  if(n.includes("freelance") || n.includes("consult") || n.includes("contract")) return "/freelance.png";
  if(n.includes("health") || n.includes("medical") || n.includes("gym") || n.includes("fitness")) return "/health.png";
  if(n.includes("salary") || n.includes("wage") || n.includes("payroll")) return "/salary.png";
  if(n.includes("shop") || n.includes("retail") || n.includes("purchase")) return "/shopping.png";
  if(n.includes("transport") || n.includes("travel") || n.includes("fuel") || n.includes("commute")) return "/transport.png";
  if(n.includes("crypto")) return "/invest-crypto.png";
  if(n.includes("stock") || n.includes("equity")) return "/invest-stocks.png";
  if(n.includes("bond")) return "/invest-bonds.png";
  if(n.includes("real estate") || n.includes("realestate") || n.includes("property")) return "/invest-realestate.png";
  if(n.includes("invest") || n.includes("dividend") || n.includes("interest")) return "/invest-stocks.png";
  if(n.includes("gift") || n.includes("present") || n.includes("donation")) return "/salary.png";
  if(n.includes("rent") || n.includes("mortgage") || n.includes("housing")) return "/invest-realestate.png";
  if(n.includes("insurance")) return "/health.png";
  if(n.includes("pet") || n.includes("animal")) return "/entertainment.png";
  if(n.includes("subscription") || n.includes("membership")) return "/bills.png";
  if(n.includes("income") || n.includes("earning")) return "/salary.png";
  return "";
}
