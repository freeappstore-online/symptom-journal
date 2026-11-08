import { test } from "node:test";
import assert from "node:assert/strict";
import { reportBounds, reportEntries, reportOptions } from "../web/src/report.ts";

const entry = (id, date, symptom, extra) => ({
  id, occurredAt: new Date(date).toISOString(), symptom, severity: 4,
  location: null, ...extra,
});

test("report filters intersect and include the full last calendar day", () => {
  const entries = [
    entry("start", "2026-11-06T00:00:00", "Fatigue"),
    entry("end", "2026-11-07T23:59:59.999", "fatigue"),
    entry("outside", "2026-11-08T00:00:00", "Fatigue"),
    entry("different", "2026-11-07T12:00:00", "Nausea"),
  ];
  const range = reportBounds("custom", "2026-11-06", "2026-11-07");
  assert.deepEqual(reportEntries(entries, "symptom:fatigue", range).map(e => e.id), ["start", "end"]);
  assert.deepEqual(reportEntries(entries, "", range).map(e => e.id), ["start", "end", "different"]);
  assert.equal(reportEntries(entries, "symptom:fatigue", reportBounds("all", "", "")).length, 3);
  assert.equal(reportBounds("custom", "2026-11-07", "2026-11-06"), null);
  assert.equal(reportBounds("custom", "", "2026-11-07"), null);
});

test("report options include legacy observations, temperature and recorded body parts", () => {
  const date = "2026-11-07T12:00:00";
  const entries = [
    entry("body", date, "Aching", { location: { region: "Left knee", detail: "Kneecap" } }),
    entry("legacy", date, "General feelings", { kind: "general", feelings: [{ name: "Anxious", kind: "mood", intensity: 4 }] }),
    entry("temp", date, "Temperature", { temperature: { celsius: 37.1, method: "Mouth" } }),
  ];
  const range = reportBounds("7", "", "", new Date(date));
  assert.equal(reportEntries(entries, "type:body", range)[0].id, "body");
  assert.equal(reportEntries(entries, "part:Left kneecap", range)[0].id, "body");
  assert.equal(reportEntries(entries, "type:mental", range)[0].id, "legacy");
  assert.equal(reportEntries(entries, "symptom:anxious", range)[0].id, "legacy");
  assert.equal(reportEntries(entries, "type:temperature", range)[0].id, "temp");
  assert.ok(reportOptions(entries).some(option => option.id === "symptom:anxious"));
});
