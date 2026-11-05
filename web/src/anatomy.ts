import { specificLocationName } from "./subregions.ts";
import { maleRegionPoints } from "./male-region-points.ts";
import type { Profile, Location } from "./store";
export const MODEL_ID = "makehuman-female-v1" as const;
export const MALE_MODEL_ID = "makehuman-male-v1" as const;
export type SurfaceModel = typeof MODEL_ID | typeof MALE_MODEL_ID;
export function profileIllustration(
  p: Pick<Profile, "age" | "sex" | "bodyIllustration">,
): "female" | "male" | "list" {
  if (p.age < 18) return "list";
  return (
    p.bodyIllustration ??
    (p.sex === "female" || p.sex === "male" ? p.sex : "list")
  );
}
export function profileModel(
  p: Pick<Profile, "age" | "sex" | "bodyIllustration">,
): SurfaceModel | null {
  const choice = profileIllustration(p);
  return choice === "list"
    ? null
    : choice === "male"
      ? MALE_MODEL_ID
      : MODEL_ID;
}
export type Vec3 = { x: number; y: number; z: number };
export type Anchor = { position: Vec3; normal: Vec3 };
export type Aspect = "front" | "back" | "medial" | "lateral" | "left" | "right";
export type Surface3D = {
  model: SurfaceModel;
  regionId: string;
  aspect: Aspect;
  focus: Anchor;
  area?: Anchor;
  point?: Anchor;
  radius: number;
};
export const aspectNames: Record<Aspect, string> = {
  front: "Front",
  back: "Back",
  medial: "Inner side",
  lateral: "Outer side",
  left: "Left side",
  right: "Right side",
};
// Approximate surface regions. Coordinates come from the exported MakeHuman rig landmarks;
// these are selection guides, not diagnoses or validated anatomical segmentation.
export type BodyRegion = { id: string; name: string; at: Vec3; limb: boolean };
const mid = (id: string, name: string, y: number, z = 0): BodyRegion => ({
  id,
  name,
  at: { x: 0, y, z },
  limb: false,
});
const paired = (
  id: string,
  name: string,
  x: number,
  y: number,
  z = 0,
): BodyRegion[] =>
  (["right", "left"] as const).map((side) => ({
    id: `${side}-${id}`,
    name: `${side === "left" ? "Left" : "Right"} ${name}`,
    at: { x: side === "left" ? x : -x, y, z },
    limb: true,
  }));
export const bodyRegions: BodyRegion[] = [
  mid("head", "Head", 0.94, 0.02),
  mid("neck", "Neck", 0.846, 0),
  ...paired("shoulder", "shoulder", 0.097, 0.794, 0.013),
  ...paired("upper-arm", "upper arm", 0.15, 0.743, 0.015),
  ...paired("elbow", "elbow", 0.195, 0.686, 0.015),
  ...paired("forearm", "forearm", 0.227, 0.647, 0.055),
  ...paired("wrist", "wrist", 0.252, 0.621, 0.085),
  ...paired("hand", "hand", 0.275, 0.592, 0.11),
  mid("chest", "Chest", 0.765, 0.04),
  mid("upper-back", "Upper back", 0.765, -0.04),
  mid("abdomen", "Abdomen", 0.661, 0.035),
  mid("lower-back", "Lower back", 0.661, -0.035),
  mid("pelvis", "Pelvic region", 0.535, 0.04),
  mid("buttocks", "Buttocks", 0.535, -0.04),
  ...paired("thigh", "thigh", 0.073, 0.424, 0.01),
  ...paired("knee", "knee", 0.084, 0.28, 0.03),
  ...paired("lower-leg", "lower leg", 0.094, 0.17, 0.015),
  ...paired("ankle", "ankle", 0.103, 0.043, 0.019),
  ...paired("foot", "foot", 0.106, 0.015, 0.07),
];
export function getBodyRegions(model: SurfaceModel = MODEL_ID): BodyRegion[] {
  return model === MALE_MODEL_ID
    ? bodyRegions.map((r) => ({ ...r, at: maleRegionPoints[r.id] ?? r.at }))
    : bodyRegions;
}
export function closestBodyRegion(
  p: Vec3,
  model: SurfaceModel = MODEL_ID,
): BodyRegion {
  return getBodyRegions(model).reduce((best, r) => {
    const distance = (v: BodyRegion) =>
      Math.hypot(p.x - v.at.x, p.y - v.at.y, p.z - v.at.z);
    return distance(r) < distance(best) ? r : best;
  });
}
export function surfaceAspect(normal: Vec3, region: BodyRegion): Aspect {
  if (Math.abs(normal.z) >= Math.abs(normal.x))
    return normal.z >= 0 ? "front" : "back";
  if (!region.limb) return normal.x >= 0 ? "left" : "right";
  return normal.x >= 0 === region.id.startsWith("left-") ? "lateral" : "medial";
}
export function surfaceLocation(
  region: BodyRegion,
  focus: Anchor,
  aspect = surfaceAspect(focus.normal, region),
  model: SurfaceModel = MODEL_ID,
): Location {
  return {
    region: region.name,
    view: aspect === "back" ? "back" : "front",
    mode: "region",
    center: { x: 50, y: 50 },
    spot: { x: 50, y: 50 },
    width: 36,
    height: 28,
    placement: { area: false, spot: false },
    illustration: model === MALE_MODEL_ID ? "adult-male" : "adult-female",
    surface3d: {
      model,
      regionId: region.id,
      aspect,
      focus,
      radius: 0.025,
    },
  };
}
export function setSurfaceMark(
  l: Location,
  target: "area" | "point",
  anchor?: Anchor,
): Location {
  if (!l.surface3d) return l;
  const region = bodyRegions.find((r) => r.id === l.surface3d!.regionId);
  const s = {
    ...l.surface3d,
    [target]: anchor,
    ...(anchor && region
      ? { aspect: surfaceAspect(anchor.normal, region) }
      : {}),
  };
  const placed = { area: !!s.area, spot: !!s.point };
  return {
    ...l,
    view: s.aspect === "back" ? "back" : "front",
    surface3d: s,
    placement: placed,
    mode: placed.area
      ? placed.spot
        ? "both"
        : "area"
      : placed.spot
        ? "spot"
        : "region",
  };
}
export function locationLabel(l: Location): string {
  return l.surface3d
    ? `${specificLocationName(l)} · ${aspectNames[l.surface3d.aspect]}`
    : `${specificLocationName(l)} · ${l.view === "front" ? "Front" : "Back"}`;
}
