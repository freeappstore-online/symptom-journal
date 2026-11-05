import { useState } from "react";
import type { Location, SymptomRating } from "./store";
import { specificLocationName } from "./subregions";
import { suggestionsFor } from "./symptom-catalogue";
import { DictionaryPicker } from "./DictionaryPicker";
import { inputClass, buttonSecondary, ScoreControl } from "./ui";
export function LocationObservation({location,value,onChange,options,custom=[],onSaveCustom,title="What do you notice here?"}:{location:Location|null;value:SymptomRating[];onChange:(v:SymptomRating[])=>void;options?:readonly string[];custom?:string[];onSaveCustom?:(name:string)=>void;title?:string}) {
 const [open,setOpen]=useState(false),[typed,setTyped]=useState(""),[writing,setWriting]=useState(false),[added,setAdded]=useState(""),[error,setError]=useState("");
 const labels=[...new Set([...(options??suggestionsFor(location)),...custom,...value.map(v=>v.name)])];
 const add=()=>{const name=typed.trim();if(!name || value.length>=20)return;if(!value.some(v=>v.name.toLowerCase()===name.toLowerCase()))onChange([...value,{name,severity:5}]);setAdded(name);setTyped("");setWriting(false);};
 return <section className="space-y-3" aria-label="Symptoms at this body part">
   <h3 className="text-base">{title}</h3>
   <button type="button" className={`${buttonSecondary} w-full justify-between`} onClick={()=>setOpen(true)}>Choose symptoms <span aria-hidden="true">＋</span></button>
   {open && <DictionaryPicker title={location?`${specificLocationName(location)} symptoms`:"Choose symptoms"} multiple options={labels.map(label=>({id:label,label}))} selected={value.map(v=>v.name)} onClose={()=>setOpen(false)} onDone={ids=>{if(ids.length>20){setError("Choose up to 20 symptoms per entry.");return;}setError("");onChange(ids.map(name=>value.find(v=>v.name===name)??{name,severity:5}));setOpen(false);}}/>}
   {error && <p role="alert" className="text-sm text-danger">{error}</p>}
   <div className="divide-y divide-line">{value.map((v,i)=><div key={v.name} className="py-3">
     <div className="flex items-center justify-between gap-3"><h4 className="font-bold">{v.name}</h4><button type="button" className="min-h-11 px-2 text-sm text-danger" aria-label={`Remove ${v.name}`} onClick={()=>onChange(value.filter((_,j)=>i!==j))}>Remove</button></div>
     <ScoreControl label="Severity / intensity" ariaLabel={`${v.name} severity`} value={v.severity} onChange={severity=>onChange(value.map((old,j)=>i===j?{...old,severity}:old))}/>
   </div>)}</div>
   {writing ? <div className="space-y-2"><input autoFocus aria-label="Your own symptom" className={inputClass} maxLength={80} value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}}/><div className="flex justify-between"><button type="button" className="min-h-11 text-sm text-muted" onClick={()=>setWriting(false)}>Cancel</button><button type="button" className={buttonSecondary} disabled={!typed.trim()||value.length>=20} onClick={add}>Add symptom</button></div></div> : <button type="button" className="min-h-11 text-sm font-semibold text-accent underline" onClick={()=>setWriting(true)}>Write your own symptom</button>}
   {added && !custom.includes(added) && onSaveCustom && <div className="flex flex-wrap items-center justify-between gap-2 bg-panel p-3 text-sm"><span>Keep “{added}” in your library?</span><button type="button" className="min-h-11 font-bold text-accent" onClick={()=>{onSaveCustom(added);setAdded("");}}>Save to library</button><button type="button" className="min-h-11 text-muted" onClick={()=>setAdded("")}>Not now</button></div>}
 </section>;
}
