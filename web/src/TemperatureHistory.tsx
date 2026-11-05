import type { Entry } from "./store";
export function TemperatureHistory({entries,onOpen}:{entries:Entry[];onOpen:(id:string)=>void}) {
 const rows=entries.filter(e=>e.temperature).sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt));if(!rows.length)return null;
 const first=Date.parse(rows[0].occurredAt),last=Date.parse(rows.at(-1)!.occurredAt),low=Math.floor(Math.min(36,...rows.map(e=>e.temperature!.celsius))),high=Math.ceil(Math.max(39,...rows.map(e=>e.temperature!.celsius)));
 const x=(e:Entry)=>last===first?210:45+(Date.parse(e.occurredAt)-first)/(last-first)*330,y=(e:Entry)=>200-(e.temperature!.celsius-low)/(high-low)*160;
 return <section className="rounded-3xl bg-panel p-5"><h2 className="text-lg">Temperature history</h2><p className="mt-1 text-xs text-muted">Thermometer readings · °C</p><svg viewBox="0 0 410 240" className="w-full" role="group" aria-label="Recorded body temperature over time">
 {[low,(low+high)/2,high].map(n=><g key={n}><line x1="45" x2="375" y1={200-(n-low)/(high-low)*160} y2={200-(n-low)/(high-low)*160} className="stroke-line"/><text x="35" y={204-(n-low)/(high-low)*160} textAnchor="end" className="fill-muted text-[11px]">{n}</text></g>)}
 {rows.map(e=><g key={e.id} role="button" tabIndex={0} className="cursor-pointer" aria-label={`${e.temperature!.celsius} degrees Celsius, ${new Date(e.occurredAt).toLocaleString()}. View entry`} onClick={()=>onOpen(e.id)} onKeyDown={ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();onOpen(e.id);}}}><circle cx={x(e)} cy={y(e)} r="16" fill="transparent"/><circle cx={x(e)} cy={y(e)} r="5" className="fill-accent"/></g>)}
 <text x="45" y="230" className="fill-muted text-[11px]">{new Date(first).toLocaleDateString()}</text><text x="375" y="230" textAnchor="end" className="fill-muted text-[11px]">{new Date(last).toLocaleDateString()}</text></svg></section>;
}
