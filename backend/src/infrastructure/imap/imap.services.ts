import { ImapFlow } from "imapflow";
import { simpleParser } from 'mailparser';
import { extractInfo, ExtractedInfo } from "./helper/extractInfo.js";
import { AuthError, ConnectionError } from "../errors/error.js";

export async function connectToImap(userEmail: string, googleAccessToken: string, since?: Date): Promise<ExtractedInfo[]> {

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

        let lock = await client.getMailboxLock('Important Stuff');

        const results: ExtractedInfo[] = [];

        try {
            for await (let message of client.fetch('1:*', { source: true })) {
                const parsed = await simpleParser(message.source);

                if(since && parsed.date && new Date(parsed.date) < since){
                    continue;
                }

                if(parsed.subject && parsed.from?.text && parsed.html){
                    let result = extractInfo(parsed.subject, parsed.from.text, parsed.html, parsed.messageId || undefined);
                    if(result.status){
                        results.push(result);
                    }
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();
        return results;

    } catch (err: any) {
        if (err.authenticationFailed) {
            throw new AuthError();
        }

        if (err.code === 'NoConnection') {
            throw new ConnectionError();
        }
        throw err;
    }
}
