import { extractInfoFromHTMLBCA } from "./parseEmail/helperBCA.js";
import { extractInfoFromHTMLBLU } from "./parseEmail/helperBLU.js";
import { extractInfoFromHTMLOVO } from "./parseEmail/helperOVO.js";
import { extractInfoFromHTMLFLIP } from "./parseEmail/helperFLIP.js";

export interface ExtractedInfo {
    status: boolean;
    amount: number;
    date: string;
    recipient: string;
    emailId?: string;
    source: string;
}

export function extractInfo(subject: string, sender: string, html:string, emailId?: string) : ExtractedInfo {


    if(subject === 'Transaksimu Pakai blu Berhasil'){
        return {...extractInfoFromHTMLBLU(html), emailId, source: 'BLU'};
    }
    else if(subject === 'Internet Transaction Journal'){
        return {...extractInfoFromHTMLBCA(html), emailId, source: 'BCA'};
    }
    else if(subject === 'OVO QR Payment Receipt'){
        return {...extractInfoFromHTMLOVO(html), emailId, source: 'OVO'};
    }
    else if(subject.includes('QRIS PAYMENT SUCCESS')){
        return {...extractInfoFromHTMLFLIP(html), emailId, source: 'FLIP'};
    }

    return {
        status: false,
        amount: 0,
        date: "",
        recipient: "",
        emailId,
        source: 'UNKNOWN'
    };
}
