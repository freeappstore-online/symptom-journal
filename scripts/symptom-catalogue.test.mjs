import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestionsFor, regionalSuggestions, searchSuggestions } from "../web/src/symptom-catalogue.ts";

test("suggestions use the recorded region, independent of side and illustration", () => {
  const region = (id) => ({ region: "Ignored", surface3d: { regionId: id } });
  assert.deepEqual(suggestionsFor(region("left-knee")), suggestionsFor(region("right-knee")));
  assert.ok(suggestionsFor(region("left-wrist")).includes("Hard to grip"));
  assert.ok(suggestionsFor({ region: "Right shoulder" }).includes("Hard to move my arm"));
});
test("unmapped and absent locations do not infer a diagnosis or unrelated regional menu", () => {
  assert.deepEqual(suggestionsFor(null), []);
  assert.ok(suggestionsFor({ region: "Chest" }).includes("Pressure in chest"));
  for (const group of Object.values(regionalSuggestions)) assert.match(group.source, /^https:\/\/www\.nhs\.uk\//);
});

import { bodyRegions } from "../web/src/anatomy.ts";
import { regions } from "../web/src/location.ts";
test("every current map region has specific observations and no duplicate labels", () => {
  for (const r of bodyRegions) {
    const labels = suggestionsFor({ region: r.name, surface3d: { regionId: r.id } });
    assert.ok(labels.length >= 7, r.id);
    assert.equal(labels.length, new Set(labels).size);
  }
  for (const r of regions) assert.ok(suggestionsFor({ region: r.name }).length >= 7, r.name);
});
test("patient synonyms search locally without adding diagnoses or unrelated regions", () => {
  const knee = suggestionsFor({ region: "Right knee" });
  assert.deepEqual(searchSuggestions(knee, "swelling"), ["Looks swollen"]);
  assert.ok(searchSuggestions(knee, "  STIFFNESS ").includes("Feels stiff"));
  assert.deepEqual(searchSuggestions(knee, "ear"), []);
  assert.deepEqual(searchSuggestions(knee, "arthritis"), []);
  assert.deepEqual(searchSuggestions(knee, ""), knee);
});

import { searchScore } from "../web/src/language.ts";
import { detailedSurfaceLocation } from "../web/src/surface-detail.ts";
import { MODEL_ID, MALE_MODEL_ID, getBodyRegions } from "../web/src/anatomy.ts";
import { validSubregion } from "../web/src/subregions.ts";

test("wrist search handles natural phrases, Vietnamese without accents, and typos", () => {
  const context = "Left thumb side of wrist · Left wrist";
  const labels = suggestionsFor({region: "Left wrist", detail: "Thumb side of wrist"});
  for (const query of ["stiffness at wrist", "cung co tay", "stifness wrsit"]) {
    const matches = labels.filter(label => searchScore(label, query, context) >= 0);
    assert.ok(matches.includes("Feels stiff"), query);
    assert.ok(searchScore("Feels stiff", query, context) > searchScore("Looks swollen", query, context), query);
  }
  assert.ok(!labels.includes("Finger gets stuck"));
  assert.ok(labels.includes("Hard to bend my wrist"));
  assert.ok(searchScore("Thumb side of wrist", "radial wrsit") > searchScore("Back of wrist", "radial wrsit"));
  assert.ok(searchScore("Looks swollen", "swollen") > searchScore("Looks swollen", "swolen"));
  assert.ok(searchScore("Pain", "ear", context) < 0);
});

test("side taps at the wrist produce a valid label on both models and both hands", () => {
  for (const model of [MODEL_ID, MALE_MODEL_ID]) for (const side of ["left", "right"]) {
    const wrist = getBodyRegions(model).find(region => region.id === side + "-wrist");
    const outside = side === "left" ? 1 : -1;
    for (const [x, detail] of [[outside, "Little-finger side of wrist"], [-outside, "Thumb side of wrist"]]) {
      const location = detailedSurfaceLocation({position: wrist.at, normal: {x,y:0,z:0}}, model);
      assert.equal(location.detail, detail);
      assert.ok(validSubregion(location));
    }
  }
});

test("a palm-facing wrist tap picks the crease and suggests crease-specific observations", () => {
  for (const model of [MODEL_ID, MALE_MODEL_ID]) {
    const wrist = getBodyRegions(model).find(region => region.id === "left-wrist");
    const location = detailedSurfaceLocation({ position: wrist.at, normal: { x: 0, y: 0, z: 1 } }, model);
    assert.equal(location.detail, "Wrist crease");
    assert.ok(validSubregion(location));
    assert.ok(suggestionsFor(location).includes("Wrist feels stiff when bending"));
    assert.ok(!suggestionsFor({ ...location, detail: "Back of wrist" }).includes("Wrist feels stiff when bending"));
  }
});
