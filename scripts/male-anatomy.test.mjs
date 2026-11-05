import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  bodyRegions,
  getBodyRegions,
  MODEL_ID,
  MALE_MODEL_ID,
  profileIllustration,
  profileModel,
  closestBodyRegion,
  surfaceLocation,
  setSurfaceMark,
} from "../web/src/anatomy.ts";
import { validateDiary } from "../web/src/store.ts";
const profile = { id: "p", name: "Test", age: 30, sex: "male" };
function sample() {
  const r = getBodyRegions(MALE_MODEL_ID).find((r) => r.id === "right-knee");
  const a = { position: r.at, normal: { x: 0, y: 0, z: 1 } };
  const location = setSurfaceMark(
    surfaceLocation(r, a, "front", MALE_MODEL_ID),
    "point",
    a,
  );
  return {
    version: 1,
    profiles: [{ ...profile, bodyIllustration: "male" }],
    entries: [
      {
        id: "e",
        profileId: "p",
        symptom: "Pain",
        severity: 4,
        occurredAt: "2026-11-05T10:00:00Z",
        notes: "",
        duration: "",
        location,
      },
    ],
  };
}
test("adult illustration suggestions can be overridden independently of sex; minors use list", () => {
  assert.equal(profileModel(profile), MALE_MODEL_ID);
  assert.equal(profileModel({ ...profile, sex: "female" }), MODEL_ID);
  assert.equal(
    profileModel({ ...profile, bodyIllustration: "female" }),
    MODEL_ID,
  );
  assert.equal(
    profileModel({ ...profile, sex: "other", bodyIllustration: "male" }),
    MALE_MODEL_ID,
  );
  assert.equal(profileModel({ ...profile, bodyIllustration: "list" }), null);
  assert.equal(
    profileModel({ ...profile, age: 17, bodyIllustration: "male" }),
    null,
  );
  assert.equal(
    profileIllustration({ ...profile, age: 18, bodyIllustration: "male" }),
    "male",
  );
});
test("male markers and profile choices survive backups; changing profile never rewrites saved model", () => {
  const original = sample();
  assert.deepEqual(
    validateDiary(JSON.parse(JSON.stringify(original))),
    original,
  );
  const edited = {
    ...original,
    profiles: [{ ...profile, bodyIllustration: "female" }],
  };
  assert.equal(
    validateDiary(edited).entries[0].location.surface3d.model,
    MALE_MODEL_ID,
  );
  assert.equal(
    validateDiary({ ...original, profiles: [profile] }).profiles[0]
      .bodyIllustration,
    undefined,
  );
  for (const bad of ["unknown", false, {}])
    assert.throws(() =>
      validateDiary({
        ...original,
        profiles: [{ ...profile, bodyIllustration: bad }],
      }),
    );
  const inconsistent = structuredClone(original);
  inconsistent.entries[0].location.illustration = "adult-female";
  assert.throws(() => validateDiary(inconsistent));
});
test("male region centres are independently calibrated with unchanged patient sides and region names", () => {
  const male = getBodyRegions(MALE_MODEL_ID);
  assert.deepEqual(
    male.map((r) => r.name),
    bodyRegions.map((r) => r.name),
  );
  for (const name of ["shoulder", "elbow", "knee", "ankle", "hand"])
    for (const side of ["left", "right"]) {
      const r = male.find((r) => r.id === `${side}-${name}`);
      assert.ok(r);
      assert.equal(closestBodyRegion(r.at, MALE_MODEL_ID).id, r.id);
      assert.equal(Math.sign(r.at.x), side === "left" ? 1 : -1);
      assert.notDeepEqual(r.at, bodyRegions.find((f) => f.id === r.id).at);
    }
});
test("female v1 stays byte-identical while the male asset has its own recorded hash", () => {
  const base = new URL("../web/public/anatomy/", import.meta.url);
  const provenance = JSON.parse(readFileSync(new URL("provenance.json", base)));
  const female = readFileSync(new URL("adult-female-v1.glb", base)),
    male = readFileSync(new URL("adult-male-v1.glb", base));
  assert.equal(
    createHash("sha256").update(female).digest("hex"),
    provenance.output_sha256["adult-female-v1.glb"],
  );
  assert.equal(
    createHash("sha256").update(male).digest("hex"),
    provenance.output_sha256["adult-male-v1.glb"],
  );
  assert.notEqual(Buffer.compare(female, male), 0);
});
