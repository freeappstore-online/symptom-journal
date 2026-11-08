import { displayLabel, formatLocale, matchesLabel, t } from "./language";
import { useState } from "react";
import type { Observation } from "./recap";
const dayKey=(t:number)=>{const d=new Date(t);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;};
export function DailyOverview({rows,onOpen}:{rows:Observation[];onOpen:(id:string)=>void}) {
 const [period,setPeriod]=useState(7),[query,setQuery]=useState("");
 const end=new Date();end.setHours(23,59,59,999);
 const start=new Date(end);start.setDate(start.getDate()-period+1);start.setHours(0,0,0,0);
 const days=Array.from({length:period},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d;});
 const groups=[...new Map(rows.filter(r=>r.time>=+start&&r.time<=+end).map(r=>[r.key,r.label])).entries()].filter(([,label])=>matchesLabel(label,query));
 return <section aria-label={t("Symptoms by day")} className="space-y-4 rounded-3xl bg-panel p-4 sm:p-5">
  <div className="flex items-center justify-between gap-3"><h2 className="text-lg">{t("Symptoms by day")}</h2><select aria-label={t("Daily overview period")} value={period} onChange={e=>setPeriod(Number(e.target.value))} className="min-h-11 rounded-xl bg-paper-deep px-3 text-sm"><option value={7}>{t("7 days")}</option><option value={28}>{t("28 days")}</option><option value={90}>{t("3 months")}</option></select></div>
  <input type="search" aria-label={t("Search overview symptoms")} placeholder={t("Search symptoms")} value={query} onChange={e=>setQuery(e.target.value)} className="min-h-11 w-full rounded-xl bg-paper px-3 text-sm"/>
  <p className="text-xs text-muted">{t("Dot size: average severity")}</p>
  <div className="overflow-x-auto" tabIndex={0} aria-label={t("Scroll daily symptom chart")}>
   <div className="min-w-max">
    <div className="flex"><div className="sticky left-0 z-10 w-36 shrink-0 bg-panel"/>{days.map(d=><div key={+d} className="w-10 shrink-0 text-center text-xs text-muted"><span className="block">{d.toLocaleDateString(formatLocale(),{weekday:"narrow"})}</span>{d.getDate()}</div>)}</div>
    {groups.map(([key,label],i)=>{const all=rows.filter(r=>r.key===key&&r.time>=+start&&r.time<=+end);const count=new Set(all.map(r=>dayKey(r.time))).size;const avg=all.reduce((s,r)=>s+r.score,0)/all.length;
     return <div key={key} className="flex items-center border-b border-line py-2"><div className="sticky left-0 z-10 w-36 shrink-0 bg-panel pr-3"><p className="break-words text-sm font-bold">{displayLabel(label)}</p><p className="mt-1 text-xs text-muted">{count}/{period} {t("days")} · {avg.toFixed(1)}/10</p></div>{days.map(d=>{const logs=all.filter(r=>dayKey(r.time)===dayKey(+d));const score=logs.length?logs.reduce((s,r)=>s+r.score,0)/logs.length:0;const latest=logs.reduce<Observation|null>((a,b)=>!a||b.time>a.time?b:a,null);
      return <div key={+d} className="flex h-11 w-10 shrink-0 items-center justify-center">{latest?<button type="button" className={`flex size-10 items-center justify-center rounded-full ${["text-accent","text-violet","text-sky","text-mint"][i%4]}`} aria-label={`${displayLabel(label)}, ${d.toLocaleDateString(formatLocale())}, ${score.toFixed(1)} ${t("out of 10")}, ${logs.length} ${t("logs")}`} onClick={()=>onOpen(latest.entryId)}><svg aria-hidden="true" viewBox="0 0 32 32" className="size-8"><circle cx="16" cy="16" r={3+score} fill="currentColor"/></svg></button>:<span aria-label={t("No log")} className="size-1 rounded-full bg-line"/>}</div>;
     })}</div>;
    })}
   </div>
  </div>
  {!groups.length&&<p className="text-sm text-muted">{t("No matching logs in this period.")}</p>}
 </section>;
}
