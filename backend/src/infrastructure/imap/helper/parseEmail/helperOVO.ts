import * as cheerio from 'cheerio'
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';

export function extractInfoFromHTMLOVO(html: string): ExtractedInfo {
    const $ = cheerio.load(html);

    const recipient = $('td')
        .filter((i, el) => $(el).text().trim() === 'Nama Toko')
        .next('td')
        .text()
        .trim();

    let totalAmountRaw = $('td')
        .filter((i, el) => $(el).text().trim() === 'Total')
        .next('td')
        .text()
        .trim();
        
    const dateRaw = $('p')
        .filter((i, el) => $(el).text().includes('Pembayaran Berhasil'))
        .next('p')
        .text()
        .trim();
        
    const totalAmount = parseIDRCurrency(totalAmountRaw);

    console.log("E-WALLET TRANSACTION DETAILS:");
    console.log(`Recipient:  ${recipient || "Store not found"}`);
    console.log(`Date:       ${dateRaw || "Date not found"}`);
    console.log(`Total:      ${totalAmount.toFixed(2)}`);

    return {
        status: recipient || totalAmount > 0 || dateRaw ? true : false,
        amount: totalAmount,
        date: dateRaw,
        recipient: recipient,
        source: 'OVO'
    };
}
