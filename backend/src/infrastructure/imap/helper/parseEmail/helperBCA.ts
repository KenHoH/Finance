import * as cheerio from 'cheerio'
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';

export function extractInfoFromHTMLBCA(html: string): ExtractedInfo {
    const $ = cheerio.load(html);

    const findValue = (labels: string[]) =>
        $('td')
            .filter((_, el) => labels.includes($(el).text().trim()))
            .first()
            .next('td')
            .next('td')
            .text()
            .trim();

    const recipientName = findValue([
        'Nama Penerima',
        'Pembayaran Ke',
        'Nama Perusahaan/Produk',
    ]);

    const totalAmountRaw = findValue([
        'Nominal',           // ← this email uses "Nominal"
        'Total Bayar',
        'Nominal Tujuan',
    ]);

    const dateRaw = findValue(['Tanggal Transaksi']);

    const totalAmount = parseIDRCurrency(totalAmountRaw);

    console.log("BCA TRANSACTION DETAILS:");
    console.log(`Recipient:  ${recipientName}`);
    console.log(`Date:       ${dateRaw}`);
    console.log(`Total:      ${totalAmount.toFixed(2)}`);

    return {
        expenses: true,
        status: !!(recipientName || totalAmount > 0 || dateRaw),
        amount: totalAmount,
        date: dateRaw,
        recipient: recipientName,
        source: 'BCA'
    };
}