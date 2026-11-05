import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultLocation,
  finishLocation,
  moveMark,
  skipMark,
  marks,
  nearestRegion,
  bodyRegion,
} from "../web/src/location.ts";
import { validateDiary } from "../web/src/store.ts";
test("both optional steps can be skipped while retaining the body part", () => {
  const l = skipMark(
    skipMark(defaultLocation("Left shoulder"), "center"),
    "spot",
  );
  assert.equal(l.mode, "region");
  assert.equal(l.region, "Left shoulder");
  assert.deepEqual(marks(l), { area: false, spot: false });
});
test("area-only, point-only and combined drawings are inferred from marks", () => {
  const start = defaultLocation("Chest");
  const area = moveMark(start, "center", { x: 40, y: 60 });
  assert.equal(skipMark(area, "spot").mode, "area");
  const spot = moveMark(skipMark(start, "center"), "spot", { x: 45, y: 55 });
  assert.equal(spot.mode, "spot");
  assert.equal(moveMark(area, "spot", { x: 45, y: 55 }).mode, "both");
});
test("skipping an existing mark removes only that mark", () => {
  const both = moveMark(
    moveMark(defaultLocation("Chest"), "center", { x: 40, y: 60 }),
    "spot",
    { x: 45, y: 55 },
  );
  const result = skipMark(both, "center");
  assert.equal(result.mode, "spot");
  assert.deepEqual(result.spot, { x: 45, y: 55 });
  assert.deepEqual(marks(result), { area: false, spot: true });
});
test("front and back preserve the patient’s left and right", () => {
  assert.equal(nearestRegion({ x: 67, y: 20 }, "front").name, "Left shoulder");
  assert.equal(nearestRegion({ x: 33, y: 20 }, "back").name, "Left shoulder");
  assert.equal(bodyRegion("Chest", "back"), "Upper back");
});
test("old saved drawings without placement metadata retain their original mode", () => {
  const l = { ...defaultLocation("Chest"), mode: "area" };
  delete l.placement;
  assert.deepEqual(marks(l), { area: true, spot: false });
  assert.equal(finishLocation(l).mode, "area");
});
test("body-part-only records survive validation but contradictory flags are rejected", () => {
  const d = {
    version: 1,
    profiles: [{ id: "p", name: "Test", age: 28, sex: "female" }],
    entries: [
      {
        id: "e",
        profileId: "p",
        symptom: "Pain",
        severity: 5,
        occurredAt: "2026-11-03T08:00:00Z",
        duration: "",
        notes: "",
        location: defaultLocation("Chest"),
      },
    ],
  };
  assert.equal(validateDiary(d).entries[0].location.mode, "region");
  d.entries[0].location.mode = "both";
  assert.throws(() => validateDiary(d));
});
