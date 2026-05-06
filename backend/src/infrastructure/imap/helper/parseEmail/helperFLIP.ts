import * as cheerio from 'cheerio';
import { parseIDRCurrency } from '../parseCurrency/parseIDR.js';
import { ExtractedInfo } from '../extractInfo.js';

export function extractInfoFromHTMLFLIP(html: string): ExtractedInfo {
    const $ = cheerio.load(html);

    const amountRaw = $('div')
        .filter((i, el) => $(el).text().trim() === 'Payment Amount')
        .first()
        .parent()
        .find('.text--bold')
        .first()
        .text()
        .trim();

    const merchantName = $('div')
        .filter((i, el) => $(el).text().trim() === 'Merchant Name')
        .first()
        .parent()
        .find('.text--bold')
        .first()
        .text()
        .trim();

    const dateRaw = $('div')
        .filter((i, el) => $(el).text().trim() === 'Payment Time')
        .first()
        .parent()
        .find('.text--bold')
        .first()
        .text() 
        .trim();

    const totalAmount = parseIDRCurrency(amountRaw);

    return {
        status: merchantName || totalAmount > 0 || dateRaw ? true : false,
        amount: totalAmount,
        date: dateRaw,
        recipient: merchantName,
    };
}
