import { getTickerLogo } from "../../lib/logo";

export default function Logo({
  ticker,
  alt,
  className,
}) {
  return (
    <img
      src={getTickerLogo(ticker)}
      alt={alt || ticker}
      className={
        className ||
        "w-12 h-12 rounded-full object-cover"
      }
    />
  );
}