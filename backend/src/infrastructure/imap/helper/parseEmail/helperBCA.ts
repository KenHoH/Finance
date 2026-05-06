import * as cheerio from 'cheerio'
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';

export function extractInfoFromHTMLBCA(html: string): ExtractedInfo {
    const $ = cheerio.load(html);

    const recipientName = $('td')
        .filter((i, el) => {
            const text = $(el).text().trim();
            return text === 'Pembayaran Ke' || text === 'Nama Penerima' || text === 'Nama Perusahaan/Produk';
        })
        .next('td').next('td')
        .text()
        .trim();

    const totalAmountRaw = $('td')
        .filter((i, el) => {
            const text = $(el).text().trim();
            return text === 'Total Bayar' || text === 'Nominal Tujuan';
        })
        .first()
        .next('td')
        .next('td')
        .text()
    .trim();
    const dateRaw = $('td')
        .filter((i, el) => $(el).text().trim() === 'Tanggal Transaksi')
        .next('td').next('td')
        .text()
        .trim();

    const totalAmount = parseIDRCurrency(totalAmountRaw);

    console.log("BCA TRANSACTION DETAILS:");
    console.log(`Recipient:  ${recipientName}`);
    console.log(`Date:       ${dateRaw}`);
    console.log(`Total:      ${totalAmount.toFixed(2)}`);

    return {
        status: recipientName || totalAmount > 0  || dateRaw ? true : false,
        amount: totalAmount,
        date: dateRaw,
        recipient: recipientName
    };
}
