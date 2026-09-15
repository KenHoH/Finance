import * as cheerio from 'cheerio';
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';
import {
  containsTransactionDate,
  findNearbyValue,
  findTableRowValue,
  findTextElements,
  matchesText,
  normalizeText,
} from './htmlExtraction.js';

const BLU_ACCOUNT_LABELS = [/\bblu\s*account(?=\s|\d|$)/i];
const EXPENSE_AMOUNT_LABELS = [
  /^total(?:\s+(?:bayar|pembayaran))?$/i,
  /^nominal(?:\s+(?:tagihan|transaksi))?$/i,
  /^jumlah$/i,
];
const INCOME_AMOUNT_LABELS = [/^nominal\s+transfer$/i];
const DATE_LABELS = [
  /^(?:tgl\.?|tanggal)\s*(?:&|dan)\s*(?:jam|waktu)\s+transaksi$/i,
  /^waktu\s+transaksi$/i,
];
const EXPENSE_RECIPIENT_LABELS = [
  /^nama\s+penerima$/i,
  /^nama\s+merchant$/i,
  /^pembayaran\s+ke$/i,
];
const INCOME_SENDER_LABELS = [/^nama\s+pengirim$/i, /^pengirim$/i, /^dari$/i];

function containsIDRCurrency(value: string): boolean {
  return /(?:IDR|RP)\s*[+-]?\d[\d.,]*-?/i.test(normalizeText(value));
}

function findOppositeAccountHolder($: cheerio.CheerioAPI): string {
  const accountLabel = findTextElements($, BLU_ACCOUNT_LABELS).first();
  const accountCell = accountLabel.closest('td, th').first();
  const accountCellElement = accountCell.get(0);

  if (accountCellElement) {
    const otherCells = accountCell
      .closest('tr')
      .children('td, th')
      .toArray()
      .filter((cell) => cell !== accountCellElement);

    for (const cell of otherCells) {
      const textElements = $(cell)
        .find('span, p, div, strong, b')
        .filter((_, element) => {
          const value = normalizeText($(element).text());
          if (!value) return false;

          return !$(element)
            .find('span, p, div, strong, b')
            .toArray()
            .some((child) => normalizeText($(child).text()) === value);
        })
        .toArray();

      const values = textElements.length
        ? textElements.map((element) => normalizeText($(element).text()))
        : [normalizeText($(cell).text())];

      const counterparty = values.find(
        (value) =>
          value &&
          !matchesText(value, BLU_ACCOUNT_LABELS) &&
          !containsIDRCurrency(value) &&
          !containsTransactionDate(value),
      );

      if (counterparty) return counterparty;
    }
  }

  return '';
}

function findExpenseRecipient($: cheerio.CheerioAPI): string {
  return (
    findOppositeAccountHolder($) ||
    findTableRowValue($, EXPENSE_RECIPIENT_LABELS)
  );
}

function findIncomeSender($: cheerio.CheerioAPI): string {
  return (
    findOppositeAccountHolder($) || findTableRowValue($, INCOME_SENDER_LABELS)
  );
}

export function extractBluExpenseTransaction(html: string): ExtractedInfo {
  const $ = cheerio.load(html);
  const recipient = findExpenseRecipient($);
  const totalAmountRaw = findNearbyValue(
    $,
    EXPENSE_AMOUNT_LABELS,
    containsIDRCurrency,
  );
  const dateRaw = findNearbyValue($, DATE_LABELS, containsTransactionDate);
  const totalAmount = parseIDRCurrency(totalAmountRaw);

  return {
    expenses: true,
    status: Number.isFinite(totalAmount) && totalAmount > 0 && Boolean(dateRaw),
    amount: totalAmount,
    date: dateRaw,
    recipient,
    source: 'BLU',
  };
}

export function extractBluIncomeTransaction(html: string): ExtractedInfo {
  const $ = cheerio.load(html);
  const sender = findIncomeSender($);
  const totalAmountRaw = findNearbyValue(
    $,
    INCOME_AMOUNT_LABELS,
    containsIDRCurrency,
  );
  const dateRaw = findNearbyValue($, DATE_LABELS, containsTransactionDate);
  const totalAmount = parseIDRCurrency(totalAmountRaw);

  return {
    expenses: false,
    status: Number.isFinite(totalAmount) && totalAmount > 0 && Boolean(dateRaw),
    amount: totalAmount,
    date: dateRaw,
    recipient: sender,
    source: 'BLU',
  };
}

export function extractInfoFromHTMLBLU(html: string): ExtractedInfo {
  return extractBluExpenseTransaction(html);
}

export function extractInfoFromHTMLBluIncome(html: string): ExtractedInfo {
  return extractBluIncomeTransaction(html);
}
