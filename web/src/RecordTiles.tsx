import type { LogCategory } from "./store";

// A consistent functional symbol set, without decorative illustration backgrounds.
function RecordSymbol({kind}:{kind:LogCategory}) {
 return <svg viewBox="0 0 48 48" className="size-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {kind==="body" ? <><circle cx="24" cy="9" r="4.5"/><path d="M17 18c-3 1-5 5-6 10l-2 7m22-17c3 1 5 5 6 10l2 7M17 19l1 13-2 12m15-25-1 13 2 12M18 32h12M24 33v11"/><circle cx="31" cy="20" r="5" className="fill-panel"/><circle cx="31" cy="20" r="1.5" fill="currentColor" stroke="none"/></> : kind==="physical" ? <><rect x="11" y="7" width="27" height="35" rx="4"/><path d="M19 7V5h11v6H19ZM17 20h15M17 27h15M17 34h9"/><circle cx="7" cy="20" r="1" fill="currentColor"/><circle cx="7" cy="27" r="1" fill="currentColor"/><circle cx="7" cy="34" r="1" fill="currentColor"/></> : kind==="mental" ? <><path d="M30 43v-8c7-3 11-9 10-16C39 9 31 4 23 5 14 6 9 12 9 20l-5 9h7v8h9v6"/><path d="M18 21c-4-5 2-11 6-6 4-5 10 1 6 6l-6 6Z"/></> : <><path d="M19 28V10a5 5 0 0 1 10 0v18a10 10 0 1 1-10 0Z"/><path d="M24 16v18M33 12h5M33 19h4M33 26h5"/><circle cx="24" cy="35" r="4" fill="currentColor" stroke="none"/></>}
 </svg>;
}
const tiles = [
 {kind:"body",title:"Body symptoms",hint:"Mark where you feel it"},
 {kind:"physical",title:"General symptoms",hint:"Fatigue, nausea and more"},
 {kind:"mental",title:"Mood & emotions",hint:"Record how you feel"},
 {kind:"temperature",title:"Temperature",hint:"Add a thermometer reading"},
] as const;
export function RecordTiles({onChoose}:{onChoose:(category:LogCategory)=>void}) {
 return <section aria-label="What would you like to record?" className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">{tiles.map(t=><button type="button" key={t.kind} onClick={()=>onChoose(t.kind)} className="group flex flex-col items-start rounded-3xl bg-panel p-5 text-left shadow-sm transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent">
  <span className="mb-5 text-accent"><RecordSymbol kind={t.kind}/></span>
  <span className="block text-base font-extrabold text-ink-strong">{t.title}</span>
  <span className="mt-1 block text-xs leading-relaxed text-muted">{t.hint}</span>
  <span className="mt-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-paper mt-5">Record <span aria-hidden="true">→</span></span>
 </button>)}</section>;
}
