import type { ReactNode } from "react";
import type { Entry } from "./store";

export const inputClass =
  "min-h-12 w-full rounded-2xl bg-sky-soft shadow-[inset_0_-2px_0_var(--line-strong)] px-4 py-3 text-base text-ink placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";
export const buttonPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-paper transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40";
export const buttonSecondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sky-soft px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-soft aria-pressed:bg-accent aria-pressed:text-paper disabled:opacity-40";
export type IconName =
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
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "home" ? <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></> : name === "history" ? <><path d="M3 11a9 9 0 1 1 2.7 7M3 4v7h7"/><path d="M12 7v5l3 2"/></> : name === "settings" ? <><path d="m9 3-.5 2.5-2 1.2L4 6l-2 3.5 2 1.8v2.4l-2 1.8L4 19l2.5-.7 2 1.2L9 22h6l.5-2.5 2-1.2 2.5.7 2-3.5-2-1.8v-2.4l2-1.8L20 6l-2.5.7-2-1.2L15 3Z"/><circle cx="12" cy="12.5" r="3"/></> : name === "photo" ? (<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>) : name === "camera" ? (<><path d="m8 5 1-2h6l1 2h4a2 2 0 0 1 2 2v12H2V7a2 2 0 0 1 2-2h4Z"/><circle cx="12" cy="12" r="4"/></>) : name === "plus" ? (
        <path d="M12 5v14M5 12h14" />
      ) : name === "pin" ? (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      ) : name === "cloud" ? (
        <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.8 10 4 4 0 0 1 19 18Z" />
      ) : name === "arrow" ? (
        <path d="M4 12h16m-6-6 6 6-6 6" />
      ) : name === "chevron" ? (
        <path d="m9 5 7 7-7 7" />
      ) : name === "shield" ? (
        <>
          <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
          <path d="m8 12 3 3 5-6" />
        </>
      ) : name === "check" ? (
        <path d="m5 12 4 4L19 6" />
      ) : name === "calendar" ? (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M7 3v4m10-4v4M3 10h18m-12 4h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
        </>
      ) : name === "note" ? (
        <>
          <path d="M8 4h10a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2Zm0 0v16m3-10h6m-6 4h6" />
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      )}
    </svg>
  );
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
