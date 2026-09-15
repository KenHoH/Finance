import * as cheerio from 'cheerio';
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';
import {
  containsTransactionDate,
  findNearbyValue,
  findTableRowValue,
} from './htmlExtraction.js';

const RECIPIENT_LABELS = [/^nama\s+toko$/i, /^(?:nama\s+)?merchant$/i];
const AMOUNT_LABELS = [/^total(?:\s+(?:bayar|pembayaran))?$/i];
const SUCCESS_LABELS = [
  /\bpembayaran\s+berhasil\b/i,
  /\bpayment\s+successful\b/i,
];

export function extractInfoFromHTMLOVO(html: string): ExtractedInfo {
  const $ = cheerio.load(html);

  const recipient = findTableRowValue($, RECIPIENT_LABELS);
  const totalAmountRaw = findTableRowValue(
    $,
    AMOUNT_LABELS,
    (value) => parseIDRCurrency(value) > 0,
  );
  const dateRaw = findNearbyValue($, SUCCESS_LABELS, containsTransactionDate);
  const totalAmount = parseIDRCurrency(totalAmountRaw);

  return {
    expenses: true,
    status: Number.isFinite(totalAmount) && totalAmount > 0 && Boolean(dateRaw),
    amount: totalAmount,
    date: dateRaw,
    recipient,
    source: 'OVO',
  };
}
