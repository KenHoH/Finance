import { extractInfoFromHTMLBCA } from "./parseEmail/helperBCA.js";
import { extractInfoFromHTMLBLU, extractInfoFromHTMLBluIncome } from "./parseEmail/helperBLU.js";
import { extractInfoFromHTMLOVO } from "./parseEmail/helperOVO.js";
import { extractInfoFromHTMLFLIP } from "./parseEmail/helperFLIP.js";

export interface ExtractedInfo {
    expenses: boolean;
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
    else if(subject.includes('QRIS Payment Successful')){
        return {...extractInfoFromHTMLFLIP(html), emailId, source: 'FLIP'};
    }
    else if(subject.includes('Info Transaksi Masuk ke blu Kamu')) {
        return {...extractInfoFromHTMLBluIncome(html), emailId, source: 'BLU'};
    }

    return {
        expenses: true,
        status: false,
        amount: 0,
        date: "",
        recipient: "",
        emailId,
        source: 'UNKNOWN'
    };
}