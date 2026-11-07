import { ArrowRight, Brain, ClipboardList, PersonStanding, Thermometer } from "lucide-react";
import type { LogCategory } from "./store";

const tiles = [
  { kind: "body", title: "Body symptoms", hint: "Mark where you feel it", icon: PersonStanding, tone: "bg-mint-soft text-mint" },
  { kind: "physical", title: "General symptoms", hint: "Fatigue, nausea and more", icon: ClipboardList, tone: "bg-sky-soft text-sky" },
  { kind: "mental", title: "Mood & emotions", hint: "Record how you feel", icon: Brain, tone: "bg-violet-soft text-violet" },
  { kind: "temperature", title: "Temperature", hint: "Log a thermometer reading", icon: Thermometer, tone: "bg-pain-soft text-pain" },
] as const;

export function RecordTiles({ onChoose }: { onChoose: (category: LogCategory) => void }) {
  return (
    <section aria-label="What would you like to record?" className="grid grid-cols-2 gap-2 sm:gap-3 [@media(min-width:600px)_and_(max-height:500px)]:grid-cols-4">
      {tiles.map(({ kind, title, hint, tone, icon: Symbol }) => (
        <button
          type="button"
          key={kind}
          onClick={() => onChoose(kind)}
          className={`group flex min-w-0 flex-col items-start rounded-2xl border border-transparent p-3 text-left transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent sm:p-4 [@media(max-height:580px)]:min-h-14 [@media(max-height:580px)]:flex-row [@media(max-height:580px)]:items-center [@media(max-height:580px)]:gap-2 [@media(max-height:580px)]:p-2 ${tone}`}
        >
          <span className="mb-2 flex w-full items-center justify-between gap-2 [@media(max-height:580px)]:mb-0 [@media(max-height:580px)]:w-auto">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-panel [@media(max-height:580px)]:size-7">
              <Symbol className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-paper group-hover:bg-accent-hover [@media(max-height:580px)]:hidden">
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </span>
          <span className="text-sm font-extrabold leading-snug text-ink-strong sm:text-base [@media(max-height:580px)]:text-xs">{title}</span>
          <span className="mt-1 text-xs leading-snug text-muted [@media(max-height:580px)]:sr-only">{hint}</span>
        </button>
      ))}
    </section>
  );
}
