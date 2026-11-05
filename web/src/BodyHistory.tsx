import { lazy, Suspense, useState } from "react";
import type { Entry } from "./store";
import { entrySymptoms } from "./logging";
const Canvas=lazy(()=>import("./AnatomyCanvas"));
export function BodyHistory({entries}:{entries:Entry[];onOpen:(id:string)=>void}) {
 const [metric,setMetric]=useState<"density"|"intensity">("density");
 const [days,setDays]=useState(28);
 const mapped=entries.filter(e=>e.location?.surface3d);
 const now=new Date(),start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-days+1);
 const matching=mapped.filter(e=>Date.parse(e.occurredAt)>=+start&&Date.parse(e.occurredAt)<=+now);
 const model=matching[0]?.location?.surface3d?.model;
 const sameModel=matching.filter(e=>e.location?.surface3d?.model===model);
 const marks=sameModel.map(e=>{const s=e.location!.surface3d!;return {anchor:s.point??s.area??s.focus,score:entrySymptoms(e).reduce((sum,s)=>sum+s.severity,0)/Math.max(1,entrySymptoms(e).length)};});
 if(!mapped.length)return null;
 return <section aria-label="Body map history" className="space-y-4 rounded-3xl bg-panel p-4 sm:p-5">
  <h2 className="text-lg">All-body symptom map</h2>

  <label className="flex items-center justify-between gap-3 text-sm">Period<select aria-label="Body-map history period" className="min-h-11 rounded-xl bg-paper px-3" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={28}>28 days</option><option value={90}>3 months</option></select></label>
  <label className="flex items-center justify-between gap-3 text-sm">Heat shows<select aria-label="Body heat map measure" className="min-h-11 rounded-xl bg-paper px-3" value={metric} onChange={e=>setMetric(e.target.value as "density"|"intensity")}><option value="density">Marking density</option><option value="intensity">Average intensity</option></select></label>
  {marks.length?<Suspense fallback={<p role="status">Loading body map…</p>}><Canvas key={model} model={model} readOnly historyMarks={marks} heatMetric={metric}/></Suspense>:<p className="py-6 text-sm text-muted">No mapped logs in this period.</p>}
  <div className="flex items-center justify-between gap-3 text-xs text-muted"><span>{metric==="density"?"Fewer marks":"0/10"}</span><svg aria-hidden="true" viewBox="0 0 160 12" className="h-3 w-40"><defs><linearGradient id="body-heat-legend"><stop stopColor="hsl(234,90%,50%)"/><stop offset=".33" stopColor="hsl(156,90%,50%)"/><stop offset=".66" stopColor="hsl(78,90%,50%)"/><stop offset="1" stopColor="hsl(0,90%,50%)"/></linearGradient></defs><rect width="160" height="12" rx="6" fill="url(#body-heat-legend)"/></svg><span>{metric==="density"?"More marks":"10/10"}</span></div>
  <details className="text-xs text-muted"><summary className="cursor-pointer py-2 text-accent underline">About this shading</summary><p>Nearby recordings are blended. Each entry uses the average of its symptom scores. Density is relative to this period; intensity is the nearby average score. Up to 512 location clusters are shown.</p></details>
  {matching.length!==sameModel.length&&<p className="text-xs text-muted">Map shows the most recently used body model. All matching entries appear below.</p>}
 </section>;
}
