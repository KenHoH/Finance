export function parseIDRCurrency(value: string): number {
  if (!value) return 0;

  const currencyMatch = value.match(/(?:IDR|RP)\s*([+-]?\d[\d.,]*-?)/i);
  const numericToken =
    currencyMatch?.[1] ?? value.match(/[+-]?\d[\d.,]*-?/)?.[0];
  if (!numericToken) return 0;

  const cleanToken = numericToken.replace(/[.,]-$/, '').replace(/[.,]$/, '');
  const sign = cleanToken.startsWith('-') ? '-' : '';
  const unsignedToken = cleanToken.replace(/^[+-]/, '');
  const lastDot = unsignedToken.lastIndexOf('.');
  const lastComma = unsignedToken.lastIndexOf(',');

  let normalizedNumber: string;

  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSeparator = lastDot > lastComma ? '.' : ',';
    const decimalIndex = unsignedToken.lastIndexOf(decimalSeparator);
    const decimalLength = unsignedToken.length - decimalIndex - 1;

    normalizedNumber =
      decimalLength <= 2
        ? `${unsignedToken.slice(0, decimalIndex).replace(/[.,]/g, '')}.${unsignedToken.slice(decimalIndex + 1)}`
        : unsignedToken.replace(/[.,]/g, '');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const separator = lastDot >= 0 ? '.' : ',';
    const parts = unsignedToken.split(separator);
    const usesThousandsGrouping =
      parts.length > 2
        ? parts.slice(1).every((part) => part.length === 3)
        : parts[1]?.length === 3;

    normalizedNumber = usesThousandsGrouping
      ? parts.join('')
      : `${parts[0]}.${parts.slice(1).join('')}`;
  } else {
    normalizedNumber = unsignedToken;
  }

  const result = Number(`${sign}${normalizedNumber}`);
  return Number.isFinite(result) ? result : 0;
}
