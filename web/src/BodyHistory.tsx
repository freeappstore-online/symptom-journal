import { lazy, Suspense, useState } from "react";
import type { Entry } from "./store";
import { entrySymptoms } from "./logging";
import { LibrarySelect } from "./LibrarySelect";
import { specificLocationName } from "./subregions";
const Canvas=lazy(()=>import("./AnatomyCanvas"));
export function BodyHistory({entries,onOpen}:{entries:Entry[];onOpen:(id:string)=>void}) {
 const [symptom,setSymptom]=useState(""),[days,setDays]=useState(28);
 const mapped=entries.filter(e=>e.location?.surface3d);
 const options=[...new Set(mapped.flatMap(e=>entrySymptoms(e).map(s=>s.name)))].sort();
 const selected=options.includes(symptom)?symptom:options[0];
 const now=new Date(),start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-days+1);
 const matching=mapped.filter(e=>Date.parse(e.occurredAt)>=+start&&Date.parse(e.occurredAt)<=+now&&entrySymptoms(e).some(s=>s.name===selected));
 const model=matching[0]?.location?.surface3d?.model;
 const sameModel=matching.filter(e=>e.location?.surface3d?.model===model);
 const marks=sameModel.map(e=>{const s=e.location!.surface3d!;return {anchor:s.point??s.area??s.focus,score:entrySymptoms(e).find(s=>s.name===selected)!.severity};});
 if(!mapped.length)return null;
 return <section aria-label="Body map history" className="space-y-4 rounded-3xl bg-panel p-4 sm:p-5">
  <h2 className="text-lg">Where you felt it</h2>
  <LibrarySelect label="Search body-map symptoms" value={selected??""} options={options.map(label=>({id:label,label}))} onChange={setSymptom}/>
  <label className="flex items-center justify-between gap-3 text-sm">Period<select aria-label="Body-map history period" className="min-h-11 rounded-xl bg-paper px-3" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={28}>28 days</option><option value={90}>3 months</option></select></label>
  {marks.length?<Suspense fallback={<p role="status">Loading body map…</p>}><Canvas key={model} model={model} readOnly historyMarks={marks}/></Suspense>:<p className="py-6 text-sm text-muted">No mapped logs in this period.</p>}
  <p className="text-xs text-muted">Recorded severity: <span className="font-bold text-accent">0–3</span> · <span className="font-bold text-sky">4–6</span> · <span className="font-bold text-pain">7–10</span>. Markers can overlap. Turn the body to see other sides.</p>
  {matching.length!==sameModel.length&&<p className="text-xs text-muted">Map shows the most recently used body model. All matching entries appear below.</p>}
  <h3 className="text-base">Body map entries · {matching.length}</h3>
  <ul className="divide-y divide-line">{matching.map(e=><li key={e.id}><button type="button" className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left" onClick={()=>onOpen(e.id)}><span><span className="block text-sm font-bold">{specificLocationName(e.location!)}</span><span className="text-xs text-muted">{new Date(e.occurredAt).toLocaleString()}</span></span><span className="shrink-0 text-sm font-bold text-accent">{entrySymptoms(e).find(s=>s.name===selected)!.severity}/10 →</span></button></li>)}</ul>
 </section>;
}
