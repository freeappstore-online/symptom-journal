import { formatLocale, t } from "./language";
import type { Entry } from "./store";
export function TemperatureHistory({entries,onOpen,compact=false}:{entries:Entry[];onOpen?:(id:string)=>void;compact?:boolean}) {
 const rows=entries.filter(e=>e.temperature).sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt));if(!rows.length)return null;
 const first=Date.parse(rows[0].occurredAt),last=Date.parse(rows.at(-1)!.occurredAt),low=Math.floor(Math.min(36,...rows.map(e=>e.temperature!.celsius))),high=Math.ceil(Math.max(39,...rows.map(e=>e.temperature!.celsius)));
 const bottom=compact?113:200, plotHeight=compact?93:160;
 const x=(e:Entry)=>last===first?210:45+(Date.parse(e.occurredAt)-first)/(last-first)*330;
 const y=(value:number)=>bottom-(value-low)/(high-low)*plotHeight;
 const date=(time:number)=>new Date(time).toLocaleDateString(formatLocale());
 const firstDate=date(first),lastDate=date(last);
 return <section className={compact ? "min-w-0 break-inside-avoid" : "rounded-3xl bg-panel p-5"}>
 {compact ? <h4 className="text-xs font-semibold">{t("Temperature history")} · °C</h4> : <><h2 className="text-lg">{t("Temperature history")}</h2><p className="mt-1 text-xs text-muted">{t("Thermometer readings · °C")}</p></>}
 <svg viewBox={`0 0 410 ${bottom+40}`} className={compact ? "mx-auto w-full max-w-xs" : "w-full"} role={onOpen ? "group" : "img"} aria-label={t("Recorded body temperature over time")}>
 {[low,(low+high)/2,high].map(n=><g key={n}><line x1="45" x2="375" y1={y(n)} y2={y(n)} className="stroke-line"/><text x="35" y={y(n)+4} textAnchor="end" className="fill-muted text-[11px]">{n}</text></g>)}
 {rows.map(e=>onOpen ? <g key={e.id} role="button" tabIndex={0} className="cursor-pointer" aria-label={`${e.temperature!.celsius} ${t("degrees Celsius")}, ${new Date(e.occurredAt).toLocaleString(formatLocale())}. ${t("View entry")}`} onClick={()=>onOpen(e.id)} onKeyDown={ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();onOpen(e.id);}}}><circle cx={x(e)} cy={y(e.temperature!.celsius)} r="16" fill="transparent"/><circle cx={x(e)} cy={y(e.temperature!.celsius)} r="5" className="fill-accent"/></g> : <circle key={e.id} cx={x(e)} cy={y(e.temperature!.celsius)} r="5" className="fill-accent"/>)}
 {compact && firstDate===lastDate ? <text x="210" y={bottom+30} textAnchor="middle" className="fill-muted text-[11px]">{firstDate}</text> : <>
  <text x="45" y={bottom+30} className="fill-muted text-[11px]">{firstDate}</text>
  <text x="375" y={bottom+30} textAnchor="end" className="fill-muted text-[11px]">{lastDate}</text>
 </>}</svg></section>;
}
