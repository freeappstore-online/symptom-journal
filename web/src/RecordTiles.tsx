import type { LogCategory } from "./store";

// Decorative, local vector illustrations. Labels carry all meaning for assistive technology.
function Illustration({kind}:{kind:LogCategory}) {
 return <svg viewBox="0 0 180 100" className="h-28 w-full" fill="none" aria-hidden="true">
  {kind==="body" ? <>
    <ellipse cx="102" cy="89" rx="43" ry="7" className="fill-accent/10"/>
    <circle cx="103" cy="23" r="12" className="fill-accent/25"/>
    <path d="M87 40Q102 34 118 40L132 72Q133 78 128 78L116 59 114 91H91L89 59 77 78Q71 78 74 71Z" className="fill-accent/25 stroke-accent" strokeWidth="1.5"/>
    <circle cx="115" cy="46" r="10" className="fill-panel stroke-accent" strokeWidth="2"/><circle cx="115" cy="46" r="4" className="fill-accent"/>
    <path d="M48 39h23M48 46h15M139 65h17" className="stroke-accent/40" strokeWidth="3" strokeLinecap="round"/>
  </> : kind==="physical" ? <>
    <path d="M26 78Q55 49 81 72T153 69" className="stroke-sky/20" strokeWidth="15" strokeLinecap="round"/>
    <rect x="58" y="16" width="63" height="70" rx="10" transform="rotate(-9 90 50)" className="fill-panel stroke-sky/50" strokeWidth="2"/>
    <path d="M70 51h10l6-14 9 29 7-16h12" className="stroke-sky" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M79 26h20M76 75h25" className="stroke-sky/30" strokeWidth="3" strokeLinecap="round"/>
  </> : kind==="mental" ? <>
    <path d="M91 87V57M91 72Q51 73 48 42Q83 41 91 72ZM92 60Q94 23 129 18Q134 51 92 60Z" className="fill-violet/20 stroke-violet" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M76 87h33" className="stroke-violet/40" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="53" cy="24" r="9" className="fill-violet/15"/><circle cx="139" cy="74" r="14" className="fill-violet/10"/>
  </> : <>
    <circle cx="93" cy="52" r="37" className="fill-mint/10"/>
    <path d="M85 57V22a9 9 0 0 1 18 0v35a18 18 0 1 1-18 0Z" className="fill-panel stroke-mint" strokeWidth="2"/>
    <path d="M94 34v32" className="stroke-mint" strokeWidth="6" strokeLinecap="round"/><circle cx="94" cy="71" r="9" className="fill-mint"/>
    <path d="M107 28h8M107 38h5M107 48h8" className="stroke-mint/50" strokeWidth="2" strokeLinecap="round"/>
  </>}
 </svg>;
}
const tiles = [
 {kind:"body",title:"Body symptoms",hint:"Mark where you feel it",tone:"bg-accent-soft"},
 {kind:"physical",title:"General symptoms",hint:"Fatigue, nausea and more",tone:"bg-sky-soft"},
 {kind:"mental",title:"Mood & emotions",hint:"Record how you feel",tone:"bg-violet-soft"},
 {kind:"temperature",title:"Temperature",hint:"Add a thermometer reading",tone:"bg-mint-soft"},
] as const;
export function RecordTiles({onChoose}:{onChoose:(category:LogCategory)=>void}) {
 return <section aria-label="What would you like to record?" className="grid grid-cols-2 gap-3">{tiles.map(t=><button type="button" key={t.kind} onClick={()=>onChoose(t.kind)} className="group flex flex-col overflow-hidden rounded-3xl bg-panel text-left shadow-sm transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent">
 <div className={t.tone}><Illustration kind={t.kind}/></div>
 <div className="flex flex-1 flex-col p-4"><span className="block text-base font-bold text-ink-strong">{t.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted">{t.hint}</span><span className="mt-auto block pt-3 text-sm font-bold text-accent">Record <span aria-hidden="true">→</span></span></div>
 </button>)}</section>;
}
