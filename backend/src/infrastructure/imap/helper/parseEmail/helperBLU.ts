import * as cheerio from 'cheerio';
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';

export function extractInfoFromHTMLBLU(html: string) : ExtractedInfo {
    const $ = cheerio.load(html);

    const allNames = $('span[style*="padding-top:8px"]')
    .map((i, el) => $(el).text().trim())
    .get();

    const receipentName = allNames[1] || "Name not found";

    const labelDate = $('div').filter((i, el) => $(el).text().trim() === 'Tgl & Jam Transaksi');
    const dateTimeRaw = labelDate.closest('div[class*="mj-column"]').next('div[class*="mj-column"]').text().trim();

    const labelTotal = $('div').filter((i, el) => $(el).text().trim() === 'Total');
    let totalAmountRaw = labelTotal.closest('div[class*="mj-column"]').next('div[class*="mj-column"]').text().trim();
    totalAmountRaw = totalAmountRaw.replace(/^Rp/, '').trim();
    const totalAmount = parseIDRCurrency(totalAmountRaw);

    console.log("TRANSACTION DETAILS:");
    console.log(`Recipient: ${receipentName}`);
    console.log(`Date:      ${dateTimeRaw}`);
    console.log(`Total:     ${totalAmount.toFixed(2)}`);

    return {
        status: !!(receipentName && totalAmount > 0 && dateTimeRaw),
        amount: totalAmount,
        date: dateTimeRaw,
        recipient: receipentName
    };
}