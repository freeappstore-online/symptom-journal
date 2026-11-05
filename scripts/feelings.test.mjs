import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDiary, saveDiary, validateDiary } from "../web/src/store.ts";
const feelings = [
  {
    name: "Fatigue",
    kind: "physical",
    intensity: 7,
    notes: "Fictional physical symptom",
  },
  { name: "Anxious", kind: "mood", intensity: 3, notes: "Fictional mood" },
];
const diary = () => ({
  version: 1,
  profiles: [{ id: "p", name: "Test", age: 28, sex: "female" }],
  entries: [
    {
      id: "e",
      profileId: "p",
      kind: "general",
      symptom: "General feelings",
      location: null,
      feelings: structuredClone(feelings),
      occurredAt: "2026-11-03T10:00:00Z",
      duration: "",
      notes: "",
    },
  ],
});
test("physical symptoms and mood retain independent ratings and notes after reload", () => {
  let raw = null;
  const storage = {
    getItem: () => raw,
    setItem: (_k, v) => {
      raw = v;
    },
  };
  saveDiary(storage, diary(), null);
  const entry = loadDiary(storage).diary.entries[0];
  assert.deepEqual(entry.feelings, feelings);
  assert.equal("severity" in entry, false);
  assert.equal(entry.location, null);
});
test("feelings can accompany located pain without replacing its severity", () => {
  const d = diary();
  Object.assign(d.entries[0], {
    kind: "symptom",
    symptom: "Aching",
    severity: 6,
    location: {
      region: "Left shoulder",
      view: "front",
      mode: "region",
      center: { x: 50, y: 50 },
      spot: { x: 50, y: 50 },
      width: 36,
      height: 28,
    },
  });
  const e = validateDiary(d).entries[0];
  assert.equal(e.severity, 6);
  assert.deepEqual(
    e.feelings.map((f) => f.intensity),
    [7, 3],
  );
  assert.equal(e.location.region, "Left shoulder");
});
test("import rejects invalid intensity, duplicate feelings and empty general-only records", () => {
  for (const mutate of [
    (d) => (d.entries[0].feelings[0].intensity = 11),
    (d) => d.entries[0].feelings.push({ ...d.entries[0].feelings[0] }),
    (d) => (d.entries[0].feelings = []),
    (d) => (d.entries[0].feelings[1].kind = "unknown"),
  ]) {
    const d = diary();
    mutate(d);
    assert.throws(() => validateDiary(d));
  }
});

test("intermediate general-only records drop their legacy placeholder score", () => {
  const d = diary();
  d.entries[0].severity = 0;
  assert.equal("severity" in validateDiary(d).entries[0], false);
});
