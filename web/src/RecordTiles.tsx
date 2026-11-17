import { t } from "./language";
import { Activity, Brain, ClipboardList, Droplet, Moon, PersonStanding } from "lucide-react";
import { useState } from "react";
import { Modal } from "@freeappstore/sdk/ui";
import { readingLabels, type LogCategory } from "./store";
import { buttonSecondary } from "./ui";

const metrics = ["temperature", "bloodPressure", "bloodGlucose"] as const;

const tiles = [
  { kind: "body", title: "Body symptoms", hint: "Mark where you feel it", icon: PersonStanding, tone: "bg-accent-soft text-accent" },
  { kind: "physical", title: "General symptoms", hint: "Fatigue, nausea and more", icon: ClipboardList, tone: "bg-sky-soft text-sky" },
  { kind: "mental", title: "Mood & emotions", hint: "Record how you feel", icon: Brain, tone: "bg-violet-soft text-violet" },
  { kind: "metrics", title: "Body measurements", hint: "Temperature, blood pressure and blood sugar", icon: Activity, tone: "bg-mint-soft text-mint" },
  { kind: "period", title: "Period", hint: "Record bleeding or spotting", icon: Droplet, tone: "bg-pain-soft text-pain" },
  { kind: "sleep", title: "Sleep", hint: "Bedtime and wake time", icon: Moon, tone: "bg-warning-soft text-warning" },
] as const;

export function RecordTiles({ onChoose }: { onChoose: (category: LogCategory) => void }) {
  const [choosingMetric, setChoosingMetric] = useState(false);
  return (
    <section aria-label={t("What would you like to record?")} className="grid grid-cols-2 gap-2 sm:gap-3">
      {tiles.map(({ kind, title, hint, tone, icon: Symbol }) => (
        <button
          type="button"
          key={kind}
          onClick={() => kind === "metrics" ? setChoosingMetric(true) : onChoose(kind)}
          className={`flex min-h-14 [@media(min-width:560px)_and_(max-height:500px)]:min-h-12 min-w-0 items-center gap-2 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-accent [@media(min-height:760px)]:min-h-[4.25rem] sm:gap-3 sm:p-3 [@media(max-height:500px)]:p-1! ${tone}`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel max-[350px]:size-7">
            <Symbol className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold leading-tight text-ink-strong max-[350px]:text-xs">{t(title)}</span>
            <span className="mt-0.5 block text-xs leading-tight text-muted [@media(max-height:759px)]:sr-only max-[350px]:sr-only">{t(hint)}</span>
          </span>
        </button>
      ))}
      <Modal open={choosingMetric} onClose={() => setChoosingMetric(false)} title={t("Body measurements")} maxWidth={400}>
        <div className="grid gap-2">
          {metrics.map(metric => (
            <button key={metric} type="button" className={buttonSecondary} onClick={() => {
              setChoosingMetric(false);
              onChoose(metric);
            }}>{t(readingLabels[metric])}</button>
          ))}
        </div>
      </Modal>
    </section>
  );
}
