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
export const sleepQualities = ["Poor", "Fair", "Good"] as const;
export const periodFlows = ["Spotting", "Light flow", "Moderate flow", "Heavy flow"] as const;
export const glucoseUnits = ["mg/dL", "mmol/L"] as const;
export const glucoseContexts = ["Fasting", "Before a meal", "After a meal"] as const;
export const readingLabels = {
  temperature: "Temperature",
  bloodPressure: "Blood pressure",
  bloodGlucose: "Blood sugar",
  period: "Period",
  sleep: "Sleep",
} as const;
export type ReadingCategory = keyof typeof readingLabels;
const readingTypes = Object.keys(readingLabels) as ReadingCategory[];
export type LogCategory = "body" | "physical" | "mental" | ReadingCategory;
export function isReadingCategory(category: unknown): category is ReadingCategory {
  return typeof category === "string" && Object.hasOwn(readingLabels, category);
}
export type CustomSymptom = { profileId: string; name: string; scope: string };
export type MonitoringUpdate = {
  id: string;
  occurredAt: string;
  symptoms?: SymptomRating[];
  severity?: number;
  notes: string;
  photos?: EntryPhoto[];
};
export type EntryMonitoring = {
  status: "active" | "ended";
  updates: MonitoringUpdate[];
};
export type Entry = {
  symptoms?: SymptomRating[];
  category?: LogCategory;
  temperature?: { celsius: number; method: string };
  bloodPressure?: { systolic: number; diastolic: number };
  bloodGlucose?: { value: number; unit: typeof glucoseUnits[number]; context: "" | typeof glucoseContexts[number] };
  period?: { flow: typeof periodFlows[number] };
  sleep?: { bedtime: string; quality: "" | typeof sleepQualities[number] };
  photos?: EntryPhoto[];
  kind?: "symptom" | "general";
  feelings?: GeneralFeeling[];
  monitoring?: EntryMonitoring;
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
        : isReadingCategory(e.category) ? e.severity !== undefined : !finite(e.severity, 0, 10) || !Number.isInteger(e.severity)) ||
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
    if (e.category !== undefined && (typeof e.category !== "string" || !["body","physical","mental"].includes(e.category) && !isReadingCategory(e.category))) return invalid();
    if (e.temperature !== undefined && (!object(e.temperature) || !finite(e.temperature.celsius,30,45) || !text(e.temperature.method,40))) return invalid();
    if (readingTypes.some(type => (e[type] !== undefined) !== (e.category === type))) return invalid();
    if (isReadingCategory(e.category) && (e.location !== null || e.kind === "general" || e.symptoms !== undefined || (e.category !== "temperature" && e.feelings !== undefined))) return invalid();
    if (e.bloodPressure !== undefined) {
      const pressure = e.bloodPressure;
      if (!object(pressure) || !finite(pressure.systolic, 1, 999) || !Number.isInteger(pressure.systolic)
        || !finite(pressure.diastolic, 1, 999) || !Number.isInteger(pressure.diastolic)) return invalid();
    }
    if (e.bloodGlucose !== undefined) {
      const glucose = e.bloodGlucose;
      if (!object(glucose) || !finite(glucose.value, 0.01, 9999)
        || !glucoseUnits.some(unit => unit === glucose.unit)
        || (glucose.context !== "" && !glucoseContexts.some(context => context === glucose.context))) return invalid();
    }
    if (e.sleep !== undefined) {
      const sleep = e.sleep;
      if (!object(sleep) || !text(sleep.bedtime, 40) ||
        !Number.isFinite(Date.parse(sleep.bedtime)) || Date.parse(sleep.bedtime) >= Date.parse(e.occurredAt) ||
        (sleep.quality !== "" && !sleepQualities.some(quality => quality === sleep.quality))) return invalid();
    }
    if (e.period !== undefined) {
      const period = e.period;
      if (!object(period) || !periodFlows.some(flow => flow === period.flow)) return invalid();
    }
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
    if (e.monitoring !== undefined) {
      if (
        isReadingCategory(e.category) ||
        e.kind === "general" ||
        !object(e.monitoring) ||
        (typeof e.monitoring.status !== "string" ||
          !["active", "ended"].includes(e.monitoring.status)) ||
        !Array.isArray(e.monitoring.updates) ||
        e.monitoring.updates.length > 1000
      )
        return invalid();
      const updateIds = new Set<string>();
      const baseNames = Array.isArray(e.symptoms)
        ? e.symptoms.map((item: SymptomRating) => item.name.trim().toLowerCase())
        : [String(e.symptom).trim().toLowerCase()];
      for (const update of e.monitoring.updates) {
        if (
          !object(update) ||
          !text(update.id, 80) ||
          !update.id ||
          updateIds.has(update.id) ||
          !text(update.occurredAt, 40) ||
          !Number.isFinite(Date.parse(update.occurredAt)) ||
          !text(update.notes, 2000)
        )
          return invalid();
        updateIds.add(update.id);
        if (update.symptoms !== undefined) {
          if (
            !Array.isArray(update.symptoms) ||
            update.symptoms.length !== baseNames.length
          )
            return invalid();
          const seen = new Set<string>();
          for (const item of update.symptoms) {
            if (
              !object(item) ||
              !text(item.name, 80) ||
              !item.name.trim() ||
              !finite(item.severity, 0, 10) ||
              !Number.isInteger(item.severity)
            )
              return invalid();
            const key = item.name.trim().toLowerCase();
            if (seen.has(key) || !baseNames.includes(key)) return invalid();
            seen.add(key);
          }
          if (seen.size !== baseNames.length) return invalid();
          if (
            update.severity !== undefined &&
            update.severity !== update.symptoms[0].severity
          )
            return invalid();
        } else if (
          !finite(update.severity, 0, 10) ||
          !Number.isInteger(update.severity) ||
          baseNames.length !== 1
        )
          return invalid();
        if (update.photos !== undefined && !validPhotos(update.photos)) return invalid();
      }
    }
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
      ...(e.temperature ? { temperature: { celsius: e.temperature.celsius, method: e.temperature.method } } : {}),
      ...(e.bloodPressure ? { bloodPressure: { systolic: e.bloodPressure.systolic, diastolic: e.bloodPressure.diastolic } } : {}),
      ...(e.bloodGlucose ? { bloodGlucose: { value: e.bloodGlucose.value, unit: e.bloodGlucose.unit, context: e.bloodGlucose.context } } : {}),
      ...(e.period ? { period: { flow: e.period.flow } } : {}),
      ...(e.sleep ? { sleep: { bedtime: e.sleep.bedtime, quality: e.sleep.quality } } : {}),
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
      ...(e.monitoring
        ? {
            monitoring: {
              status: e.monitoring.status,
              updates: e.monitoring.updates.map((update: MonitoringUpdate) => ({
                id: update.id,
                occurredAt: update.occurredAt,
                ...(update.symptoms
                  ? {
                      symptoms: update.symptoms.map((item: SymptomRating) => ({
                        name: item.name,
                        severity: item.severity,
                      })),
                    }
                  : {}),
                ...(update.severity !== undefined
                  ? { severity: update.severity }
                  : {}),
                notes: update.notes,
                ...(update.photos
                  ? {
                      photos: update.photos.map((photo: EntryPhoto) => ({
                        id: photo.id,
                        dataUrl: photo.dataUrl,
                        width: photo.width,
                        height: photo.height,
                        caption: photo.caption,
                      })),
                    }
                  : {}),
              })),
            },
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
export function mergeDiaryBackup(current: Diary, backup: Diary): Diary {
  const profileIds = new Set(current.profiles.map(profile => profile.id));
  const entryIds = new Set(current.entries.map(entry => entry.id));
  const symptomKey = ({ profileId, scope, name }: CustomSymptom) =>
    JSON.stringify([profileId, scope, name.trim().toLowerCase()]);
  const customSymptoms = new Map(
    (current.customSymptoms ?? []).map(symptom => [symptomKey(symptom), symptom]),
  );
  for (const symptom of backup.customSymptoms ?? []) {
    const key = symptomKey(symptom);
    if (!customSymptoms.has(key)) customSymptoms.set(key, symptom);
  }

  return {
    ...current,
    profiles: [...current.profiles, ...backup.profiles.filter(profile => !profileIds.has(profile.id))],
    entries: [...current.entries, ...backup.entries.filter(entry => !entryIds.has(entry.id))],
    ...(customSymptoms.size ? { customSymptoms: [...customSymptoms.values()] } : {}),
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
  const latest = (e: Entry) => {
    const times = [Date.parse(e.occurredAt)];
    for (const update of e.monitoring?.updates ?? [])
      times.push(Date.parse(update.occurredAt));
    return Math.max(...times.filter(Number.isFinite), 0);
  };
  return diary.entries
    .filter((e) => e.profileId === id)
    .sort((a, b) => latest(b) - latest(a));
}
