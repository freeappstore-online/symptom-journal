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
  assert.deepEqual(searchSuggestions(knee, "  STIFFNESS "), ["Feels stiff"]);
  assert.deepEqual(searchSuggestions(knee, "ear"), []);
  assert.deepEqual(searchSuggestions(knee, "arthritis"), []);
  assert.deepEqual(searchSuggestions(knee, ""), knee);
});
