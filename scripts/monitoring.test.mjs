import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canMonitor,
  chartAxisTicks,
  chartTimeUnit,
  checkpointMeanSeverity,
  entryDayKeys,
  entryLatestAt,
  isMonitoringActive,
  latestSymptoms,
  monitoringChangeLog,
  monitoringCheckpointCount,
  monitoringCheckpoints,
  updateSymptoms,
} from "../web/src/monitoring.ts";
import { observations, homeSnapshot } from "../web/src/recap.ts";

const base = {
  id: "e1",
  profileId: "p",
  symptom: "Aching",
  severity: 4,
  symptoms: [
    { name: "Aching", severity: 4 },
    { name: "Stiffness", severity: 2 },
  ],
  occurredAt: "2026-11-04T10:00:00Z",
  duration: "",
  notes: "",
  location: { region: "Left shoulder", view: "front" },
  category: "body",
  monitoring: {
    status: "active",
    updates: [
      {
        id: "u1",
        occurredAt: "2026-11-05T11:00:00Z",
        symptoms: [
          { name: "Aching", severity: 7 },
          { name: "Stiffness", severity: 3 },
        ],
        severity: 7,
        notes: "Worse today",
      },
    ],
  },
};

test("helpers identify active monitoring and latest scores", () => {
  assert.equal(canMonitor(base), true);
  assert.equal(isMonitoringActive(base), true);
  assert.equal(monitoringCheckpointCount(base), 2);
  assert.deepEqual(latestSymptoms(base).map((s) => s.severity), [7, 3]);
  assert.deepEqual(updateSymptoms(base, { severity: 5 }).map((s) => s.severity), [4, 2]);
  assert.deepEqual(
    updateSymptoms(base, base.monitoring.updates[0]).map((s) => s.severity),
    [7, 3],
  );
  assert.ok(entryLatestAt(base) > Date.parse(base.occurredAt));
  const start = new Date(base.occurredAt);
  const update = new Date(base.monitoring.updates[0].occurredAt);
  assert.deepEqual(entryDayKeys(base).sort(), [
    `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`,
    `${update.getFullYear()}-${update.getMonth()}-${update.getDate()}`,
  ].sort());
});

test("observations emit one series point per check-in day", () => {
  const rows = observations([base]).filter((r) => r.key.includes("aching"));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].score, 4);
  assert.equal(rows[1].score, 7);
  assert.equal(rows[1].entryId, "e1");
});

test("home snapshot counts monitoring updates inside the window", () => {
  const now = new Date(2026, 10, 5, 18);
  const snap = homeSnapshot([base], now);
  assert.equal(snap.body, 4);
});

test("checkpoints and change log keep original details and later notes separately", () => {
  const entry = {
    ...base,
    notes: "Started here",
    monitoring: {
      status: "active",
      updates: [
        {
          id: "u1",
          occurredAt: "2026-11-05T11:00:00Z",
          symptoms: [
            { name: "Aching", severity: 7 },
            { name: "Stiffness", severity: 3 },
          ],
          severity: 7,
          notes: "Worse today",
        },
        {
          id: "u2",
          occurredAt: "2026-11-06T11:00:00Z",
          symptoms: [
            { name: "Aching", severity: 5 },
            { name: "Stiffness", severity: 2 },
          ],
          severity: 5,
          notes: "",
        },
      ],
    },
  };
  const checkpoints = monitoringCheckpoints(entry);
  assert.equal(checkpoints.length, 3);
  assert.equal(checkpoints[0].notes, "Started here");
  assert.equal(checkpointMeanSeverity(checkpoints[0]), 3);
  assert.equal(checkpoints[1].notes, "Worse today");
  assert.deepEqual(
    monitoringChangeLog(entry).map((row) => row.notes),
    ["Started here", "Worse today"],
  );
});

test("chart time unit scales from clustered minutes up to multi-week spans", () => {
  const start = Date.parse("2026-11-23T08:00:00");
  assert.equal(
    chartTimeUnit([start, start + 5 * 60_000, start + 20 * 60_000]),
    "minute",
  );
  assert.equal(
    chartTimeUnit([start, start + 2 * 60 * 60_000, start + 8 * 60 * 60_000]),
    "hour",
  );
  assert.equal(
    chartTimeUnit([
      start,
      start + 24 * 60 * 60_000,
      start + 3 * 24 * 60 * 60_000,
    ]),
    "day",
  );
  assert.equal(
    chartTimeUnit([
      start,
      start + 21 * 24 * 60 * 60_000,
      start + 70 * 24 * 60 * 60_000,
    ]),
    "week",
  );
  const ticks = chartAxisTicks(start, start + 90 * 60_000, "minute", 5);
  assert.ok(ticks[0] === start);
  assert.ok(ticks.at(-1) === start + 90 * 60_000);
  assert.ok(ticks.length >= 2 && ticks.length <= 5);
});
