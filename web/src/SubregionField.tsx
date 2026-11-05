import { LibrarySelect } from "./LibrarySelect";
import { useId, useState } from "react";
import type { Location } from "./store";
import { subregions, parentRegion, specificLocationName } from "./subregions";

export function SubregionField({value,onChange,compact=false}:{value:Location;onChange:(l:Location)=>void;compact?:boolean}) {
  const [open,setOpen]=useState(false);
  const id=useId(), parts=subregions[parentRegion(value)];
  if(!parts) return null;
  const dropdown=<div id={id}><LibrarySelect label="Specific body part" value={value.detail??""} options={[{id:"",label:"Whole region / not sure"},...parts.map(label=>({id:label,label}))]} onChange={detail=>{onChange({...value,detail:detail||undefined});setOpen(false);}}/></div>;
  if(compact) return <div>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg">{specificLocationName(value)}</h2>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)} className="min-h-11 shrink-0 text-xs font-semibold text-accent underline underline-offset-4">Confirm or change</button>
    </div>
    {open && dropdown}
  </div>;
  return <label htmlFor={id} className="block text-sm font-semibold">Confirm or change body part{dropdown}</label>;
}
