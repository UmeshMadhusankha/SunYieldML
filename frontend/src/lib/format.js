export const number=value=>new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(value);
export function money(value,currency='LKR'){try{return new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:0}).format(value);}catch{return `${currency} ${number(value)}`;}}
export const payback=value=>value===null?'No positive payback':`${number(value)} years`;
