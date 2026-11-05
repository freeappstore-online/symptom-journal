import { useState } from "react";
import { DictionaryPicker } from "./DictionaryPicker";
import { inputClass } from "./ui";
export function LibrarySelect({label,value,options,onChange}:{label:string;value:string;options:{id:string;label:string}[];onChange:(id:string)=>void}) {
 const [open,setOpen]=useState(false);
 return <><button type="button" aria-label={label} aria-haspopup="dialog" className={`${inputClass} flex items-center justify-between gap-3 text-left`} onClick={()=>setOpen(true)}><span>{options.find(o=>o.id===value)?.label??"Choose"}</span><span aria-hidden="true">⌕</span></button>
 {open&&<DictionaryPicker title={label} options={options} selected={[value]} onClose={()=>setOpen(false)} onDone={ids=>{if(ids[0]!==undefined)onChange(ids[0]);setOpen(false);}}/>}</>;
}
