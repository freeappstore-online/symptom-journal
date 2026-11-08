import { formatLocale, t, displayLabel } from "./language";
import { useState } from "react";
import type { Entry } from "./store";
import { observations, recentWindow, trendBuckets } from "./recap";
import { DictionaryPicker } from "./DictionaryPicker";
const tones=["text-accent","text-pain","text-violet","text-sky","text-mint"];
function Shape({index,x=0,y=0}:{index:number;x?:number;y?:number}) {
 return index===0?<circle cx={x} cy={y} r="4"/>:index===1?<rect x={x-4} y={y-4} width="8" height="8"/>:index===2?<path d={`M${x},${y-5}l5 9h-10Z`}/>:index===3?<path d={`M${x},${y-5}l5 5-5 5-5-5Z`}/>:<path d={`M${x-5},${y}h10M${x},${y-5}v10`} strokeWidth="2.5"/>;
}
export function HistoryRecap({entries,onOpen}:{entries:Entry[];onOpen:(id:string)=>void}) {
 const all=observations(entries),series=[...new Map(all.map(r=>[r.key,r.label])).entries()];
 const [chosen,setChosen]=useState<string[]>([]),[picker,setPicker]=useState(false),[error,setError]=useState("");
 const [range,setRange]=useState(28),[group,setGroup]=useState(1),[metric,setMetric]=useState<"severity"|"frequency">("severity");
 const existing=chosen.filter(k=>series.some(([id])=>id===k));
 const keys=existing.length?existing:series.slice(0,1).map(([id])=>id);
 const window=range?recentWindow(range):{start:Math.min(Date.now(),...all.map(r=>r.time)),end:Date.now()};
 const lines=keys.map(key=>({key,label:series.find(([id])=>id===key)![1],buckets:trendBuckets(all.filter(r=>r.key===key&&r.time>=window.start&&r.time<=window.end),window.start,window.end,group)}));
 const max=metric==="severity"?10:Math.max(1,...lines.flatMap(l=>l.buckets.map(b=>b.count)));
 const x=(t:number)=>42+(t-window.start)/Math.max(1,window.end-window.start)*336,y=(v:number)=>205-v/max*170;
 if(!all.length)return null;
 return <section aria-label={t("Symptom comparison")} className="overflow-hidden rounded-3xl bg-panel shadow-sm">
  <div className="flex items-center justify-between gap-3 bg-hero-start p-5 text-on-hero"><h2 className="text-lg text-on-hero!">{t("Symptom history")}</h2><button type="button" className="min-h-11 font-bold underline" onClick={()=>setPicker(true)}>{t("Choose symptoms · {count}/5", {count:keys.length})}</button></div>
  <div className="space-y-4 p-5">
   <ul className="space-y-2">{lines.map((l,i)=><li key={l.key} className={`flex items-center gap-2 text-sm font-bold ${tones[i]}`}><svg aria-hidden="true" viewBox="-8 -8 16 16" className="size-5 shrink-0" fill="currentColor" stroke="currentColor"><Shape index={i}/></svg><span>{displayLabel(l.label)}</span></li>)}</ul>
   <label className="flex items-center justify-between gap-3 text-sm">{t("Measure")}<select aria-label={t("Chart measure")} className="min-h-11 rounded-xl bg-paper px-3" value={metric} onChange={e=>setMetric(e.target.value as typeof metric)}><option value="severity">{t("Average severity / intensity")}</option><option value="frequency">{t("Number of logs")}</option></select></label>
   <svg viewBox="0 0 408 245" className="w-full" role="group" aria-label={t("Symptom comparison over time")}>
    {[0,max/2,max].map(v=><g key={v}><line x1="42" x2="378" y1={y(v)} y2={y(v)} className="stroke-line" strokeDasharray="3 5"/><text x="30" y={y(v)+4} textAnchor="end" className="fill-muted text-[11px]">{Number(v.toFixed(1))}</text></g>)}
    {lines.map((l,i)=>{let path="",connected=false;for(const b of l.buckets){const v=metric==="severity"?b.mean:b.count;if(v===null){connected=false;continue;}path+=`${connected?"L":"M"}${x(b.start)},${y(v)} `;connected=true;}
     return <g key={l.key} className={tones[i]}><path d={path} fill="none" stroke="currentColor" strokeWidth="2"/>{l.buckets.map(b=>{const v=metric==="severity"?b.mean:b.count;if(v===null||!b.latestId)return null;return <g key={b.start} role="button" tabIndex={0} aria-label={`${displayLabel(l.label)}, ${new Date(b.start).toLocaleDateString(formatLocale())}, ${v.toFixed(1)} ${t(metric==="severity"?"out of 10":"logs")}`} onClick={()=>onOpen(all.find(r=>r.id===b.latestId)!.entryId)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpen(all.find(r=>r.id===b.latestId)!.entryId);}}}><circle cx={x(b.start)} cy={y(v)} r="13" fill="transparent"/><g fill="currentColor" stroke="currentColor"><Shape index={i} x={x(b.start)} y={y(v)}/></g></g>;})}</g>;
    })}
    <text x="42" y="232" className="fill-muted text-[11px]">{new Date(window.start).toLocaleDateString(formatLocale(),{month:"short",day:"numeric"})}</text><text x="378" y="232" textAnchor="end" className="fill-muted text-[11px]">{new Date(window.end).toLocaleDateString(formatLocale(),{month:"short",day:"numeric"})}</text>
   </svg>
   <div className="flex justify-between gap-3"><select aria-label={t("History period")} className="min-h-11 rounded-xl bg-paper px-3 text-sm" value={range} onChange={e=>setRange(Number(e.target.value))}><option value={7}>{t("7 days")}</option><option value={28}>{t("28 days")}</option><option value={90}>{t("3 months")}</option><option value={0}>{t("All time")}</option></select><select aria-label={t("Group chart by")} className="min-h-11 rounded-xl bg-paper px-3 text-sm" value={group} onChange={e=>setGroup(Number(e.target.value))}><option value={1}>{t("Daily")}</option><option value={7}>{t("Weekly")}</option></select></div>
  </div>
  {picker&&<DictionaryPicker title={t("Compare symptoms (up to 5)")} options={series.map(([id,label])=>({id,label}))} selected={keys} multiple maxSelections={5} onClose={()=>{setPicker(false);setError("");}} onDone={ids=>{if(!ids.length||ids.length>5){setError("Choose 1–5 symptoms.");return;}setChosen(ids);setPicker(false);setError("");}}/>}
  {error&&<p role="alert" className="px-5 pb-4 text-sm text-danger">{t(error)}</p>}
 </section>;
}
