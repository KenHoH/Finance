import { extractInfoFromHTMLBCA } from "./parseEmail/helperBCA.js";
import { extractInfoFromHTMLBLU } from "./parseEmail/helperBLU.js";
import { extractInfoFromHTMLOVO } from "./parseEmail/helperOVO.js";


export interface ExtractedInfo {
    status: boolean;
    amount: number;
    date: string;
    recipient: string;
}

export function extractInfo(subject: string, sender: string, html:string) : ExtractedInfo {


    if(subject.includes('Transaksimu Pakai blu Berhasil')){
        return extractInfoFromHTMLBLU(html);
    }
    else if(subject.includes('Internet Transaction Journal')){
        return extractInfoFromHTMLBCA(html);
    }
    else if(subject.includes('OVO QR Payment Receipt')){
        return extractInfoFromHTMLOVO(html);
    }

    return {
        status: false,
        amount: 0,
        date: "",
        recipient: ""
    };
}