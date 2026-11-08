import { Mouse, MousePointer2, Move, RotateCw } from "lucide-react";
import { t } from "./language";

export type MapInput = "touch" | "mouse";

export function mapInput(pointerType?: string): MapInput {
  if (pointerType) return pointerType === "touch" ? "touch" : "mouse";
  return window.matchMedia("(pointer: coarse)").matches ? "touch" : "mouse";
}

const touchDemos = [
  { kind: "tap", title: "Tap to select", hint: "Choose a body part" },
  { kind: "turn", title: "Drag to turn", hint: "Use one finger" },
  { kind: "pinch", title: "Pinch to zoom", hint: "Move two fingers apart or together" },
  { kind: "pan", title: "Drag to move the view", hint: "Move two fingers in the same direction" },
] as const;

const mouseDemos = [
  { kind: "tap", title: "Click to select", hint: "Choose a body part", icon: MousePointer2 },
  { kind: "turn", title: "Drag to turn", hint: "Hold the left mouse button", icon: RotateCw },
  { kind: "pinch", title: "Scroll to zoom", hint: "Use the wheel or scroll on the trackpad", icon: Mouse },
  { kind: "pan", title: "Drag to move the view", hint: "Hold the right mouse button", icon: Move },
] as const;

function Hand({two=false}:{two?:boolean}) {
 return <g fill="var(--panel)" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  {two?<path d="M46 83 33 62Q29 55 34 53Q38 51 43 59L44 26Q44 19 49 19Q54 19 54 26V48L60 25Q62 18 67 20Q72 22 70 29L66 52Q78 43 82 51L88 68Q89 78 82 91H51Z"/>:<path d="M47 86 33 64Q29 57 34 54Q38 52 44 61V24Q44 17 49 17Q54 17 54 24V49Q59 43 64 48Q70 44 75 51Q81 48 85 56L89 72Q89 82 82 93H52Z"/>}
 </g>;
}
export function GestureGuide({ input, canSelect = true }: { input: MapInput; canSelect?: boolean }) {
 return <div className="space-y-3">
  {input === "mouse" ? <ul className="space-y-2">
    {mouseDemos.filter(demo => canSelect || demo.kind !== "tap").map(({ kind, title, hint, icon: Symbol }) => (
      <li key={kind} className="flex items-center gap-3 rounded-2xl bg-sky-soft p-3">
        <Symbol className="size-5 shrink-0 text-accent" aria-hidden="true"/>
        <div><strong className="block text-sm">{t(title)}</strong><span className="block text-xs text-muted">{t(hint)}</span></div>
      </li>
    ))}
  </ul> : <div className="grid grid-cols-2 gap-3">{touchDemos.filter(demo => canSelect || demo.kind !== "tap").map(d=><figure key={d.kind} className="rounded-2xl bg-sky-soft p-3">
  <svg viewBox="0 0 130 110" className="mx-auto h-28 w-full text-accent" aria-hidden="true">
   {d.kind==="tap"&&<circle cx="49" cy="23" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="motion-safe:animate-gesture-ripple"/>}
   {d.kind==="turn"&&<path d="M24 18H94m-9-7 9 7-9 7M33 11l-9 7 9 7" fill="none" stroke="currentColor" strokeWidth="2"/>}
   {d.kind==="pinch"&&<g fill="none" stroke="currentColor" strokeWidth="2"><path d="m29 37 12-12m-12 1v11h11M91 9 79 21m1-12h11v11"/><circle cx="49" cy="24" r="5" className="motion-safe:animate-gesture-pinch-a"/><circle cx="65" cy="24" r="5" className="motion-safe:animate-gesture-pinch-b"/></g>}
   {d.kind==="pan"&&<path d="M22 16v39m-6-32 6-7 6 7m-12 25 6 7 6-7" fill="none" stroke="currentColor" strokeWidth="2"/>}
   <g className={d.kind==="tap"?"motion-safe:animate-gesture-tap":d.kind==="turn"?"motion-safe:animate-gesture-turn":d.kind==="pan"?"motion-safe:animate-gesture-pan":""}><Hand two={d.kind==="pinch"||d.kind==="pan"}/></g>
  </svg>
  <figcaption><strong className="block text-sm">{t(d.title)}</strong><span className="mt-1 block text-xs text-muted">{t(d.hint)}</span></figcaption>
 </figure>)}</div>}
  <p className="text-xs text-muted">{t(input === "touch" ? "Swipe outside the map to scroll the page." : "Scroll outside the map to move down the page.")}</p>
 </div>;
}
