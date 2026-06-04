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
        expenses: true,
        status: receipentName || totalAmount > 0 || dateTimeRaw ? true : false,
        amount: totalAmount,
        date: dateTimeRaw,
        recipient: receipentName,
        source: 'BLU'
    };
}

export function extractInfoFromHTMLBluIncome(html: string): ExtractedInfo {
    const $ = cheerio.load(html);

    const amountIntRaw = $('span:contains("10.")').filter((_, el) => {
        const text = $(el).text().trim();
        return /^[\d.,]+$/.test(text);
    }).first().text().trim();

    const amountSection = $('div').filter((_, el) => {
        const style = $(el).attr('style') || '';
        return style.includes('font-size:20px') && style.includes('font-weight:600');
    }).first();

    const integerPart = amountSection.find('span span').first().text().trim(); 
    const decimalPart = amountSection.find('span').last().text().trim();       

    const amountRaw = integerPart.replace(/\./g, '') + '.' + decimalPart.replace(',', '');
    const totalAmount = parseFloat(amountRaw) || 0;

    const transferRow = $('table').filter((_, el) => {
        return $(el).text().includes('bluAccount');
    }).first();

    const cells = transferRow.find('td[style*="width:50%"]');
    const senderName = $('span').filter((_, el) => {
        const style = $(el).attr('style') || '';
        return (
            style.includes('font-size:14px') &&
            style.includes('font-weight:600') &&
            style.includes('padding-top:8px')
        );
    }).first().text().trim();

    const senderBank = $('span').filter((_, el) => {
        const style = $(el).attr('style') || '';
        return (
            style.includes('font-size:12px') &&
            style.includes('font-weight:400') &&
            style.includes('color:#8993A4')
        );
    }).first().text().trim();

    const dateRaw = $('div').filter((_, el) => {
        const style = $(el).attr('style') || '';
        return (
            style.includes('font-size:14px') &&
            style.includes('font-weight:600') &&
            style.includes('text-align:right')
        );
    }).first().find('span').first().text().trim(); 

    console.log("BLU TRANSACTION DETAILS:");
    console.log(`Sender:  ${senderName} (${senderBank})`);
    console.log(`Date:    ${dateRaw}`);
    console.log(`Amount:  ${totalAmount.toFixed(2)}`);

    return {
        expenses: false,
        status: !!(senderName || totalAmount > 0 || dateRaw),
        amount: totalAmount,
        date: dateRaw,
        recipient: senderName,  
        source: 'BLU'
    };
}