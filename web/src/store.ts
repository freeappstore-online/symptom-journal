import { validSubregion } from "./subregions.ts";
import { validPhotos, type EntryPhoto } from "./photo-policy.ts";
import { bodyRegions } from "./anatomy.ts";
import type { Surface3D } from "./anatomy";
export const STORAGE_KEY = "symptom-map:diary:v1";
export type Sex = "female" | "male" | "other" | "unspecified";
export type BodyIllustration = "female" | "male" | "list";
export type Profile = {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  bodyIllustration?: BodyIllustration;
};
export type Point = { x: number; y: number };
export type Location = {
  detail?: string;
  surface3d?: Surface3D;
  region: string;
  placement?: { area: boolean; spot: boolean };
  illustration?: "adult-female" | "adult-male" | "none";
  view: "front" | "back";
  mode: "spot" | "area" | "both" | "region";
  center: Point;
  spot: Point;
  width: number;
  height: number;
};
export type GeneralFeeling = {
  name: string;
  kind: "physical" | "mood";
  intensity: number;
  notes: string;
};
export type SymptomRating = { name: string; severity: number };
export type LogCategory = "body" | "physical" | "mental" | "temperature";
export type CustomSymptom = { profileId: string; name: string; scope: string };
export type Entry = {
  symptoms?: SymptomRating[];
  category?: LogCategory;
  temperature?: { celsius: number; method: string };
  photos?: EntryPhoto[];
  kind?: "symptom" | "general";
  feelings?: GeneralFeeling[];
  id: string;
  profileId: string;
  symptom: string;
  severity?: number;
  occurredAt: string;
  duration: string;
  notes: string;
  location: Location | null;
};
export type Diary = { version: 1; profiles: Profile[]; entries: Entry[]; customSymptoms?: CustomSymptom[] };
export const emptyDiary = (): Diary => ({
  version: 1,
  profiles: [],
  entries: [],
});
type StoragePort = Pick<Storage, "getItem" | "setItem">;
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown, max: number): x is string =>
  typeof x === "string" && x.length <= max;
const finite = (x: unknown, min: number, max: number): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
const point = (x: unknown) =>
  object(x) && finite(x.x, 0, 100) && finite(x.y, 0, 100);
export function validateDiary(value: unknown): Diary {
  const invalid = () => {
    throw new Error(
      "This file is not a supported Symptom Journal backup. Your diary was not changed.",
    );
  };
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.profiles) ||
    !Array.isArray(value.entries) ||
    value.profiles.length > 1000 || value.entries.length > 100000
  )
    return invalid();
  const ids = new Set<string>();
  for (const p of value.profiles) {
    if (
      !object(p) ||
      !text(p.id, 80) ||
      !p.id ||
      ids.has(p.id) ||
      !text(p.name, 40) ||
      !p.name.trim() ||
      !finite(p.age, 0, 120) ||
      !Number.isInteger(p.age) ||
      (typeof p.sex !== "string" || !["female", "male", "other", "unspecified"].includes(p.sex)) ||
      (p.bodyIllustration !== undefined &&
        (typeof p.bodyIllustration !== "string" || !["female", "male", "list"].includes(p.bodyIllustration)))
    )
      return invalid();
    ids.add(p.id);
  }
  const entryIds = new Set<string>();
  for (const e of value.entries) {
    if (
      !object(e) ||
      !text(e.id, 80) ||
      !e.id ||
      entryIds.has(e.id) ||
      (!text(e.profileId,80) || !ids.has(e.profileId)) ||
      !text(e.symptom, 80) ||
      !e.symptom.trim() ||
      (e.kind === "general"
        ? e.severity !== undefined && e.severity !== 0
        : e.temperature !== undefined ? e.severity !== undefined : !finite(e.severity, 0, 10) || !Number.isInteger(e.severity)) ||
      !text(e.occurredAt, 40) ||
      !Number.isFinite(Date.parse(e.occurredAt)) ||
      !text(e.duration, 80) ||
      !text(e.notes, 2000)
    )
      return invalid();
    if (
      e.kind !== undefined &&
      (typeof e.kind !== "string" || !["symptom", "general"].includes(e.kind))
    )
      return invalid();
    if (e.category !== undefined && (typeof e.category !== "string" || !["body","physical","mental","temperature"].includes(e.category))) return invalid();
    if (e.temperature !== undefined && (!object(e.temperature) || !finite(e.temperature.celsius,30,45) || !text(e.temperature.method,40))) return invalid();
    if ((e.temperature !== undefined && (e.category!=="temperature" || e.location!==null || e.kind==="general" || e.symptoms!==undefined)) || (e.category==="temperature" && e.temperature===undefined)) return invalid();
    if (e.symptoms !== undefined) {
      if (!Array.isArray(e.symptoms) || !e.symptoms.length || e.symptoms.length>20) return invalid();
      const names=new Set<string>();
      for (const item of e.symptoms) {
        if (!object(item) || !text(item.name,80) || !item.name.trim() || !finite(item.severity,0,10) || !Number.isInteger(item.severity) || names.has(item.name.trim().toLowerCase())) return invalid();
        names.add(item.name.trim().toLowerCase());
      }
      if (e.kind === "general" || e.symptom !== e.symptoms[0].name || e.severity !== e.symptoms[0].severity) return invalid();
    }
    if (e.photos !== undefined && !validPhotos(e.photos)) return invalid();
    if (e.feelings !== undefined) {
      if (!Array.isArray(e.feelings) || e.feelings.length > 20)
        return invalid();
      const names = new Set();
      for (const feeling of e.feelings) {
        if (
          !object(feeling) ||
          !text(feeling.name, 80) ||
          !feeling.name.trim() ||
          (typeof feeling.kind !== "string" || !["physical", "mood"].includes(feeling.kind)) ||
          !finite(feeling.intensity, 0, 10) ||
          !Number.isInteger(feeling.intensity) ||
          !text(feeling.notes, 500)
        )
          return invalid();
        const key = `${feeling.kind}:${feeling.name.trim().toLocaleLowerCase()}`;
        if (names.has(key)) return invalid();
        names.add(key);
      }
    }
    if (
      e.kind === "general" &&
      (e.location !== null ||
        !Array.isArray(e.feelings) ||
        !e.feelings.length ||
        (e.severity !== undefined && e.severity !== 0))
    )
      return invalid();
    if (e.location !== null) {
      const l = e.location;
      if (
        !object(l) ||
        (l.illustration !== undefined &&
          (typeof l.illustration !== "string" || !["adult-female", "adult-male", "none"].includes(
            l.illustration,
          ))) ||
        !text(l.region, 80) ||
        !l.region ||
        (typeof l.view !== "string" || !["front", "back"].includes(l.view)) ||
        (typeof l.mode !== "string" || !["spot", "area", "both", "region"].includes(l.mode)) ||
        !point(l.center) ||
        !point(l.spot) ||
        !finite(l.width, 4, 80) ||
        !finite(l.height, 4, 80)
      )
        return invalid();
      if (l.surface3d !== undefined) {
        const s = l.surface3d;
        const vector = (v: unknown): v is import("./anatomy").Vec3 =>
          object(v) &&
          finite(v.x, -2, 2) &&
          finite(v.y, -2, 2) &&
          finite(v.z, -2, 2);
        const anchor = (a: unknown) =>
          object(a) &&
          vector(a.position) &&
          vector(a.normal) &&
          Math.hypot(a.normal.x, a.normal.y, a.normal.z) > 0.9 &&
          Math.hypot(a.normal.x, a.normal.y, a.normal.z) < 1.1;
        if (
          !object(s) ||
          typeof s.model !== "string" ||
          !["makehuman-female-v1", "makehuman-male-v1"].includes(
            String(s.model),
          ) ||
          l.illustration !==
            (s.model === "makehuman-male-v1" ? "adult-male" : "adult-female") ||
          !text(s.regionId, 80) ||
          !bodyRegions.some(
            (r) => r.id === s.regionId && r.name === l.region,
          ) ||
          typeof s.aspect !== "string" ||
          !["front", "back", "medial", "lateral", "left", "right"].includes(
            String(s.aspect),
          ) ||
          !anchor(s.focus) ||
          (s.area !== undefined && !anchor(s.area)) ||
          (s.point !== undefined && !anchor(s.point)) ||
          !finite(s.radius, 0.008, 0.08) ||
          (s.area !== undefined) !==
            ["area", "both"].includes(String(l.mode)) ||
          (s.point !== undefined) !== ["spot", "both"].includes(String(l.mode))
        )
          return invalid();
      }
      if (!validSubregion(l as { region: string; surface3d?: {regionId:string}; detail?:unknown })) return invalid();
      if (l.placement !== undefined) {
        const mark = l.placement;
        if (
          !object(mark) ||
          typeof mark.area !== "boolean" ||
          typeof mark.spot !== "boolean" ||
          ((l.mode === "area" || l.mode === "both") && !mark.area) ||
          ((l.mode === "spot" || l.mode === "both") && !mark.spot) ||
          (l.mode === "region" && (mark.area || mark.spot))
        )
          return invalid();
      }
    }
    entryIds.add(e.id);
  }
  if(value.customSymptoms !== undefined) {
    if(!Array.isArray(value.customSymptoms) || value.customSymptoms.length>500) return invalid();
    const keys=new Set<string>();
    for(const c of value.customSymptoms) {
      if(!object(c) || (!text(c.profileId,80) || !ids.has(c.profileId)) || !text(c.name,80) || !c.name.trim() || !text(c.scope,80) || !c.scope) return invalid();
      const key=String(c.profileId)+":"+String(c.scope)+":"+c.name.toLowerCase();
      if(keys.has(key)) return invalid(); keys.add(key);
    }
  }
  // Construct a known shape, dropping unrelated properties in imported files.
  return {
    version: 1,
    ...(value.customSymptoms ? {customSymptoms:value.customSymptoms.map((c:CustomSymptom)=>({profileId:c.profileId,name:c.name,scope:c.scope}))} : {}),
    profiles: value.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      sex: p.sex,
      ...(p.bodyIllustration !== undefined
        ? { bodyIllustration: p.bodyIllustration }
        : {}),
    })),
    entries: value.entries.map((e) => ({
      id: e.id,
      ...(e.category ? {category:e.category} : {}),
      ...(e.temperature ? {temperature:{celsius:e.temperature.celsius,method:e.temperature.method}} : {}),
      ...(e.symptoms ? {symptoms:e.symptoms.map((s:SymptomRating)=>({name:s.name,severity:s.severity}))} : {}),
      ...(e.photos ? { photos: e.photos.map((p: EntryPhoto) => ({ id:p.id, dataUrl:p.dataUrl, width:p.width, height:p.height, caption:p.caption })) } : {}),
      ...(e.kind ? { kind: e.kind } : {}),
      ...(e.feelings
        ? {
            feelings: e.feelings.map((feeling: GeneralFeeling) => ({
              name: feeling.name,
              kind: feeling.kind,
              intensity: feeling.intensity,
              notes: feeling.notes,
            })),
          }
        : {}),
      profileId: e.profileId,
      symptom: e.symptom,
      ...(e.kind === "general" ? {} : { severity: e.severity }),
      occurredAt: e.occurredAt,
      duration: e.duration,
      notes: e.notes,
      location:
        e.location === null
          ? null
          : {
              region: e.location.region,
              ...(e.location.detail ? {detail:e.location.detail} : {}),
              ...(e.location.surface3d
                ? {
                    surface3d: (() => {
                      const s = e.location.surface3d;
                      const anchor = (a: import("./anatomy").Anchor) => ({
                        position: {
                          x: a.position.x,
                          y: a.position.y,
                          z: a.position.z,
                        },
                        normal: { x: a.normal.x, y: a.normal.y, z: a.normal.z },
                      });
                      return {
                        model: s.model,
                        regionId: s.regionId,
                        aspect: s.aspect,
                        focus: anchor(s.focus),
                        radius: s.radius,
                        ...(s.area ? { area: anchor(s.area) } : {}),
                        ...(s.point ? { point: anchor(s.point) } : {}),
                      };
                    })(),
                  }
                : {}),
              ...(e.location.placement
                ? {
                    placement: {
                      area: e.location.placement.area,
                      spot: e.location.placement.spot,
                    },
                  }
                : {}),
              illustration: e.location.illustration ?? "none",
              view: e.location.view,
              mode: e.location.mode,
              center: { x: e.location.center.x, y: e.location.center.y },
              spot: { x: e.location.spot.x, y: e.location.spot.y },
              width: e.location.width,
              height: e.location.height,
            },
    })),
  };
}
export function loadDiary(storage: StoragePort): {
  diary: Diary;
  raw: string | null;
} {
  const raw = storage.getItem(STORAGE_KEY);
  return {
    diary: raw === null ? emptyDiary() : validateDiary(JSON.parse(raw)),
    raw,
  };
}
export function saveDiary(
  storage: StoragePort,
  diary: Diary,
  expected: string | null,
): string {
  if (storage.getItem(STORAGE_KEY) !== expected)
    throw new Error(
      "Your diary changed in another tab. Reload this page before saving.",
    );
  const raw = JSON.stringify(validateDiary(diary));
  storage.setItem(STORAGE_KEY, raw);
  return raw;
}
export function profileEntries(diary: Diary, id: string): Entry[] {
  return diary.entries
    .filter((e) => e.profileId === id)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
