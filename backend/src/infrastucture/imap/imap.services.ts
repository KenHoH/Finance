import { ImapFlow } from "imapflow";
import { simpleParser } from 'mailparser';  
import * as cheerio from "cheerio";


function parseIDRCurrency(value: string): number {
  return Number(
    value
      .replace(/^Rp\s?/, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );
}

function extractInfoFromHTMLBLU(html: string) {
    const $ = cheerio.load(html);

    // Unused Filter (16/03/2026)
    // const amounts = $('span')
    // .filter((i, el) => $(el).text().trim() === 'Rp')
    // .map((i, el) => $(el).next().text().trim())
    // .get();
    // const splitDetails = bankDetailsHtml.split(/<br\s*\/?>/i);
    // const bankNameRaw = splitDetails[0] ? splitDetails[0].trim() : "Bank not found";
    // const accountRaw = splitDetails[1] ? splitDetails[1].trim() : "Account not found";
    // const bankDetailsHtml = $('span[style*="#8993A4"]').html() || '';

    const allNames = $('span[style*="padding-top:8px"]')
    .map((i, el) => $(el).text().trim())
    .get();

    const receipentName = allNames[0] || "Name not found";
    const senderName = allNames[1] || "Name not found";
    const names = `Sender: ${senderName}, Recipient: ${receipentName}`;

    const labelDate = $('div').filter((i, el) => $(el).text().trim() === 'Tgl & Jam Transaksi');
    const dateTimeRaw = labelDate.closest('div[class*="mj-column"]').next('div[class*="mj-column"]').text().trim();

    const labelTotal = $('div').filter((i, el) => $(el).text().trim() === 'Total');
    let totalAmountRaw = labelTotal.closest('div[class*="mj-column"]').next('div[class*="mj-column"]').text().trim();
    totalAmountRaw = totalAmountRaw.replace(/^Rp/, '').trim();
    const totalAmount = parseIDRCurrency(totalAmountRaw);

    console.log("TRANSACTION DETAILS:");
    console.log(`Name:    ${names}`);      
    console.log(`Date:    ${dateTimeRaw}`);
    console.log(`Total:   Rp ${totalAmount.toFixed(2)}`); 
}

export async function connectToImap(userEmail: string, googleAccessToken: string) {

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: userEmail,          
            accessToken: googleAccessToken
        },
        logger: false 
    });

    try {
        await client.connect();

        // Label "Important Stuff" because i filterize the important email like OVO, BLU and BCA into this label
        // You can change the label name into 'INBOX'
        let lock = await client.getMailboxLock('Important Stuff');

        client.on("exists", async (data) => {
            console.log(`\nNew email arrived! Total in Inbox: ${data.count}`);

            const sequenceRange = `${data.prevCount + 1}:*`;

            try {
                for await (let message of client.fetch(sequenceRange, { source: true })) {
                    
                    const parsed = await simpleParser(message.source);

                    console.log("-----------------------------------");
                    console.log("Subject:", parsed.subject);
                    console.log("From:", parsed.from?.text);
                    console.log("HTML:", parsed.html);
                    console.log("-----------------------------------");

                    if(parsed.html){
                        extractInfoFromHTMLBLU(parsed.html || '');
                    }else {
                        console.log("No HTML content found in the email. Skipping extraction.");
                    }
                }
            } catch (err) {
                console.error("Error fetching new message:", err);
            }
        });

    } catch (err) {
        console.error('IMAP Connection Error:', err);
    }
}