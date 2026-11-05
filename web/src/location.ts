import { setSurfaceMark } from "./anatomy.ts";
import type { Location, Point } from "./store";
export const regions = [
  { name: "Head", x: 50, y: 8 },
  { name: "Neck", x: 50, y: 15 },
  { name: "Right shoulder", x: 33, y: 20 },
  { name: "Left shoulder", x: 67, y: 20 },
  { name: "Chest", x: 50, y: 28 },
  { name: "Abdomen", x: 50, y: 36 },
  { name: "Right arm", x: 23, y: 42 },
  { name: "Left arm", x: 77, y: 42 },
  { name: "Pelvis", x: 50, y: 47 },
  { name: "Right hand", x: 13, y: 50 },
  { name: "Left hand", x: 87, y: 50 },
  { name: "Right thigh", x: 41, y: 66 },
  { name: "Left thigh", x: 59, y: 66 },
  { name: "Right knee", x: 40, y: 76 },
  { name: "Left knee", x: 60, y: 76 },
  { name: "Right lower leg", x: 39, y: 85 },
  { name: "Left lower leg", x: 61, y: 85 },
  { name: "Right foot", x: 38, y: 95 },
  { name: "Left foot", x: 62, y: 95 },
];
export function bodyRegion(name: string, view: "front" | "back") {
  if (view === "back")
    return (
      (
        {
          Chest: "Upper back",
          Abdomen: "Lower back",
          Pelvis: "Buttocks",
        } as Record<string, string>
      )[name] ?? name
    );
  return name;
}
export function nearestRegion(point: Point, view: "front" | "back") {
  return regions.reduce((closest, r) => {
    const distance = (p: typeof r) =>
      Math.hypot(
        ((view === "back" ? 100 - p.x : p.x) - point.x) * 2,
        (p.y - point.y) * 4.9,
      );
    return distance(r) < distance(closest) ? r : closest;
  });
}
export function defaultLocation(
  region: string,
  view: "front" | "back" = "front",
): Location {
  return {
    region,
    view,
    mode: "region",
    center: { x: 50, y: 50 },
    spot: { x: 50, y: 50 },
    width: 36,
    height: 28,
    placement: { area: false, spot: false },
  };
}
export function marks(value: Location) {
  const visible = {
    area: value.mode === "area" || value.mode === "both",
    spot: value.mode === "spot" || value.mode === "both",
  };
  return {
    area: visible.area && (value.placement?.area ?? true),
    spot: visible.spot && (value.placement?.spot ?? true),
  };
}
export function finishLocation(value: Location): Location {
  const placed = value.placement ?? marks(value);
  return {
    ...value,
    mode: placed.area
      ? placed.spot
        ? "both"
        : "area"
      : placed.spot
        ? "spot"
        : "region",
    placement: placed,
  };
}
export function skipMark(value: Location, target: "center" | "spot"): Location {
  if (value.surface3d)
    return setSurfaceMark(value, target === "center" ? "area" : "point");
  return finishLocation({
    ...value,
    placement: {
      ...marks(value),
      [target === "center" ? "area" : "spot"]: false,
    },
  });
}
export function moveMark(
  value: Location,
  target: "center" | "spot",
  point: Point,
): Location {
  return finishLocation({
    ...value,
    [target]: {
      x: Math.max(0, Math.min(100, point.x)),
      y: Math.max(0, Math.min(100, point.y)),
    },
    placement: {
      ...marks(value),
      [target === "center" ? "area" : "spot"]: true,
    },
  });
}
