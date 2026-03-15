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

export async function connectToImap(userEmail: string, googleAccessToken: string) {

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: userEmail,          
            accessToken: googleAccessToken
        },
        logger: false // true to see the raw TCP traffic
    })

    try {
        console.log('Connecting to Gmail IMAP...');
        await client.connect();
        console.log('Connected and authenticated via XOAUTH2!');

        let lock = await client.getMailboxLock('INBOX');
        console.log('Inbox opened. Listening for new emails...');

        let mailboxes = await client.list();

        for (let mailbox of mailboxes) {
            console.log('Path:', mailbox.path);
            console.log('Delimiter:', mailbox.delimiter);
            console.log('Flags:', mailbox.flags);
            console.log('Special use:', mailbox.specialUse);
            console.log('---');
        }
    } catch (err) {
        console.error('IMAP Connection Error:', err);
    }
}