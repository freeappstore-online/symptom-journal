import type { BodyOrientation as Orientation } from "./orientation";

export function BodyOrientation({ view }: { view: Orientation }) {
  const edge = "rounded-full bg-panel px-2 py-1 text-[11px] font-semibold text-muted";
  const side = (name: string) => <span className={edge}>Your {name}</span>;
  return (
    <div aria-label="Patient orientation" className="pointer-events-none absolute inset-x-2 top-3 z-10 flex items-start justify-between gap-2">
      {view === "front" || view === "back" ? <>
        {side(view === "front" ? "right" : "left")}
        {side(view === "front" ? "left" : "right")}
      </> : <span className={`${edge} mx-auto`}>
        {view === "top" ? "Top view" : view === "bottom" ? "View from below" : `Your ${view} side`}
      </span>}
    </div>
  );
}
