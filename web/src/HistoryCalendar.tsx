import { formatLocale, t } from "./language";
import { useState, type ReactNode } from "react";
import type { Entry } from "./store";
import { calendarSummary } from "./calendar-summary";
import { Thermometer } from "lucide-react";
const key=(date:Date)=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function HistoryCalendar({entries,children}:{entries:Entry[];children:(day:Entry[])=>ReactNode}) {
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);}),[selected,setSelected]=useState<string|null>(null);
 const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const groups=new Map<string,Entry[]>();for(const e of entries){const k=key(new Date(e.occurredAt));groups.set(k,[...(groups.get(k)??[]),e]);}
 const day=selected?(groups.get(selected)??[]).slice().sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt)):[];
 const summary=calendarSummary(day);
 return <section aria-label={t("Diary calendar")} className="space-y-4 rounded-3xl bg-panel p-4 sm:p-5">
  <div className="flex items-center justify-between"><button type="button" aria-label={t("Previous month")} className="size-11 text-xl text-accent" onClick={()=>{setMonth(new Date(month.getFullYear(),month.getMonth()-1,1));setSelected(null);}}>‹</button><h2 className="text-lg">{month.toLocaleDateString(formatLocale(),{month:"long",year:"numeric"})}</h2><button type="button" aria-label={t("Next month")} className="size-11 text-xl text-accent" onClick={()=>{setMonth(new Date(month.getFullYear(),month.getMonth()+1,1));setSelected(null);}}>›</button></div>
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full bg-accent"/>{t("Symptom logs")}</span><span className="inline-flex items-center gap-1.5"><Thermometer aria-hidden="true" className="size-3.5 text-sky"/>{t("Latest temperature · °C")}</span></div>
  <div className="grid grid-cols-7 gap-1">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d} className="text-center text-[10px] text-muted">{t(d)}</span>)}{Array.from({length:(month.getDay()+6)%7},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:count},(_,i)=>{
    const d=new Date(month.getFullYear(),month.getMonth(),i+1),k=key(d),logs=groups.get(k)??[],info=calendarSummary(logs),active=selected===k;
    return <button key={k} type="button" aria-pressed={active} aria-label={`${d.toLocaleDateString(formatLocale())}, ${info.symptoms} ${t("symptom logs")}, ${info.latest?`${t("latest temperature")} ${info.latest.temperature!.celsius.toFixed(1)} ${t("degrees Celsius")}, ${info.temperatureCount} ${t(info.temperatureCount===1?"reading":"readings")}`:t("no temperature reading")}, ${logs.length} ${t(logs.length===1?"entry":"entries")}`} className={`flex min-h-20 min-w-0 flex-col items-center justify-start gap-1 rounded-xl py-2 text-sm ${active?"bg-accent text-paper":"bg-paper text-ink"}`} onClick={()=>setSelected(active?null:k)}>
      <span className="font-bold">{i+1}</span>
      <span className="flex h-4 items-center gap-1 text-[10px] font-semibold">{info.symptoms>0&&<><span aria-hidden="true" className={`size-1.5 rounded-full ${active?"bg-paper":"bg-accent"}`}/>{info.symptoms}</>}</span>
      <span className={`h-4 text-[10px] font-bold ${active?"text-paper":"text-sky"}`}>{info.latest?`${info.latest.temperature!.celsius.toFixed(1)}°`:""}</span>
    </button>;
  })}</div>
  {selected&&<div className="space-y-3 border-t border-line pt-4"><div className="flex justify-between gap-3"><h3 className="text-base">{day.length?new Date(day[0].occurredAt).toLocaleDateString(formatLocale(),{month:"long",day:"numeric"}):t("No entries")}</h3><button type="button" className="min-h-11 text-sm text-accent underline" onClick={()=>setSelected(null)}>{t("Close")}</button></div>{day.length>0&&<><div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><span>{summary.symptoms} {t("symptom logs")}</span>{summary.latest&&<span>{summary.latest.temperature!.celsius.toFixed(1)} °C {t("· Latest")} · {summary.temperatureCount} {t(summary.temperatureCount===1?"reading":"readings")}</span>}</div>{children(day)}</>}</div>}
 </section>;
}
