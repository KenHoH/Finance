import * as cheerio from 'cheerio';
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';
import {
  containsTransactionDate,
  findTableRowValue,
} from './htmlExtraction.js';

const RECIPIENT_LABELS = [
  /^nama\s+penerima$/i,
  /^pembayaran\s+ke$/i,
  /^nama\s+perusahaan\s*\/\s*produk$/i,
];

const AMOUNT_LABELS = [
  /^nominal(?:\s+(?:transaksi|tujuan))?$/i,
  /^total\s+(?:bayar|pembayaran)$/i,
];

const DATE_LABELS = [
  /^(?:tanggal|tgl\.?)(?:\s*(?:&|dan)\s*(?:jam|waktu))?\s+transaksi$/i,
];

export function extractInfoFromHTMLBCA(html: string): ExtractedInfo {
  const $ = cheerio.load(html);

  const recipientName = findTableRowValue($, RECIPIENT_LABELS);
  const totalAmountRaw = findTableRowValue(
    $,
    AMOUNT_LABELS,
    (value) => parseIDRCurrency(value) > 0,
  );
  const dateRaw = findTableRowValue($, DATE_LABELS, containsTransactionDate);
  const totalAmount = parseIDRCurrency(totalAmountRaw);

  return {
    expenses: true,
    status: Number.isFinite(totalAmount) && totalAmount > 0 && Boolean(dateRaw),
    amount: totalAmount,
    date: dateRaw,
    recipient: recipientName,
    source: 'BCA',
  };
}
