import { ImapFlow } from "imapflow";
import { simpleParser } from 'mailparser';
import { extractInfo, ExtractedInfo } from "./helper/extractInfo.js";
import { AuthError, ConnectionError } from "../errors/error.js";

export type OnTransactionParsed = (info: ExtractedInfo, subject: string) => Promise<void>;

export async function connectToImap(
    userEmail: string,
    googleAccessToken: string,
    onTransaction?: OnTransactionParsed,
){
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
        await client.connect();
        console.log('imap: connected to gmail');

        lock = await client.getMailboxLock('Important Stuff');
        console.log('imap: mailbox locked');

        client.on("exists", async(data) => {
            console.log(`\nimap: new email! Total: ${data.count}`);
            const sequenceRange = `${data.prevCount + 1}:*`;

            try {
                for await(let message of client.fetch(sequenceRange, { source: true })){
                    const parsed = await simpleParser(message.source);

                    console.log("-----------------------------------");
                    console.log("Subject:", parsed.subject);
                    console.log("From:", parsed.from?.text);
                    console.log("-----------------------------------");

                    const result = extractInfo(parsed.subject, parsed.from?.text || '', parsed.html || '');

                    console.log("extracted info:", result);

                    if(result.status && onTransaction){
                        await onTransaction(result, parsed.subject || '');
                    }
                }
            } catch(err){
                console.error("imap fetch error:", err);
            }
        });

        return { success: true, message: 'imap: listening for new emails' };

    } catch(err: any){
        if(err.authenticationFailed){
            throw new AuthError();
        }
        if(err.code === 'NoConnection'){
            throw new ConnectionError();
        }
        throw err;
    } finally {
        if(lock){
            lock.release();
            console.log('imap: lock released');
        }
    }
}