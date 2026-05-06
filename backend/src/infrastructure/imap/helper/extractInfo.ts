import { extractInfoFromHTMLBCA } from "./parseEmail/helperBCA.js";
import { extractInfoFromHTMLBLU } from "./parseEmail/helperBLU.js";
import { extractInfoFromHTMLOVO } from "./parseEmail/helperOVO.js";

export interface ExtractedInfo {
    status: boolean;
    amount: number;
    date: string;
    recipient: string;
    emailId?: string;
}

export function extractInfo(subject: string, sender: string, html:string, emailId?: string) : ExtractedInfo {


    if(subject === 'Transaksimu Pakai blu Berhasil'){
        return {...extractInfoFromHTMLBLU(html), emailId};
    }
    else if(subject === 'Internet Transaction Journal'){
        return {...extractInfoFromHTMLBCA(html), emailId};
    }
    else if(subject === 'OVO QR Payment Receipt'){
        return {...extractInfoFromHTMLOVO(html), emailId};
    }

    return {
        status: false,
        amount: 0,
        date: "",
        recipient: "",
        emailId
    };
}
