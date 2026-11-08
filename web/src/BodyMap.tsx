import { LibrarySelect } from "./LibrarySelect";
import { SubregionField } from "./SubregionField";
import { BodyOrientation } from "./BodyOrientation";
import type { SurfaceModel } from "./anatomy";
import { AnatomyPicker, AnatomySketch } from "./AnatomyMap";
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { StepActions } from "./ui";
import { Tabs } from "@freeappstore/sdk/ui";
import type { Location, Point } from "./store";
import {
  bodyRegion,
  defaultLocation,
  finishLocation,
  skipMark,
  marks,
  moveMark,
  nearestRegion,
  regions,
} from "./location";

export function Silhouette({ view = "front" }: { view?: "front" | "back" }) {
  return (
    <g
      className="fill-anatomy stroke-anatomy-line"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M100 13 C78 13 73 28 76 43 C77 55 83 62 90 65 L90 79 L72 85 C61 89 57 100 54 115 L36 171 L23 215 L16 232 C13 241 14 249 19 249 L24 238 L22 251 C23 257 28 256 31 248 L40 228 L44 213 L64 164 L70 145 C73 167 68 177 65 192 C63 207 65 226 69 241 L72 284 L72 323 L67 365 L66 422 L61 467 C60 476 71 480 82 476 L88 469 L87 449 L91 403 L95 367 L99 314 L100 270 L101 314 L105 367 L109 403 L113 449 L112 469 L118 476 C129 480 140 476 139 467 L134 422 L133 365 L128 323 L128 284 L131 241 C135 226 137 207 135 192 C132 177 127 167 130 145 L136 164 L156 213 L160 228 L169 248 C172 256 177 257 178 251 L176 238 L181 249 C186 249 187 241 184 232 L177 215 L164 171 L146 115 C143 100 139 89 128 85 L110 79 L110 65 C117 62 123 55 124 43 C127 28 122 13 100 13 Z" />
      {view === "front" ? (
        <g fill="none">
          <path d="M83 105 Q87 122 100 117 Q113 122 117 105 M82 189 Q100 199 118 189 M98 258 L100 270 L102 258 M73 363 Q81 369 91 363 M109 363 Q119 369 127 363" />
          <path d="M86 85 L100 91 L114 85 M100 132 L100 168" />
        </g>
      ) : (
        <g fill="none">
          <path d="M100 90 L100 191 M76 104 Q82 132 95 138 M124 104 Q118 132 105 138 M70 232 Q86 250 100 237 Q114 250 130 232 M73 363 Q81 369 91 363 M109 363 Q119 369 127 363" />
        </g>
      )}
    </g>
  );
}
function LegacyRegionPicker({
  onChoose,
  showVisual,
  onSkip,
  skipLabel, selection, initialValue, ready=true,
}: {
  selection?: (l:Location)=>ReactNode; initialValue?:Location|null; ready?:boolean;
  onSkip: () => void;
  skipLabel: string;
  onChoose: (value: Location | null) => void;
  showVisual: boolean;
}) {
  const [view, setView] = useState<"front" | "back">(initialValue?.view ?? "front");
  const [selected, setSelected] = useState<string | null>(initialValue?.region ?? null);
  const selectedRegion = regions.find(
    (r) => bodyRegion(r.name, view) === selected,
  );
  const [detail,setDetail] = useState<string | undefined>(initialValue?.detail);
  const choose = (name: string) => {setSelected(name);setDetail(undefined);};
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {showVisual
            ? "Tap a body part to select it."
            : "Choose a body part from the list."}
        </p>

      </div>
      <Tabs
        tabs={[
          { key: "front", label: "Front of body" },
          { key: "back", label: "Back of body" },
        ]}
        active={view}
        onChange={(v) => {
          setView(v as "front" | "back");
          setSelected(null);
        }}
      />
      {showVisual && (
        <div className="rounded-[1.75rem] bg-panel px-3 py-4">
          <div className="relative h-9"><BodyOrientation view={view} /></div>
          <svg
            viewBox="0 0 200 490"
            role="img"
            aria-label={`${view === "front" ? "Front" : "Back"} of body. Tap a body part, or use the list below.`}
            className="mx-auto h-[22rem] w-full max-w-sm cursor-crosshair touch-manipulation"
            onPointerDown={(e) => {
              const p = svgPoint(e);
              if (p.x < 0 || p.x > 200 || p.y < 0 || p.y > 490) return;
              const r = nearestRegion({ x: p.x / 2, y: p.y / 4.9 }, view);
              choose(bodyRegion(r.name, view));
            }}
          >
            <Silhouette view={view} />
            {selectedRegion && (
              <g aria-hidden="true">
                <circle
                  cx={
                    (view === "back"
                      ? 100 - selectedRegion.x
                      : selectedRegion.x) * 2
                  }
                  cy={selectedRegion.y * 4.9}
                  r="14"
                  className="fill-accent-soft stroke-accent"
                  strokeWidth="2"
                />
                <circle
                  cx={
                    (view === "back"
                      ? 100 - selectedRegion.x
                      : selectedRegion.x) * 2
                  }
                  cy={selectedRegion.y * 4.9}
                  r="4"
                  className="fill-accent"
                />
              </g>
            )}
          </svg>
        </div>
      )}
      {showVisual ? (
        <details className="rounded-xl bg-panel px-4">
          <summary className="cursor-pointer py-3 text-sm font-semibold">
            Choose from a list
          </summary>
          <RegionSelect selected={selected} view={view} onSelect={choose} />
        </details>
      ) : (
        <RegionSelect selected={selected} view={view} onSelect={choose} />
      )}
      {selected && <SubregionField value={{...defaultLocation(selected,view),detail}} onChange={l=>setDetail(l.detail)} />}
      {selected && selection?.({...defaultLocation(selected,view),detail})}
      <div
        className={`${selected ? "sticky bottom-0 z-10" : ""} rounded-[1.75rem] bg-panel p-4 shadow-sm`}
      >
        <p aria-live="polite" className="mb-3 font-semibold">
          {selected
            ? `${selected} · ${view === "front" ? "Front" : "Back"}`
            : "Select a body part above"}
        </p>
        <StepActions onSkip={onSkip} skipLabel={skipLabel} disabled={!selected || !ready} onNext={()=>selected && onChoose({...defaultLocation(selected,view),...(detail?{detail}:{}),illustration:showVisual?"adult-female":"none"})} />
      </div>
    </div>
  );
}
function RegionSelect({
  selected,
  view,
  onSelect,
}: {
  selected: string | null;
  view: "front" | "back";
  onSelect: (name: string) => void;
}) {
  return <div className="mb-4"><LibrarySelect label="Body part" value={selected??""} options={regions.map(r=>({id:bodyRegion(r.name,view),label:bodyRegion(r.name,view)}))} onChange={onSelect}/></div>;
}
function svgPoint(e: PointerEvent<SVGSVGElement>): Point {
  const point = e.currentTarget.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  const matrix = e.currentTarget.getScreenCTM();
  if (!matrix) return { x: 50, y: 50 };
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}
function LegacyLocationSketch({
  value,
  onChange,
  onComplete,
  stage: controlledStage,
  onStageChange,
  readOnly = false,
  showVisual = true,
  showLabel = true,
}: {
  value: Location;
  onChange?: (l: Location) => void;
  onComplete?: (l: Location) => void;
  stage?: "area" | "spot";
  onStageChange?: (stage: "area" | "spot") => void;
  readOnly?: boolean;
  showVisual?: boolean;
  showLabel?: boolean;
}) {
  const [internalStage, setStage] = useState<"area" | "spot">("area");
  const stage = controlledStage ?? internalStage;
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStage = useRef(stage);
  useEffect(() => {
    if (previousStage.current === stage) return;
    previousStage.current = stage;
    stepHeading.current?.focus({ preventScroll: true });
    stepHeading.current?.scrollIntoView({ block: "start" });
  }, [stage]);
  const [history, setHistory] = useState<Location[]>([]);
  const latest = useRef(value);
  latest.current = value;
  const gesture = useRef<"center" | "spot" | null>(null);
  const hint = useId();
  const placed = marks(value);
  const activeTarget = stage === "area" ? "center" : "spot";
  const activePlaced = stage === "area" ? placed.area : placed.spot;
  const remember = () => setHistory((h) => [...h.slice(-19), value]);
  const change = (next: Location) => {
    remember();
    onChange?.(next);
  };
  const update = (point: Point) =>
    onChange?.(
      moveMark(latest.current, gesture.current ?? activeTarget, point),
    );
  const go = (next: "area" | "spot") => {
    setStage(next);
    onStageChange?.(next);
    setHistory([]);
    gesture.current = null;
  };
  const complete = (next: Location) => onComplete?.(finishLocation(next));
  const skip = () => {
    const next = skipMark(value, activeTarget);
    onChange?.(next);
    if (stage === "area") go("spot");
    else complete(next);
  };
  const region = regions.find(
    (r) => bodyRegion(r.name, value.view) === value.region,
  );
  const cx = region
    ? (value.view === "back" ? 100 - region.x : region.x) * 2
    : 100;
  const cy = region ? region.y * 4.9 : 220;
  const modeLabel =
    value.mode === "region"
      ? "Body part only"
      : value.mode === "spot"
        ? "Pain point"
        : value.mode === "area"
          ? "Pain area"
          : "Area and pain point";
  const instruction =
    stage === "area"
      ? activePlaced
        ? "Drag to adjust the area."
        : "Tap the centre of the painful area."
      : activePlaced
        ? "Drag to adjust the point."
        : "Tap the most painful point.";
  return (
    <div className="space-y-4">
      {!readOnly && (
        <div aria-live="polite">
          <p className="sr-only">Step {stage === "area" ? "1" : "2"} of 4</p>
          <h2
            ref={stepHeading}
            tabIndex={-1}
            className="sr-only"
          >
            {stage === "area" ? "Wider pain area" : "Most painful point"}{" "}
            <span className="text-sm font-normal text-muted">(optional)</span>
          </h2>
          <p id={hint} className="mt-2 text-sm text-muted">
            {instruction}
          </p>
        </div>
      )}
      {showLabel && <p className="text-xs text-muted">{value.region} · {value.view === "front" ? "Front" : "Back"} · Patient’s perspective</p>}
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${value.region}, ${value.view}, ${readOnly ? modeLabel : stage === "area" ? "mark wider area" : "mark pain point"}`}
        aria-describedby={readOnly ? undefined : hint}
        tabIndex={readOnly ? undefined : 0}
        className={`w-full rounded-[1.75rem] bg-paper-deep ${readOnly ? "max-h-48" : "max-h-80 cursor-crosshair touch-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"}`}
        onKeyDown={
          readOnly
            ? undefined
            : (e) => {
                const dirs: Record<string, Point> = {
                  ArrowLeft: { x: -1, y: 0 },
                  ArrowRight: { x: 1, y: 0 },
                  ArrowUp: { x: 0, y: -1 },
                  ArrowDown: { x: 0, y: 1 },
                };
                const d = dirs[e.key];
                if (!d) return;
                e.preventDefault();
                remember();
                const step = e.shiftKey ? 5 : 1;
                update({
                  x: value[activeTarget].x + d.x * step,
                  y: value[activeTarget].y + d.y * step,
                });
              }
        }
        onPointerDown={
          readOnly
            ? undefined
            : (e) => {
                e.preventDefault();
                remember();
                gesture.current = activeTarget;
                e.currentTarget.setPointerCapture(e.pointerId);
                update(svgPoint(e));
              }
        }
        onPointerMove={
          readOnly
            ? undefined
            : (e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  update(svgPoint(e));
              }
        }
        onPointerUp={() => {
          gesture.current = null;
        }}
        onPointerCancel={() => {
          gesture.current = null;
        }}
      >
        {showVisual && region && (
          <svg
            x="0"
            y="0"
            width="100"
            height="100"
            viewBox={`${cx - 50} ${cy - 50} 100 100`}
            aria-hidden="true"
          >
            <Silhouette view={value.view} />
          </svg>
        )}
        {placed.area && (
          <ellipse
            cx={value.center.x}
            cy={value.center.y}
            rx={value.width / 2}
            ry={value.height / 2}
            className="fill-sky/25 stroke-sky"
            strokeWidth=".8"
          />
        )}
        {placed.spot && (
          <g>
            <circle
              cx={value.spot.x}
              cy={value.spot.y}
              r="4"
              className="fill-pain-soft stroke-pain"
              strokeWidth=".8"
            />
            <path
              d={`M${value.spot.x - 2} ${value.spot.y}h4M${value.spot.x} ${value.spot.y - 2}v4`}
              className="stroke-pain"
              strokeWidth=".8"
            />
          </g>
        )}
      </svg>
      {readOnly && value.mode === "region" && (
        <p className="text-sm text-muted">
          Body part recorded; no area or point marked.
        </p>
      )}
      {!readOnly && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              {stage === "area"
                ? "Shading shows where it hurts."
                : "⊕ marks the most painful point."}
            </span>
            <div className="flex gap-1">
              <button
                className="min-h-11 px-3 text-sm font-semibold text-accent disabled:opacity-40"
                type="button"
                disabled={!history.length}
                onClick={() => {
                  const previous = history.at(-1);
                  if (previous) {
                    onChange?.(previous);
                    setHistory((h) => h.slice(0, -1));
                  }
                }}
              >
                Undo
              </button>
              <button
                type="button"
                disabled={!activePlaced}
                className="min-h-11 px-3 text-sm font-semibold text-accent disabled:opacity-40"
                onClick={() => change(skipMark(value, activeTarget))}
              >
                Clear {stage === "area" ? "area" : "point"}
              </button>
            </div>
          </div>
          {stage === "area" && placed.area && (
            <label className="block text-sm font-semibold">
              Area size
              <input
                aria-label="Area size"
                className="mt-1 block min-h-11 w-full accent-accent"
                type="range"
                min="8"
                max="80"
                value={value.width}
                onChange={(e) => {
                  const width = Number(e.target.value);
                  change({
                    ...value,
                    width,
                    height: Math.max(4, Math.round(width * 0.78)),
                  });
                }}
              />
              <span className="flex justify-between text-xs font-normal text-muted">
                <span>Smaller</span>
                <span>Larger</span>
              </span>
            </label>
          )}
          <details className="rounded-xl bg-panel px-4">
            <summary className="cursor-pointer py-3 text-sm font-semibold">
              Fine-tune position
            </summary>
            <p className="mb-2 text-xs text-muted">
              Adjust {stage === "area" ? "the area" : "the point"}, or use arrow
              keys on the map.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(["x", "y"] as const).map((axis) => (
                <label key={axis} className="text-sm">
                  {axis === "x" ? "Left / right" : "Up / down"}
                  <input
                    aria-label={
                      axis === "x" ? "Horizontal position" : "Vertical position"
                    }
                    className="block min-h-11 w-full accent-accent"
                    type="range"
                    min="0"
                    max="100"
                    value={value[activeTarget][axis]}
                    onChange={(e) =>
                      change(
                        moveMark(value, activeTarget, {
                          ...value[activeTarget],
                          [axis]: Number(e.target.value),
                        }),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            {stage === "area" && placed.area && (
              <label className="mb-3 block text-sm">
                Area height
                <input
                  aria-label="Area height"
                  className="block min-h-11 w-full accent-accent"
                  type="range"
                  min="4"
                  max="80"
                  value={value.height}
                  onChange={(e) =>
                    change({ ...value, height: Number(e.target.value) })
                  }
                />
              </label>
            )}
          </details>
          <StepActions disabled={!activePlaced} onNext={() => stage === "area" ? go("spot") : complete(value)}
            onSkip={skip} skipLabel={stage === "area" ? "Skip area" : "Skip point"} />
        </>
      )}
    </div>
  );
}

export function RegionPicker(
  props: React.ComponentProps<typeof LegacyRegionPicker> & {
    model?: SurfaceModel;
  },
) {
  return props.showVisual ? (
    <AnatomyPicker
      model={props.model}
      onChoose={props.onChoose}
      onSkip={props.onSkip}
      skipLabel={props.skipLabel}
      initialValue={props.initialValue} selection={props.selection} ready={props.ready}
    />
  ) : (
    <LegacyRegionPicker {...props} />
  );
}
export function LocationSketch(
  props: React.ComponentProps<typeof LegacyLocationSketch>,
) {
  return props.value.surface3d ? (
    <AnatomySketch {...props} />
  ) : (
    <LegacyLocationSketch {...props} />
  );
}
