import { ChartNoAxesColumnIncreasing, CircleHelp, House, History, Settings, Image, Camera, Plus, MapPin, Cloud, ArrowRight, ChevronRight, ShieldCheck, Check, CalendarDays, NotebookPen, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { Entry } from "./store";

export const inputClass =
  "min-h-12 w-full rounded-2xl bg-sky-soft shadow-[inset_0_-2px_0_var(--line-strong)] px-4 py-3 text-base text-ink placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";
export const buttonPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-paper transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40";
export const buttonSecondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-paper transition-colors hover:bg-accent-hover aria-pressed:ring-2 aria-pressed:ring-accent disabled:opacity-40";
export type IconName =
  | "chart"
  | "help"
  | "home"
  | "history"
  | "settings"
  | "photo"
  | "camera"
  | "plus"
  | "pin"
  | "cloud"
  | "arrow"
  | "chevron"
  | "shield"
  | "check"
  | "calendar"
  | "note"
  | "user";
export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  const icons = {chart:ChartNoAxesColumnIncreasing,help:CircleHelp,home:House,history:History,settings:Settings,photo:Image,camera:Camera,plus:Plus,pin:MapPin,cloud:Cloud,arrow:ArrowRight,chevron:ChevronRight,shield:ShieldCheck,check:Check,calendar:CalendarDays,note:NotebookPen,user:UserRound};
  const Symbol=icons[name];
  return <Symbol className={`shrink-0 ${className}`} strokeWidth={1.8} aria-hidden="true"/>;
}
// Local diary initials represent device profiles, not platform account avatars.
export function ProfileInitial({
  name,
  tone = 0,
}: {
  name: string;
  tone?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-12 shrink-0 items-center justify-center rounded-full text-[1.4rem] font-medium ${tone % 2 ? "bg-violet-soft text-violet" : "bg-accent-soft text-accent-deep"}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
export function StepProgress({current}:{current:number}) {
  const labels=["Record","Review"];
  return <ol aria-label="Entry progress" className="mb-6 grid grid-cols-2 pt-2">
    {labels.map((label,i)=>{
      const done=current>i+1,active=current===i+1;
      return <li key={label} aria-current={active?"step":undefined} className="relative flex flex-col items-center gap-2">
        <span className={`text-[.6rem] font-bold uppercase tracking-widest ${done||active?"text-accent-deep":"text-muted"}`}>{label}</span>
        <div className="relative flex h-7 w-full items-center justify-center">
          {i>0 && <span aria-hidden="true" className={`absolute right-1/2 h-1 w-1/2 ${current>=i+1?"bg-accent":"bg-line"}`} />}
          {i<labels.length-1 && <span aria-hidden="true" className={`absolute left-1/2 h-1 w-1/2 ${done?"bg-accent":"bg-line"}`} />}
          <span aria-hidden="true" className={`relative z-10 flex size-6 items-center justify-center rounded-full ${done?"bg-accent text-paper":active?"border-2 border-accent bg-panel":"bg-line"}`}>
            {done && <Icon name="check" className="size-3.5"/>}
          </span>
        </div>
        <span className="sr-only">Step {i+1} of 2{done?", completed":active?", current":", upcoming"}</span>
      </li>;
    })}
  </ol>;
}
export function DiarySummary({ entries }: { entries: Entry[] }) {
  const now = new Date();
  const today = entries.filter(
    (e) => new Date(e.occurredAt).toDateString() === now.toDateString(),
  ).length;
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const week = entries.filter(
    (e) => new Date(e.occurredAt) >= start && new Date(e.occurredAt) <= end,
  ).length;
  return (
    <section
      className="rounded-[1.75rem] bg-hero-start text-on-hero p-5 sm:p-6"
      aria-label="Diary summary"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-panel text-accent">
          <Icon name="calendar" />
        </span>
        <p className="text-sm font-semibold text-on-hero">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <p>
          <span className="block text-4xl font-bold tracking-tight text-on-hero">
            {today}
          </span>
          <span className="mt-1 block text-sm text-on-hero">
            {today === 1 ? "entry" : "entries"} today
          </span>
        </p>
        <p className="rounded-full bg-panel px-4 py-2 text-sm text-muted">
          <span className="font-bold text-ink">{week}</span> past 7 days
        </p>
      </div>
    </section>
  );
}
export function SeverityRating({ value }: { value: number | undefined }) {
  return (
    <span className="shrink-0 text-center">
      <span className="block text-[1.4rem] font-semibold leading-tight text-pain">
        {value ?? "—"}
      </span>
      <span className="block text-[.65rem] leading-relaxed text-muted">
        of 10
      </span>
    </span>
  );
}
export function ScoreControl({
  label,
  value,
  onChange,
  ariaLabel,
  tone = "neutral",
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  ariaLabel?: string;
  tone?: "pain" | "neutral";
}) {
  return (
    <label className="block rounded-[1.75rem] bg-sky-soft p-4">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted">
          <span
            className={`text-2xl font-semibold ${tone === "pain" ? "text-pain" : "text-accent-deep"}`}
          >
            {value}
          </span>{" "}
          / 10
        </span>
      </span>
      <input
        aria-label={ariaLabel ?? label}
        className={`my-1 block min-h-11 w-full ${tone === "pain" ? "accent-pain" : "accent-accent"}`}
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="flex justify-between text-[.65rem] text-muted">
        <span>0 · None</span>
        <span>10 · Very strong</span>
      </span>
    </label>
  );
}

export function StepActions({ onSkip, onNext, disabled = false, skipLabel = "Skip this step", nextLabel = "Continue" }: {
  onSkip?: () => void; onNext: () => void; disabled?: boolean; skipLabel?: string; nextLabel?: ReactNode;
}) {
  return <div className="flex items-center gap-3 border-t border-line pt-5" aria-label="Step actions">
    {onSkip && <button type="button" className="min-h-12 shrink-0 px-2 text-sm font-semibold text-accent underline underline-offset-4" onClick={onSkip}>{skipLabel}</button>}
    <button type="button" className={`${buttonPrimary} ml-auto min-w-32`} disabled={disabled} onClick={onNext}>{nextLabel}</button>
  </div>;
}
