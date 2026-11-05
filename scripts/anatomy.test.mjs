import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  bodyRegions,
  surfaceLocation,
  setSurfaceMark,
  surfaceAspect,
  closestBodyRegion,
} from "../web/src/anatomy.ts";
import { validateDiary } from "../web/src/store.ts";
import { skipMark } from "../web/src/location.ts";
const knee = bodyRegions.find((r) => r.id === "left-knee");
const anchor = {
  position: { x: 0.084, y: 0.28, z: 0.03 },
  normal: { x: 0, y: 0, z: 1 },
};
const region = () => surfaceLocation(knee, anchor);
const diary = (l) => ({
  version: 1,
  profiles: [{ id: "p", name: "Test", age: 28, sex: "female" }],
  entries: [
    {
      id: "e",
      profileId: "p",
      symptom: "Pain",
      severity: 4,
      occurredAt: "2026-11-04T10:00:00Z",
      duration: "",
      notes: "",
      location: l,
    },
  ],
});
test("3D coordinates and model identity survive validated backup roundtrip", () => {
  const l = setSurfaceMark(setSurfaceMark(region(), "area", anchor), "point", {
    ...anchor,
    position: { x: 0.08, y: 0.281, z: 0.031 },
  });
  assert.deepEqual(
    validateDiary(JSON.parse(JSON.stringify(diary(l)))).entries[0].location,
    l,
  );
  assert.equal(skipMark(l, "center").mode, "spot");
  assert.equal(skipMark(skipMark(l, "center"), "spot").mode, "region");
});
test("3D imports reject corrupt normals, model versions, geometry and contradictory marks", () => {
  for (const update of [
    { model: "unrecognized" },
    { radius: 2 },
    { focus: { ...anchor, normal: { x: 0, y: 0, z: 0 } } },
    { point: { ...anchor, position: { x: Infinity, y: 0, z: 0 } } },
  ]) {
    const l = region();
    l.surface3d = { ...l.surface3d, ...update };
    assert.throws(() => validateDiary(diary(l)));
  }
  const l = region();
  l.surface3d.point = anchor;
  assert.throws(() => validateDiary(diary(l)));
});
test("patient side stays anatomical regardless of viewing direction", () => {
  assert.equal(closestBodyRegion(anchor.position).id, "left-knee");
  assert.equal(surfaceAspect({ x: 1, y: 0, z: 0 }, knee), "lateral");
  assert.equal(surfaceAspect({ x: -1, y: 0, z: 0 }, knee), "medial");
  const right = bodyRegions.find((r) => r.id === "right-knee");
  assert.equal(surfaceAspect({ x: 1, y: 0, z: 0 }, right), "medial");
  assert.equal(surfaceAspect({ x: 0, y: 0, z: -1 }, right), "back");
});
test("shipped models match recorded provenance and contain valid indexed geometry", () => {
  const base = new URL("../web/public/anatomy/", import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL("provenance.json", base)));
  for (const [name, hash] of Object.entries(manifest.output_sha256)) {
    const data = readFileSync(new URL(name, base));
    assert.equal(createHash("sha256").update(data).digest("hex"), hash);
    assert.equal(data.readUInt32LE(0), 0x46546c67);
    assert.equal(data.readUInt32LE(8), data.length);
    const doc = JSON.parse(
      data.subarray(20, 20 + data.readUInt32LE(12)).toString(),
    );
    assert.ok(doc.meshes.length > 0);
    for (const mesh of doc.meshes) {
      const primitive = mesh.primitives[0];
      assert.ok(doc.accessors[primitive.attributes.POSITION].count > 0);
      assert.equal(doc.accessors[primitive.indices].count % 3, 0);
    }
  }
});
