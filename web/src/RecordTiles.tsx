import { PersonStanding, ClipboardList, Brain, Thermometer } from "lucide-react";
import type { LogCategory } from "./store";

function RecordSymbol({kind}:{kind:LogCategory}) {
 const symbols={body:PersonStanding,physical:ClipboardList,mental:Brain,temperature:Thermometer};
 const Symbol=symbols[kind];
 return <Symbol className="size-11" strokeWidth={1.8} aria-hidden="true"/>;
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
  <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-paper mt-5">Record <span aria-hidden="true">→</span></span>
 </button>)}</section>;
}
