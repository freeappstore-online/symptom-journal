# First working product flow — 3 November 2026

## Implemented

- Choose/create local profiles, edit age/sex, confirm saved details before opening a diary.
- Adult female original SVG surface guide, front/back, familiar body-part labels, tap targets and native-select alternative. Other profiles use the list until suitable art is available.
- Enlarged region, Spot/Area/Area + spot, pointer placement and keyboard-accessible coordinate/extent sliders. A confirmation action precedes symptom details. Shading is extent and the coral marker is a reported focal spot; neither implies a diagnosis or acute-pain classification.
- No-location symptoms, custom symptom text/suggestions, 0–10 severity, local date/time, optional duration and notes.
- Persist entries and per-profile history, view/edit/delete entries, text search. Failed storage writes show an error and do not update the apparent saved state. Profile changes preserve entry ownership and recorded illustration choice.
- JSON backup of all profiles, validated restore with explicit replacement confirmation. Backups are plaintext sensitive files; the interface says to store them privately.
- Printable per-profile report with every entry and location drawing; the browser provides Save as PDF. No automatic email, sharing or direct PDF download.

## Decisions and guidance

- Used required SDK Shell, PageHeader, Tabs, SearchInput, EmptyState and ConfirmDialog; no replacement navigation or modal system. [SDK UI guidance](https://freeappstore.online/skills.md#app-ui-components-freeappstoresdkui--freeappstoresdkhooks).
- Preserved teal token-based light/dark styling and concise labels. A Tailwind wrapper lets the existing SDK header wrap at 320px; no custom header. [Styling guidance](https://freeappstore.online/skills.md#styling-required).
- Namespaced version-1 localStorage keeps the standalone app backend-free. Imports validate profile/entry IDs, ratings, dates and map geometry. Corrupt data is not automatically erased. A compare-before-save guard rejects stale-tab writes instead of silently replacing another tab's diary. [Privacy Rules](https://freeappstore.online/skills.md#privacy-rules).
- Kept the zero-telemetry SDK patch and regression tests. No profiles, notes or symptom values go into logs, route URLs or platform collections. SDK platform account features remain distinct from local profiles.
- Chose a custom, original SVG for this first implementation rather than shipping an unreviewed muscle-focused library as authoritative anatomy. Adult female first follows the accepted scope; other ages do not get a scaled adult image. The drawing and region boundaries still require review.

## Validation

TypeScript and production build pass. Thirteen tests cover privacy, SDK styling, reload persistence, profile isolation, invalid/corrupt imports, quota failures, stale-tab writes, no-location/zero-severity entries and preservation of the saved illustration across demographic edits.

Browser-verified with fictional Demo Alex/Demo Sam profiles: profile creation/confirmation, adult female shoulder selection, location refinement and keyboard adjustment, saving an entry, reload persistence, separate empty history for another profile, and no-location recording. Initial 320px overflow from SDK header was fixed and page width verified as 320px. Further checks and screenshots are recorded in the completion report.

## Current limits

- Region markers and crops are approximate; no organs, muscle groups or medically validated segmentation. Shape extent may cross a body edge. Profile sex is used only to select artwork.
- Charts and additional age/sex illustrations are next. Report currently includes all entries for the active profile; no date selection.
- Print preview depends on the browser; actual print-to-PDF output and install/offline behavior have not yet been visually verified.
- Local profiles have no password/encryption boundary. Storage is not guaranteed against clearing/eviction/device loss. Versioned JSON backups are the recovery path.
- Draft entry text is preserved while refining its location, but leaving the recording flow or reloading discards an unsaved draft. Deliberate navigation has no unsaved-change confirmation yet.
- No push, deployment, app provisioning or production health-data use was performed.


## Pain-location usability update

- Replaced 19 small, overlapping hotspot targets with direct body tapping and a plain-English selection confirmation. Patient left/right is explicit and reverses correctly on the back view. The body-part list remains an alternative.
- Default to One spot, rather than prepopulating both an area and a spot. A new map starts blank; confirmation stays disabled until the user actually marks it. No specific location remains an early, visible choice.
- Wider area adds a single Smaller/Larger size control. Area + spot prompts area first, then the focal spot, with independent Move area/Move spot controls after placement.
- Added Undo and Clear, keyboard arrow positioning, SVG coordinate conversion that respects responsive letterboxing, and collapsed fine-tuning controls. A captured pointer gesture continues editing the same mark even if the next-step prompt changes during that drag.
- Placement metadata is optional for compatibility with existing saved drawings. New incomplete drawings cannot be persisted or imported as completed records. Existing entries are not automatically repositioned.
- Eighteen tests pass, including deliberate placement, both-mark completion, patient orientation, old-record compatibility, and rejecting incomplete drawings. Browser verified body tapping → body-name confirmation → spot placement; Undo; the two-stage combined flow; and the enabled/disabled confirmation states.
- This improves the interaction, not the clinical accuracy of the artwork. Surface regions and nearest-region selection remain approximate; the user confirms the body-part name before continuing.


## User revision: two optional marking steps

This supersedes the three-mode selector and mandatory-mark behavior described in the previous usability update.

1. Wider pain area (optional): mark and size it, then Next: pain point; or Skip area.
2. Most painful point (optional): mark it and Use this location; or Skip point. Back to area supports revising the first step.

The saved representation is inferred from actual marks: area only, point only, both, or body part only when both are skipped. Skipping removes that specific mark while preserving the other. Body-part-only is distinct from no location: the selected body region and front/back view remain in the history/report. Existing saved drawings remain compatible.

Step changes move keyboard focus and scroll the new instruction into view. Each step retains Undo, a step-specific Clear action, and optional fine-tuning. The old save-success message is cleared on entry editing so it cannot imply a draft was already saved.

Validation: TypeScript, production build and 19 tests passed. Browser verified Skip area advances to the optional point step, Skip point reaches symptom entry, and saving after both skips retains the body part with no shaded area or point. No analytics, sync or publishing added.


## General feelings integrated as step 3

- User clarified that general feelings include both physical symptoms and mood, can accompany located pain, and should be part of the same flow.
- Flow is Wider pain area (step 1) → Most painful point (step 2) → General feelings (step 3) → Review/save. Area and point can be skipped before choosing a body part; skipping both leads to feelings without inventing a location. The old separate No specific location action has been replaced with step-specific Skip area/Skip point actions.
- Feelings support multiple physical/mood selections, custom names, independent 0–10 intensity and optional individual notes. Located pain keeps its own severity. A feelings-only entry has no pain severity field; it is not silently represented as zero pain. History/search, details, backups and printable reports preserve accompanying feelings.
- General feelings are embedded in the same entry as the located symptom, rather than creating extra dated diary events. This preserves the user's association without claiming any symptom or mood caused the pain.
- Back navigation preserves selected feelings and the review draft. General feelings may be skipped when a located symptom is present. With no location, at least one feeling is required to avoid saving an empty entry.
- Validation covers physical/mood data round trips, independent pain/feeling ratings, invalid/duplicate feeling imports, and compatibility with intermediate development records that had a placeholder score. Existing diary entries without feelings remain readable.
- Browser verified both location skips → physical + mood selection → independent 7/10 and 3/10 intensity → save with no pain rating. Full check results are in the completion report. No diagnosis, analytics, cloud sync or publication added.


## Consistent visual design

Applied the user-supplied prototype references through shared controls, paired light/dark tokens, mint/lavender profile tiles, a teal diary summary, icon-led entry rows, date-grouped history and a simplified review form. See [DESIGN.md](DESIGN.md) for the design decisions, platform guidance and validation scope.


## History recap — 4 November 2026

History now has a single symptom/mood selector across all recorded dates and a recent 3/7/14 calendar-day chart. Each block is one observation, with time on X and its independent score on Y. Numbered legends toggle series, chart marks reveal details and link to the original entry, and a recent-log list provides an alternative to chart interaction. Located symptoms are grouped by symptom, body part and front/back; physical feelings and mood remain distinct series. Missing logs are never converted to zero; block width does not represent duration. All calculations use the active profile's local data, with no new dependencies, network requests or telemetry. Existing Shell, palette tokens and Tailwind utilities are preserved per platform guidance.

Validation: production build and 26 tests passed, including recap grouping, zero scores, feelings-only records and local calendar boundaries. Browser verified populated history and switching the symptom selector.
