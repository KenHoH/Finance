import { ImapFlow } from "imapflow";
import { simpleParser } from 'mailparser';  
import { extractInfo } from "./helper/extractInfo.js";
import * as fs from 'fs';
import { AuthError, ConnectionError } from "../errors/error.js";

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
        // Connect to the IMAP server
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

                    let result = extractInfo(parsed.subject, parsed.from.text, parsed.html)

                    console.log("Extracted Info:", result);
                }
            } catch (err) {
                console.error("Error fetching new message:", err);
            }
        });

    } catch (err) {
        // Generate access token google
        if (err.authenticationFailed) {
            throw new AuthError();
        }

        if (err.code === 'NoConnection') {
            throw new ConnectionError();
        }
        throw err;
    }
}import { ImapFlow } from "imapflow";
import * as cheerio from "cheerio";

function extractInfoFromHTMLBLU(html: string) {
    const $ = cheerio.load(html);

    // --- 1. EXTRACT AMOUNT ---
    const amountRaw = $('span').filter((i, el) => $(el).text().trim() === 'Rp').next().text().trim();
    
    // --- 2. EXTRACT NAME ---
    const nameRaw = $('span[style*="padding-top:8px"]').text().trim();

    // --- 3. EXTRACT BANK NAME & ACCOUNT (DYNAMICALLY) ---
    // Find the span using the specific gray hex color blu uses for destination details
    const bankDetailsHtml = $('span[style*="#8993A4"]').html() || '';
    
    // Split the inner HTML right where the <br> tag is
    const splitDetails = bankDetailsHtml.split(/<br\s*\/?>/i);
    
    // The first half is ALWAYS the Bank Name, the second half is ALWAYS the Account Number
    const bankNameRaw = splitDetails[0] ? splitDetails[0].trim() : "Bank not found";
    const accountRaw = splitDetails[1] ? splitDetails[1].trim() : "Account not found";

    console.log("💳 TRANSACTION DETAILS:");
    console.log(`Name:    ${nameRaw}`);      // Output: JUAN KONTOL
    console.log(`Bank:    ${bankNameRaw}`);  // Output: BCA Digital (or Mandiri, GoPay, etc.)
    console.log(`Account: ${accountRaw}`);   // Output: 0028 122233 4341
    console.log(`Amount:  Rp ${amountRaw}`); // Output: Rp 10.000,00
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
        console.log('Connected and authenticated via XOAUTH2!');

        let lock = await client.getMailboxLock('Important Stuff');
        console.log('Inbox opened. Listening for new emails...');

        // let mailbox = await client.list();
        // for(let mail of mailbox){
        //     console.log(`Path: ${mail.path}}`);
        //     console.log(`Delimitter: ${mail.path}}`);
        //     console.log(`Flags: ${mail.path}}`);
        //     console.log(`Special use: ${mail.path}}`);
        //     console.log(`========`);
        // }

        client.on("exists", async (data) => {
            console.log(`\nNew email arrived! Total in Inbox: ${data.count}`);

            const sequenceRange = `${data.prevCount + 1}:*`;

            try {
                for await (let message of client.fetch(sequenceRange, { source: true })) {
                    
                    const parsed = await simpleParser(message.source);

                    console.log("-----------------------------------");
                    console.log("Subject:", parsed.subject);
                    console.log("From:", parsed.from?.text);
                    console.log("Text:", parsed.text);
                    console.log("HTML:", parsed.html);
                    console.log("-----------------------------------");

                    if(parsed.html){
                        extractInfoFromHTMLBLU(parsed.html || '');
                    }else {
                        console.warn("No HTML content found in the email. Skipping extraction.");
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