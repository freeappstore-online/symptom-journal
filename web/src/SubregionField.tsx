import { useId, useState } from "react";
import type { Location } from "./store";
import { subregions, parentRegion, specificLocationName } from "./subregions";
import { inputClass } from "./ui";
export function SubregionField({value,onChange,compact=false}:{value:Location;onChange:(l:Location)=>void;compact?:boolean}) {
  const [open,setOpen]=useState(false);
  const id=useId(), parts=subregions[parentRegion(value)];
  if(!parts) return null;
  const dropdown=<select id={id} aria-label="Specific body part" className={`${inputClass} mt-1`} value={value.detail ?? ""}
      onChange={e=>{onChange({...value,detail:e.target.value || undefined});setOpen(false);}}>
      <option value="">Whole region / not sure</option>
      {parts.map(name=><option key={name}>{name}</option>)}
    </select>;
  if(compact) return <div>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg">{specificLocationName(value)}</h2>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)} className="min-h-11 shrink-0 text-xs font-semibold text-accent underline underline-offset-4">Confirm or change</button>
    </div>
    {open && dropdown}
  </div>;
  return <label htmlFor={id} className="block text-sm font-semibold">Confirm or change body part{dropdown}</label>;
}
