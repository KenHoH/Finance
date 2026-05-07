export function getTickerLogo(ticker) {
  return `https://img.logo.dev/ticker/${ticker}?token=${import.meta.env.VITE_LOGO_API}`;
}