import type { CheerioAPI } from 'cheerio';

const TEXT_ELEMENT_SELECTOR = 'td, th, div, p, span, strong, b';

export type TextValidator = (value: string) => boolean;

export function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/:\s*$/, '')
    .trim();
}

export function matchesText(value: string, patterns: RegExp[]): boolean {
  const normalizedValue = normalizeText(value);

  return patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(normalizedValue);
  });
}

export function findTextElements($: CheerioAPI, patterns: RegExp[]) {
  return $(TEXT_ELEMENT_SELECTOR).filter((_, element) => {
    if (!matchesText($(element).text(), patterns)) return false;

    return !$(element)
      .find(TEXT_ELEMENT_SELECTOR)
      .toArray()
      .some((child) => matchesText($(child).text(), patterns));
  });
}

export function findTableRowValue(
  $: CheerioAPI,
  labelPatterns: RegExp[],
  isValidValue: TextValidator = Boolean,
): string {
  const labels = findTextElements($, labelPatterns).toArray();

  for (const label of labels) {
    const labelCell = $(label).closest('td, th').first();
    const labelCellElement = labelCell.get(0);
    if (!labelCellElement) continue;

    const cells = labelCell.closest('tr').children('td, th').toArray();
    const labelIndex = cells.findIndex((cell) => cell === labelCellElement);
    if (labelIndex < 0) continue;

    for (const cell of cells.slice(labelIndex + 1)) {
      const value = normalizeText($(cell).text());
      if (value && isValidValue(value)) return value;
    }
  }

  return '';
}

export function findNearbyValue(
  $: CheerioAPI,
  labelPatterns: RegExp[],
  isValidValue: TextValidator,
): string {
  const labels = findTextElements($, labelPatterns).toArray();

  for (const label of labels) {
    let current = $(label);

    while (current.length > 0 && !current.is('body, html')) {
      for (const sibling of current.nextAll().toArray()) {
        const value = normalizeText($(sibling).text());
        if (value && isValidValue(value)) return value;
      }

      current = current.parent();
    }
  }

  return '';
}

export function containsTransactionDate(value: string): boolean {
  const normalizedValue = normalizeText(value);

  return [
    /\b\d{1,2}[/-](?:\d{1,2}|[a-z]{3,9})[/-]\d{2,4}\b/i,
    /\b\d{4}-\d{1,2}-\d{1,2}\b/,
    /\b\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4}\b/i,
    /\b[a-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}\b/i,
  ].some((pattern) => pattern.test(normalizedValue));
}
