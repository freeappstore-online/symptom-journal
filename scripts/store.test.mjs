import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyDiary,
  loadDiary,
  saveDiary,
  validateDiary,
  profileEntries,
  STORAGE_KEY,
} from "../web/src/store.ts";
const profile = { id: "alice", name: "Alice", age: 28, sex: "female" };
const entry = {
  id: "e1",
  profileId: "alice",
  symptom: "Aching",
  severity: 4,
  occurredAt: "2026-11-03T08:00:00Z",
  duration: "45 minutes",
  notes: "After work",
  location: {
    region: "Left shoulder",
    illustration: "adult-female",
    view: "front",
    mode: "both",
    center: { x: 50, y: 40 },
    spot: { x: 60, y: 50 },
    width: 25,
    height: 30,
  },
};
const diary = () =>
  structuredClone({
    version: 1,
    profiles: [profile, { ...profile, id: "bob", name: "Bob" }],
    entries: [entry, { ...entry, id: "e2", profileId: "bob" }],
  });
function memory() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
}
test("profiles and complete location geometry survive reload", () => {
  const s = memory();
  assert.deepEqual(loadDiary(s).diary, emptyDiary());
  saveDiary(s, diary(), null);
  assert.deepEqual(loadDiary(s).diary, diary());
});
test("histories remain isolated by immutable profile ID", () => {
  assert.deepEqual(profileEntries(diary(), "alice"), [entry]);
  const edited = diary();
  edited.profiles[0].name = "Renamed";
  assert.deepEqual(profileEntries(edited, "alice"), [entry]);
});
test("corrupt or unsupported data is rejected without erasing it", () => {
  const s = memory();
  s.setItem(STORAGE_KEY, "broken");
  assert.throws(() => loadDiary(s));
  assert.equal(s.getItem(STORAGE_KEY), "broken");
  assert.throws(() => validateDiary({ ...diary(), version: 2 }));
});
test("quota errors propagate rather than claiming a successful save", () => {
  const s = {
    getItem: () => null,
    setItem: () => {
      throw Error("QuotaExceededError");
    },
  };
  assert.throws(() => saveDiary(s, diary(), null), /Quota/);
});
test("stale tabs cannot overwrite a diary", () => {
  const s = memory();
  const raw = saveDiary(s, diary(), null);
  assert.throws(() => saveDiary(s, emptyDiary(), null), /another tab/);
  assert.equal(s.getItem(STORAGE_KEY), raw);
});
test("imports reject duplicate IDs, orphan entries, invalid ratings and malformed maps", () => {
  for (const mutate of [
    (d) => d.profiles.push({ ...profile }),
    (d) => (d.entries[0].profileId = "missing"),
    (d) => (d.entries[0].severity = 11),
    (d) => (d.entries[0].location.spot.x = 101),
    (d) => (d.entries[0].location.mode = "unknown"),
  ]) {
    const d = diary();
    mutate(d);
    assert.throws(() => validateDiary(d));
  }
});
test("zero severity and symptoms without a location are valid", () => {
  const d = diary();
  d.entries[0] = { ...d.entries[0], severity: 0, location: null };
  assert.equal(validateDiary(d).entries[0].severity, 0);
});
test("backups drop unexpected imported fields", () => {
  const d = diary();
  d.profiles[0].unexpected = "ignored";
  assert.equal(validateDiary(d).profiles[0].unexpected, undefined);
});

test("changing profile demographics preserves the recorded illustration", () => {
  const d = diary();
  d.profiles[0].sex = "male";
  d.profiles[0].age = 40;
  assert.equal(
    validateDiary(d).entries[0].location.illustration,
    "adult-female",
  );
});

test('backup rejects coerced profile identifiers and enums', () => {
  for (const mutate of [
    d => { d.entries[0].profileId = ['alice']; },
    d => { d.profiles[0].sex = ['female']; },
    d => { d.entries[0].kind = ['symptom']; },
    d => { d.entries[0].location.view = ['front']; },
  ]) { const d = diary(); mutate(d); assert.throws(() => validateDiary(d), /supported SymptomMap backup/); }
});
test('malformed location metadata fails with the supported backup error', () => {
  for (const surface3d of [null, {regionId:123}, {regionId:'constructor'}]) {
    const d=diary(); d.entries[0].location.detail='Nose'; d.entries[0].location.surface3d=surface3d;
    assert.throws(()=>validateDiary(d), /supported SymptomMap backup/);
  }
  const d=diary(); d.entries[0].location.region='constructor'; d.entries[0].location.detail='Nose';
  assert.throws(()=>validateDiary(d), /supported SymptomMap backup/);
});
