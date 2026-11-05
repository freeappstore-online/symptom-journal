import { GestureGuide } from "./GestureGuide";
import { LibrarySelect } from "./LibrarySelect";
import { detailedSurfaceLocation } from "./surface-detail";
import { SubregionField } from "./SubregionField";
import { lazy, Suspense, useState, useRef, useEffect, type ReactNode } from "react";
import { Modal, Spinner } from "@freeappstore/sdk/ui";
import {
  getBodyRegions,
  MODEL_ID,
  MALE_MODEL_ID,
  type SurfaceModel,
  surfaceLocation,
  setSurfaceMark,
  aspectNames,
  locationLabel,
  type Anchor,
  type Aspect,
} from "./anatomy";
import type { Location } from "./store";
import { buttonPrimary, buttonSecondary, inputClass, StepActions } from "./ui";
const Canvas = lazy(() => import("./AnatomyCanvas"));
function Viewer(props: React.ComponentProps<typeof Canvas>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <Canvas {...props} />
    </Suspense>
  );
}
function RegionFields({
  value,
  onChange,
}: {
  value: Location;
  onChange: (l: Location) => void;
}) {
  const s = value.surface3d!;
  const bodyRegions = getBodyRegions(s.model);
  const region = bodyRegions.find((r) => r.id === s.regionId)!;
  const aspects: Aspect[] = region?.limb
    ? ["front", "back", "medial", "lateral"]
    : ["front", "back", "left", "right"];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        Body region
        <select
          aria-label="Body region"
          className={`${inputClass} mt-1`}
          value={s.regionId}
          onChange={(e) => {
            const r = bodyRegions.find((r) => r.id === e.target.value)!;
            onChange(
              surfaceLocation(
                r,
                { position: r.at, normal: { x: 0, y: 0, z: 1 } },
                "front",
                s.model,
              ),
            );
          }}
        >
          {bodyRegions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        Part of region
        <select
          aria-label="Part of region"
          className={`${inputClass} mt-1`}
          value={s.aspect}
          onChange={(e) => {
            const a = e.target.value as Aspect;
            const sign = region.id.startsWith("left-") ? 1 : -1;
            const normal =
              a === "front"
                ? { x: 0, y: 0, z: 1 }
                : a === "back"
                  ? { x: 0, y: 0, z: -1 }
                  : a === "left"
                    ? { x: 1, y: 0, z: 0 }
                    : a === "right"
                      ? { x: -1, y: 0, z: 0 }
                      : { x: a === "lateral" ? sign : -sign, y: 0, z: 0 };
            onChange({
              ...value,
              view: a === "back" ? "back" : "front",
              surface3d: {
                ...s,
                aspect: a,
                focus: { position: region.at, normal },
              },
            });
          }}
        >
          {aspects.map((a) => (
            <option key={a} value={a}>
              {aspectNames[a]}
            </option>
          ))}
        </select>
      </label>

    </div>
  );
}
export function AnatomyPicker({
  onChoose,
  onSkip,
  skipLabel,
  model = MODEL_ID,
  selection, initialValue, ready=true,
}: {
  selection?: (l:Location)=>ReactNode; initialValue?:Location|null; ready?:boolean;
  model?: SurfaceModel;
  onChoose: (l: Location | null) => void;
  onSkip: () => void;
  skipLabel: string;
}) {
  const [selected, setSelected] = useState<Location | null>(initialValue?.surface3d?.model===model ? initialValue : null);
  const [showHelp,setShowHelp] = useState(true);
  const [markMode,setMarkMode] = useState<"region"|"area"|"point">("region");
  const [guide,setGuide] = useState<"idle"|"ask-area"|"area"|"ask-point"|"point"|"done">(initialValue ? "done" : "idle");
  const promptButton = useRef<HTMLButtonElement>(null);
  const asking = guide === "ask-area" || guide === "ask-point";
  const editing = guide === "area" || guide === "point";
  useEffect(()=>{if(asking) promptButton.current?.focus({preventScroll:true});},[guide,asking]);
  const bodyRegions = getBodyRegions(model);
  function chooseRegion(l:Location) {setSelected(l);setMarkMode("region");setGuide("ask-area");}
  function skipMark() {
    const target = guide === "ask-area" || guide === "area" ? "area" : "point";
    if(selected) setSelected(setSurfaceMark(selected,target));
    setMarkMode("region");setGuide(target === "area" ? "ask-point" : "done");
  }
  function pick(a: Anchor) {
    if(selected && markMode!=="region") {setSelected(setSurfaceMark(selected,markMode,a));return;}
    chooseRegion(detailedSurfaceLocation(a,model));
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">Tap a body part, or choose its name.</p><button type="button" className="min-h-11 shrink-0 text-sm font-bold text-accent underline" onClick={()=>setShowHelp(true)}>How to move</button></div>
      <Modal open={showHelp} onClose={()=>setShowHelp(false)} title="Explore the body map" maxWidth={420}>
        <div className="space-y-4">
          <GestureGuide/>
          <p className="text-xs text-muted">Scroll the page outside the map. The arrow and zoom buttons work too.</p>
          <button type="button" className={`${buttonPrimary} w-full`} onClick={()=>setShowHelp(false)}>Start mapping</button>
        </div>
      </Modal>
      <div className="relative">
        <div inert={asking} className={asking ? "pointer-events-none select-none blur-sm" : ""}>
          <Viewer model={model} onPick={pick} focus={selected?.surface3d?.focus} surface={selected?.surface3d} />
        </div>
        {asking && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-scrim p-4">
          <section role="dialog" aria-label={guide==="ask-area"?"Mark a wider area":"Mark an exact or most painful spot"} className="w-full max-w-sm space-y-4 rounded-3xl bg-panel p-5 shadow-lg">
            <p className="text-xs font-bold text-muted">{guide==="ask-area"?"1 · Wider area":"2 · Exact or most painful spot"}</p>
            <svg aria-hidden="true" viewBox="0 0 160 66" className="h-16 w-full text-accent" fill="none">
              <path d="M30 56Q42 10 80 10T130 56" stroke="currentColor" strokeWidth="2" opacity=".3"/>
              {guide==="ask-area"?<ellipse cx="80" cy="34" rx="32" ry="20" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3"/>:<><circle cx="80" cy="34" r="17" stroke="currentColor" strokeWidth="2"/><circle cx="80" cy="34" r="5" fill="currentColor"/></>}
            </svg>
            <h2 className="text-xl">{guide==="ask-area"?"Does it cover a wider area?":"Is there an exact or most painful spot?"}</h2>
            <p className="text-sm text-muted">{guide==="ask-area"?"Tap the centre, then resize the shaded area.":"Tap the point that best matches where you feel it."}</p>
            <div className="flex items-center justify-between gap-3">
              <button type="button" className={buttonSecondary} onClick={skipMark}>Skip {guide==="ask-area"?"area":"spot"}</button>
              <button ref={promptButton} type="button" className={buttonPrimary} onClick={()=>{const tool=guide==="ask-area"?"area":"point";setMarkMode(tool);setGuide(tool);}}>Mark {guide==="ask-area"?"area":"spot"}</button>
            </div>
          </section>
        </div>}
      </div>
      {editing && selected && <section aria-label="Marking controls" className="space-y-3 rounded-3xl bg-panel p-4">
        <p role="status" className="text-sm font-semibold">{guide==="area"?"Tap the centre of the wider area.":"Tap the exact or most painful spot on the body."}</p>
        {guide==="area" && selected.surface3d?.area && <label className="block text-sm">Area size<input aria-label="Pain area size" type="range" min="8" max="80" className="block min-h-11 w-full accent-accent" value={Math.round(selected.surface3d.radius*1000)} onChange={e=>setSelected({...selected,surface3d:{...selected.surface3d!,radius:Number(e.target.value)/1000}})}/></label>}
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={buttonSecondary} onClick={skipMark}>Skip {guide==="area"?"area":"spot"}</button>
          <button type="button" className={buttonPrimary} disabled={!selected.surface3d?.[guide==="area"?"area":"point"]} onClick={()=>{setMarkMode("region");setGuide(guide==="area"?"ask-point":"done");}}>Use this {guide==="area"?"area":"spot"}</button>
        </div>
      </section>}
      {guide==="done" && selected && <div className="flex items-center justify-between gap-3 text-sm"><p>{selected.surface3d?.area ? "Area marked" : "No wider area"} · {selected.surface3d?.point ? "Spot marked" : "No spot marked"}</p><button type="button" className="min-h-11 px-2 font-bold text-accent underline" onClick={()=>setGuide("ask-area")}>Edit markings</button></div>}

      {selected && guide==="done" ? (
        <div className="space-y-3 rounded-3xl bg-sky-soft p-4">
          <SubregionField compact value={selected} onChange={setSelected}/>
          {selection?.(selected)}
          <details className="text-sm"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-accent">Change body region or side</summary><RegionFields value={selected} onChange={chooseRegion}/></details>


        </div>
      ) : !selected ? (
        <label className="block text-sm font-semibold">
          Choose by name
          <LibrarySelect label="Search body regions" value="" options={bodyRegions.map(r=>({id:r.id,label:r.name}))} onChange={id=>{const r=bodyRegions.find(r=>r.id===id);if(r)chooseRegion(surfaceLocation(r,{position:r.at,normal:{x:0,y:0,z:1}},"front",model));}}/>
        </label>
      ) : null}
      {!asking && !editing && <StepActions onSkip={onSkip} skipLabel={skipLabel} disabled={!selected || !ready} onNext={() => selected && onChoose(selected)} />}
      <details className="text-xs text-muted">
        <summary className="min-h-11 cursor-pointer py-3">
          About this body map
        </summary>
        <p>
          Adult {model === MALE_MODEL_ID ? "male" : "female"} reference. Regions
          are approximate and need clinical review. MakeHuman core assets, CC0.
        </p>
        <a
          href="/anatomy/SOURCES.md"
          target="_blank"
          rel="noreferrer"
          className="inline-block min-h-11 py-3 underline"
        >
          Sources and licences
        </a>
      </details>
    </div>
  );
}
export function AnatomySketch({
  value,
  onChange,
  onComplete,
  stage = "area",
  onStageChange,
  readOnly = false,
}: {
  value: Location;
  onChange?: (l: Location) => void;
  onComplete?: (l: Location) => void;
  stage?: "area" | "spot";
  onStageChange?: (s: "area" | "spot") => void;
  readOnly?: boolean;
}) {
  const [history, setHistory] = useState<Location[]>([]);
  const [reference, setReference] = useState(false);
  const s = value.surface3d!;
  const target = stage === "area" ? "area" : "point";
  const placed = !!s[target];
  const change = (l: Location) => {
    setHistory((h) => [...h.slice(-19), value]);
    onChange?.(l);
  };
  const next = (l: Location) => {
    setHistory([]);
    if (stage === "area") onStageChange?.("spot");
    else onComplete?.(l);
  };
  return (
    <div className="space-y-4">
      {!readOnly && (
        <div>

          <p className="mt-1 text-sm text-muted">
            {stage === "area"
              ? "Tap the centre, then adjust the size."
              : "Tap the most painful spot."}
          </p>
        </div>
      )}
      <Viewer
        key={`${s.regionId}-${readOnly}`}
        focus={s.focus}
        surface={s}
        readOnly={readOnly}
        onPick={(a) => change(setSurfaceMark(value, target, a))}
      />
      <p className="text-sm font-semibold">{locationLabel(value)}</p>
      {!readOnly && (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              className="min-h-11 px-2 text-sm font-semibold text-accent underline disabled:opacity-40"
              disabled={!history.length}
              onClick={() => {
                const old = history.at(-1);
                if (old) onChange?.(old);
                setHistory((h) => h.slice(0, -1));
              }}
            >
              Undo
            </button>
            <button
              className="min-h-11 px-2 text-sm font-semibold text-accent underline disabled:opacity-40"
              disabled={!placed}
              onClick={() => change(setSurfaceMark(value, target))}
            >
              Clear {stage === "area" ? "area" : "point"}
            </button>
          </div>
          {stage === "area" && s.area && (
            <label className="block text-sm font-semibold">
              Area size
              <input
                aria-label="Pain area size"
                type="range"
                min="8"
                max="80"
                value={Math.round(s.radius * 1000)}
                className="block min-h-11 w-full accent-accent"
                onChange={(e) =>
                  change({
                    ...value,
                    surface3d: { ...s, radius: Number(e.target.value) / 1000 },
                  })
                }
              />
              <span className="flex justify-between text-xs font-normal text-muted">
                <span>Smaller</span>
                <span>Larger</span>
              </span>
            </label>
          )}
          <StepActions disabled={!placed} onNext={() => next(value)} skipLabel={stage === "area" ? "Skip area" : "Skip point"}
            onSkip={() => { const l=setSurfaceMark(value,target); onChange?.(l); next(l); }} />
        </>
      )}
      {s.regionId.endsWith("knee") && (
        <div className="rounded-3xl bg-panel p-4">
          <button
            className="min-h-11 text-sm font-bold underline"
            aria-expanded={reference}
            onClick={() => setReference((r) => !r)}
          >
            {reference ? "Hide" : "Show"} knee bone reference
          </button>
          {reference && (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Right knee · Adult male reference · Bones only. Your pain mark
                stays on the body surface.
              </p>
              <Viewer reference readOnly />
              <ul className="space-y-1 text-sm">
                <li>Femur — thigh bone</li>
                <li>Patella — kneecap</li>
                <li>Tibia — shin bone</li>
                <li>Fibula — outer lower-leg bone</li>
              </ul>
              <p className="text-xs text-muted">
                BodyParts3D, DBCLS · CC BY 4.0. Independent anatomy reference;
                not aligned to the surface model. Cartilage and ligaments are
                not shown.
              </p>
            </div>
          )}
        </div>
      )}
      {readOnly && !s.area && !s.point && (
        <p className="text-xs text-muted">
          Body region only; no area or point recorded.
        </p>
      )}
    </div>
  );
}
