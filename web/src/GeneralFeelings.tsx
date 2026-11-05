import { DictionaryPicker } from "./DictionaryPicker";
import { useState } from "react";
import { buttonSecondary, inputClass, ScoreControl, StepActions } from "./ui";
import type { GeneralFeeling } from "./store";
const groups = [
  {
    kind: "physical" as const,
    title: "Physical symptoms",
    items: [
      "Fatigue",
      "Nausea",
      "Dizziness",
      "Feeling unwell",
      "Brain fog",
      "Sleepiness",
    ],
  },
  {
    kind: "mood" as const,
    title: "Mood",
    items: [
      "Calm",
      "Anxious",
      "Low mood",
      "Irritable",
      "Overwhelmed",
      "Content",
    ],
  },
];
const field = inputClass;
export function GeneralFeelings({
  value,
  onChange,
  onNext,
  hasLocation, embedded=false,
}: {
  embedded?:boolean;
  value: GeneralFeeling[];
  onChange: (v: GeneralFeeling[]) => void;
  onNext: () => void;
  hasLocation: boolean;
}) {
  const [library,setLibrary] = useState(false);
  const [custom, setCustom] = useState("");
  const [kind, setKind] = useState<"physical" | "mood">("physical");
  const [error, setError] = useState("");
  const key = (name: string, kind: string) =>
    `${kind}:${name.toLocaleLowerCase().trim()}`;
  const selected = (name: string, kind: string) =>
    value.some((v) => key(v.name, v.kind) === key(name, kind));
  const toggle = (name: string, kind: "physical" | "mood") => {
    setError("");
    if (selected(name, kind)) {
      onChange(value.filter((v) => key(v.name, v.kind) !== key(name, kind)));
      return;
    }
    if (value.length >= 20) {
      setError("You can record up to 20 feelings in one entry.");
      return;
    }
    onChange([...value, { name, kind, intensity: 5, notes: "" }]);
  };
  const add = () => {
    const name = custom.trim();
    if (!name) return;
    if (!selected(name, kind)) toggle(name, kind);
    setCustom("");
  };
  const change = (index: number, patch: Partial<GeneralFeeling>) =>
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  return (
    <div className="space-y-5">
      <button type="button" className={`${buttonSecondary} w-full justify-between`} onClick={()=>setLibrary(true)}>
        <span>Choose symptoms or mood</span><span aria-hidden="true">＋</span>
      </button>
      {library && <DictionaryPicker title="Symptoms and mood" multiple
        options={groups.flatMap(g=>g.items.map(name=>({id:key(name,g.kind),label:name,category:g.title})))}
        selected={value.map(v=>key(v.name,v.kind))}
        onClose={()=>setLibrary(false)} onDone={ids=>{
          if(ids.length>20) {setError("Choose up to 20 symptoms or moods.");return;}
          const known=groups.flatMap(g=>g.items.map(name=>({name,kind:g.kind})));
          // Preserve ratings, notes and custom selections when editing the library.
          const retained=value.filter(v=>ids.includes(key(v.name,v.kind)));
          const added=known.filter(v=>ids.includes(key(v.name,v.kind)) && !retained.some(old=>key(old.name,old.kind)===key(v.name,v.kind)))
            .map(v=>({...v,intensity:5,notes:""}));
          onChange([...retained,...added]);setLibrary(false);setError("");
        }}/>} 
      <details className="rounded-xl bg-panel px-4">
        <summary className="cursor-pointer py-3 text-sm font-semibold">
          Add a custom symptom or mood
        </summary>
        <div className="space-y-3 pb-4">
          <label className="block text-sm font-semibold">
            Feeling
            <input
              aria-label="Custom feeling"
              className={`${field} mt-2`}
              maxLength={80}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}}
              placeholder="In your own words"
            />
          </label>
          <label className="block text-sm font-semibold">
            Type
            <select
              aria-label="Feeling type"
              className={`${field} mt-2`}
              value={kind}
              onChange={(e) => setKind(e.target.value as "physical" | "mood")}
            >
              <option value="physical">Physical symptom</option>
              <option value="mood">Mood</option>
            </select>
          </label>
          <button className={buttonSecondary} type="button" onClick={add}>
            Add feeling
          </button>
        </div>
      </details>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {value.length > 0 && (
        <section className="space-y-3" aria-label="Selected general feelings">
          <h2 className="font-bold">Your feelings</h2>
          {value.map((v, index) => (
            <details
              key={key(v.name, v.kind)}
              className="border-t border-line pt-4"
            >
              <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 break-words font-bold">{v.name}</span>
                <span className="shrink-0 font-semibold">{v.intensity}/10 <span className="ml-2 text-accent">Edit</span></span>
              </summary>
              <button type="button" className="min-h-11 text-sm text-danger underline" aria-label={`Remove ${v.name}`} onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Remove {v.name}</button>
              <div className="mt-4">
                <ScoreControl
                  label="Intensity"
                  ariaLabel={`${v.name} intensity`}
                  value={v.intensity}
                  onChange={(intensity) => change(index, { intensity })}
                />
              </div>
              <details className="mt-2">
                <summary className="min-h-11 cursor-pointer py-3 text-sm text-accent">
                  {v.notes ? "Edit note" : "Add a note (optional)"}
                </summary>
                <textarea
                  aria-label={`Note for ${v.name}`}
                  className={field}
                  rows={2}
                  maxLength={500}
                  value={v.notes}
                  onChange={(e) => change(index, { notes: e.target.value })}
                />
              </details>
            </details>
          ))}
        </section>
      )}
      {!embedded && !hasLocation && !value.length && <p className="text-sm text-muted">Select a symptom or mood to continue.</p>}
      {!embedded && <StepActions onNext={onNext} disabled={!value.length}
        nextLabel="Continue" skipLabel="Skip feelings"
        onSkip={hasLocation && !value.length ? onNext : undefined} />}
    </div>
  );
}
export function FeelingsSummary({
  value,
  heading = true,
}: {
  value: GeneralFeeling[];
  heading?: boolean;
}) {
  return (
    <section className="mt-5 space-y-3" aria-label="General feelings">
      {heading && <h3 className="font-bold">General feelings</h3>}
      {value.map((v) => (
        <div
          key={`${v.kind}:${v.name}`}
          className="break-inside-avoid rounded-3xl bg-sky-soft p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="break-words font-semibold">{v.name}</p>
              <p className="text-xs text-muted">
                {v.kind === "mood" ? "Mood" : "Physical symptom"}
              </p>
            </div>
            <p className="shrink-0 font-semibold">
              {v.intensity}
              <span className="text-sm font-normal"> / 10</span>
            </p>
          </div>
          {v.notes && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              {v.notes}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
