import { t, displayLabel } from "./language";
import { GestureGuide, mapInput } from "./GestureGuide";
import { LibrarySelect } from "./LibrarySelect";
import { detailedSurfaceLocation } from "./surface-detail";
import { SubregionField } from "./SubregionField";
import { lazy, Suspense, useState, type ReactNode } from "react";
import { Modal, Spinner } from "@freeappstore/sdk/ui";
import {
  getBodyRegions,
  MODEL_ID,
  MALE_MODEL_ID,
  type SurfaceModel,
  surfaceLocation,
  setSurfaceMark,
  locationLabel,
  type Anchor,
} from "./anatomy";
import type { Location } from "./store";
import { buttonPrimary, StepActions } from "./ui";
const Canvas = lazy(() => import("./AnatomyCanvas"));
const guideStorageKey = "symptom-map:body-map-guide:v1";
let guideSeenThisSession = false;
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
  const [showHelp,setShowHelp] = useState(() => {
    try {
      return !guideSeenThisSession && localStorage.getItem(guideStorageKey) !== "seen";
    } catch {
      return !guideSeenThisSession;
    }
  });
  function dismissGuide() {
    guideSeenThisSession = true;
    setShowHelp(false);
    try {
      localStorage.setItem(guideStorageKey, "seen");
    } catch {
      // Keep the session preference when browser storage is unavailable.
    }
  }
  const [input, setInput] = useState(() => mapInput());
  const [focus, setFocus] = useState(selected?.surface3d?.focus);
  const bodyRegions = getBodyRegions(model);
  const surface = selected?.surface3d;

  function chooseRegion(location: Location) {
    setSelected(location);
    setFocus(location.surface3d?.focus);
  }

  function pick(anchor: Anchor) {
    const location = detailedSurfaceLocation(anchor, model);
    if (!focus) {
      chooseRegion({ ...location, detail: undefined });
      return;
    }
    if (!selected || !surface || location.surface3d?.regionId !== surface.regionId) return;
    const updated = setSurfaceMark({ ...selected, detail: location.detail }, "point", anchor);
    setSelected(updated);
  }

  return (
    <div className="space-y-4" onPointerDownCapture={event => setInput(mapInput(event.pointerType))}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{t(focus
          ? "Choose a spot, or keep this body part."
          : input === "touch" ? "Tap a body part, or choose its name." : "Click a body part, or choose its name.")}</p>
        {focus && <button type="button" className="min-h-11 shrink-0 font-semibold text-accent underline" onClick={() => setFocus(undefined)}>{t("Full body")}</button>}
      </div>
      <Modal open={showHelp} onClose={dismissGuide} title={t("Explore the body map")} maxWidth={420}>
        <div className="space-y-4">
          <GestureGuide input={input} canPan={!focus} />
          <button type="button" className={`${buttonPrimary} w-full`} onClick={dismissGuide}>{t("Start mapping")}</button>
        </div>
      </Modal>
      <Viewer model={model} onPick={pick} focus={focus} surface={surface} guided />
      {!focus && <LibrarySelect label={t("Search body regions")} placeholder="Choose by name" value="" options={bodyRegions.map(r => ({ id: r.id, label: r.name }))} onChange={id => {
        const region = bodyRegions.find(r => r.id === id);
        if (region) chooseRegion(surfaceLocation(region, { position: region.at, normal: { x: 0, y: 0, z: 1 } }, "front", model));
      }} />}
      {selected && surface && (
        <div className="space-y-3 rounded-3xl bg-sky-soft p-4">
          <SubregionField compact value={selected} onChange={setSelected} />
          {focus && <div>
            <button type="button" aria-pressed={!!surface.area} className="min-h-11 text-sm font-semibold text-accent underline" onClick={() => {
              const next = setSurfaceMark(selected, "area", surface.area ? undefined : surface.point ?? surface.focus);
              setSelected({ ...next, view: selected.view, surface3d: { ...next.surface3d!, aspect: surface.aspect } });
            }}>{t(surface.area ? "Remove wider area" : "Mark a wider area")}</button>
            {surface.area && <label className="block text-sm">{t("Area size")}<input aria-label={t("Pain area size")} type="range" min="8" max="80" className="block min-h-11 w-full accent-accent" value={Math.round(surface.radius * 1000)} onChange={e => setSelected({ ...selected, surface3d: { ...surface, radius: Number(e.target.value) / 1000 } })} /></label>}
          </div>}
          {selection?.(selected)}
        </div>
      )}
      <StepActions onSkip={onSkip} skipLabel={skipLabel} disabled={!selected || !ready} onNext={() => selected && onChoose(selected)} />
      <details className="text-xs text-muted">
        <summary className="min-h-11 cursor-pointer py-3">
          {t("About this body map")}
        </summary>
        <p>
          {t(model === MALE_MODEL_ID ? "Adult male" : "Adult female")}. {t("Regions are approximate and need clinical review. MakeHuman core assets, CC0.")}
        </p>
        <a
          href="/anatomy/SOURCES.md"
          target="_blank"
          rel="noreferrer"
          className="inline-block min-h-11 py-3 underline"
        >
          {t("Sources and licences")}
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
  showLabel = true,
  compact = false,
}: {
  value: Location;
  onChange?: (l: Location) => void;
  onComplete?: (l: Location) => void;
  stage?: "area" | "spot";
  onStageChange?: (s: "area" | "spot") => void;
  readOnly?: boolean;
  showLabel?: boolean;
  compact?: boolean;
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
              ? t("Tap the centre, then adjust the size.")
              : t("Tap the most painful spot.")}
          </p>
        </div>
      )}
      <Viewer
        key={`${s.regionId}-${readOnly}`}
        focus={s.focus}
        surface={s}
        readOnly={readOnly}
        compact={compact}
        onPick={(a) => change(setSurfaceMark(value, target, a))}
      />
      {showLabel && <p className="text-sm font-semibold">{displayLabel(locationLabel(value))}</p>}
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
              {t("Undo")}
            </button>
            <button
              className="min-h-11 px-2 text-sm font-semibold text-accent underline disabled:opacity-40"
              disabled={!placed}
              onClick={() => change(setSurfaceMark(value, target))}
            >
              {t(stage === "area" ? "Clear area" : "Clear point")}
            </button>
          </div>
          {stage === "area" && s.area && (
            <label className="block text-sm font-semibold">
              {t("Area size")}
              <input
                aria-label={t("Pain area size")}
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
                <span>{t("Smaller")}</span>
                <span>{t("Larger")}</span>
              </span>
            </label>
          )}
          <StepActions disabled={!placed} onNext={() => next(value)} skipLabel={stage === "area" ? t("Skip area") : t("Skip point")}
            onSkip={() => { const l=setSurfaceMark(value,target); onChange?.(l); next(l); }} />
        </>
      )}
      {!compact && s.regionId.endsWith("knee") && (
        <div className="rounded-3xl bg-panel p-4 print:hidden">
          <button
            className="min-h-11 text-sm font-bold underline"
            aria-expanded={reference}
            onClick={() => setReference((r) => !r)}
          >
            {t(reference ? "Hide knee bone reference" : "Show knee bone reference")}
          </button>
          {reference && (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                {t("Right knee · Adult male reference · Bones only. Your pain mark stays on the body surface.")}
              </p>
              <Viewer reference readOnly />
              <ul className="space-y-1 text-sm">
                <li>{t("Femur — thigh bone")}</li>
                <li>{t("Patella — kneecap")}</li>
                <li>{t("Tibia — shin bone")}</li>
                <li>{t("Fibula — outer lower-leg bone")}</li>
              </ul>
              <p className="text-xs text-muted">
                {t("BodyParts3D, DBCLS · CC BY 4.0. Independent anatomy reference; not aligned to the surface model. Cartilage and ligaments are not shown.")}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
