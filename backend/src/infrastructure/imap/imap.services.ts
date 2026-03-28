import { ImapFlow } from "imapflow";
import { simpleParser } from 'mailparser';  
import { extractInfo } from "./helper/extractInfo.js";
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

    let lock;
    try {
        // Connect to the IMAP server
        await client.connect();
        console.log('cek imap: connected ke gmail');

        // Label "Important Stuff" because i filterize the important email like OVO, BLU and BCA into this label
        // You can change the label name into 'INBOX'
        lock = await client.getMailboxLock('Important Stuff');
        console.log('cek imap: lock mailbox berhasil');

        client.on("exists", async (data) => {
            console.log(`\ncek imap: email baru masuk! Total: ${data.count}`);
            const sequenceRange = `${data.prevCount + 1}:*`;

            try {
                for await (let message of client.fetch(sequenceRange, { source: true })) {
                    
                    const parsed = await simpleParser(message.source);

                    console.log("-----------------------------------");
                    console.log("Subject:", parsed.subject);
                    console.log("From:", parsed.from?.text);
                    console.log("-----------------------------------");

                    let result = extractInfo(parsed.subject, parsed.from?.text || '', parsed.html || '')

                    console.log("cek extracted info:", result);
                }
            } catch (err) {
                console.error("cek error fetch message:", err);
            }
        });

        return { success: true, message: 'cek imap: listening for new emails' };

    } catch (err) {
        if (err.authenticationFailed) {
            throw new AuthError();
        }

        if (err.code === 'NoConnection') {
            throw new ConnectionError();
        }
        throw err;
    } finally {
        if (lock) {
            lock.release();
            console.log('cek imap: lock released');
        }
    }
}