import { useState, type ReactNode } from "react";
import type { Entry } from "./store";
import { entrySymptoms } from "./logging";
const key=(date:Date)=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function HistoryCalendar({entries,children}:{entries:Entry[];children:(day:Entry[])=>ReactNode}) {
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);}),[selected,setSelected]=useState<string|null>(null);
 const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const groups=new Map<string,Entry[]>();for(const e of entries){const k=key(new Date(e.occurredAt));groups.set(k,[...(groups.get(k)??[]),e]);}
 const day=selected?groups.get(selected)??[]:[];
 return <section aria-label="Diary calendar" className="space-y-4 rounded-3xl bg-panel p-4 sm:p-5">
  <div className="flex items-center justify-between"><button type="button" aria-label="Previous month" className="size-11 text-xl text-accent" onClick={()=>{setMonth(new Date(month.getFullYear(),month.getMonth()-1,1));setSelected(null);}}>‹</button><h2 className="text-lg">{month.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h2><button type="button" aria-label="Next month" className="size-11 text-xl text-accent" onClick={()=>{setMonth(new Date(month.getFullYear(),month.getMonth()+1,1));setSelected(null);}}>›</button></div>
  <div className="grid grid-cols-7 gap-1">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d} className="text-center text-xs text-muted">{d}</span>)}{Array.from({length:(month.getDay()+6)%7},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:count},(_,i)=>{const d=new Date(month.getFullYear(),month.getMonth(),i+1),k=key(d),logs=groups.get(k)??[];const n=logs.reduce((s,e)=>s+entrySymptoms(e).length+(e.feelings?.length??0)+(e.temperature?1:0),0);return <button key={k} type="button" aria-pressed={selected===k} aria-label={`${d.toLocaleDateString()}, ${n} symptoms, ${logs.length} entries`} className="flex min-h-14 flex-col items-center justify-center rounded-xl text-sm aria-pressed:bg-accent aria-pressed:text-on-hero" onClick={()=>setSelected(selected===k?null:k)}><span>{i+1}</span>{logs.length>0&&<span className="mt-1 text-[10px] font-bold">{n} ●</span>}</button>;})}</div>
  {selected&&<div className="space-y-3 border-t border-line pt-4"><div className="flex justify-between gap-3"><h3 className="text-base">{day.length?new Date(day[0].occurredAt).toLocaleDateString(undefined,{month:"long",day:"numeric"}):"No entries"}</h3><button type="button" className="min-h-11 text-sm text-accent underline" onClick={()=>setSelected(null)}>Close</button></div>{day.length>0&&children(day)}</div>}
 </section>;
}
