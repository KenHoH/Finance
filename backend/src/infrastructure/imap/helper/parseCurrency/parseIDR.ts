export function parseIDRCurrency(value: string): number {
  if (!value) return 0;

  let cleanStr = value.toUpperCase().trim();

  if (cleanStr.includes('IDR')) {
    cleanStr = cleanStr.replace(/IDR\s*/g, '').replace(/,/g, '');
  } else {
    cleanStr = cleanStr
      .replace(/RP\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
  }
  const result = Number(cleanStr);
  return isNaN(result) ? 0 : result;
}
