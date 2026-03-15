import { ImapFlow } from "imapflow";

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