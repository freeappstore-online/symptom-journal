# SymptomMap visual system

## Reference and scope

This pass uses the five screenshots supplied by the user: HealthConnect's muted teal/mint direction; SymptomMap's profile tiles, diary and history rows; cool-blue recording forms; and the earlier anatomy concept board. These were fragmented references, so the implementation uses one shared system rather than combining their different fonts, blues and navigation styles. Figma MCP remained quota-limited; no claim is made that the latest board was inspected or reproduced pixel for pixel.

## Decisions

- White light-mode canvas, deep teal headings and actions, ice-blue supporting cards and mint selected states. A restrained teal gradient is confined to the diary summary, reflecting HealthConnect without adding decoration to forms.
- Coral is reserved for reported pain marks and primary symptom intensity. General physical symptoms and mood keep neutral teal intensity controls; the colours do not classify a condition or infer urgency.
- Local profile tiles use ice-blue cards with mint/lavender initials. Colours alternate by profile order and are not based on sex, age or health data. Local initials are distinct from the SDK's platform-account avatar.
- 24px page titles, 14px labels/actions, a consistent spacing rhythm, 16px row/tile corners, 20px panels, 12px input corners, and pill-shaped primary/secondary actions. Native inputs remain at least 16px to avoid iPhone focus zoom.
- Standard line icons accompany locations, general feelings and actions. History/diary rows lead with the body part, then the symptom, time and duration; pain ratings are plain coral numbers. History groups real entries by the user's local calendar date.
- The diary summary uses actual counts for today and the past seven calendar days. It does not display invented demonstration totals or medical recommendations.
- All three recording steps use a shared, non-interactive progress strip. The review form is flat and date-first, with a compact location tag, an intensity card, individual feeling cards and a full-width Save action. Cancel remains available at the top of the recording flow.
- The existing adult-female surface illustration now uses cool blue-grey fill and slate outlines. This is a colour update to the schematic artwork, not new anatomically reviewed or realistic 3D imagery.
- Light and dark tokens are paired. Floating SDK surfaces remain opaque. The SDK's sign-in button keeps its component and behavior, with a scoped text-colour correction for contrast against the dark theme's light accent.

## Platform alignment

- Reused SDK Shell, PageHeader, Tabs, SearchInput, ConfirmDialog and theme controls rather than duplicating app navigation. The screenshots' bottom dock and simulated phone/status bars are not additional UI inside the web app. [Shell guidance](https://freeappstore.online/skills.md#shell----the-app-wrapper-every-app-starts-here).
- Repeated visual patterns live in `web/src/ui.tsx`; colour values stay in CSS token blocks with Tailwind utilities. Manrope is retained for consistent application typography; the platform's Manrope/Fraunces font references remain. [Styling guidance](https://freeappstore.online/skills.md#styling-required), [Brand Design](https://freeappstore.online/skills.md#brand-design).
- The inherited CSS opacity test now accepts either single- or double-quoted dark selectors; the formatter changed quote style, not theme behavior.
- No analytics, network-based imagery, new permissions, cloud storage or account requirements were added. Existing profile/entry storage is unchanged.

## Verification

Production build and existing 23 tests pass after the shared-style update. The official checker passed all hard checks with the existing CLAUDE.md guide-pointer warning. Browser checks include profile tiles, diary summary/rows, history date groups, feelings-only recording/review, 320px width without horizontal overflow, and the matching dark palette. Final completion report records the final check results and screenshots.

The current three-step interaction remains Area → Point → General feelings. Area/point can be skipped, and feelings can accompany a located symptom or stand alone.


## 4 November 2026 — Apple Health inspired simplification
Reference: https://www.apple.com/health/ and Van's supplied Sleep Score screenshot. Applied the visual principles to SymptomMap: cool light-grey canvas, white opaque cards, charcoal primary text with teal accents, shade separation instead of outlining every card, larger rounded corners, filled fields, pill actions, circular record icons and zoom controls. Kept the platform Shell/Modal, Manrope font, focus outlines and meaningful text labels. No Apple assets or fonts copied. No invented health score or decorative progress rings.

Removed repeated setup explanation and duplicated location heading. Moved the adult-female model's caveats into the existing collapsed About section; source/licence links and clinical-review limits remain available. Diary summary uses actual today and rolling seven-day counts, without promotional copy. Existing data, anatomy, history calculations and zero analytics are unchanged.

Validation: build and 30 regression tests pass; phone layout reviewed at393px.

## Ocean palette and heading typography — 5 November 2026

User requested a more lively blue/teal palette and distinct heading font. Ocean teal actions, navy headings, ice-blue fields and mint diary summary replace the previous grey-heavy palette. White cards retain shade separation. The secondary profile tone now uses cornflower blue; coral remains reserved for symptom intensity. Corresponding dark tokens use navy surfaces, luminous teal actions and pale blue text. PWA metadata and first-paint backgrounds follow the palette.

Fraunces is now applied to h1/h2/h3, while Manrope remains for body text, controls, numbers and chart labels. Both fonts were already loaded; no new font service or dependency was added. This uses the platform's Brand Design font pair and Styling token conventions: https://freeappstore.online/skills.md#brand-design and https://freeappstore.online/skills.md#styling-required . Headings use a serif fallback when the font is unavailable. Earlier palette notes above describe previous passes and are superseded here.

## Heading font revision — 5 November 2026

User selected the Disease Ontology heading font. Inspected the live heading on https://disease-ontology.org/: computed family Nunito Sans, weight 800. Apply this to h1/h2/h3, retaining Manrope body text and the ocean palette. This explicit user preference supersedes the previous Fraunces heading choice; the existing platform font reference remains available. Nunito Sans uses the existing Google Fonts stylesheet, with system fallbacks.

## Stronger contrast — 5 November 2026

User requested clearer contrast. Deepened navy text and secondary text, made the page a distinct blue-grey behind white cards, strengthened field fills with an inset bottom edge, and made the diary summary a solid deep-teal anchor with white text. Selected controls use saturated teal against pale alternatives; removed placeholder opacity. Dark mode uses a darker canvas and lighter cards/field surfaces. Nunito Sans headings remain. Print tokens keep headings legible on white, including when printing from dark mode. Shared tokens and components apply the change across flows without outlining every card.

## History chart revision — 5 November 2026

User supplied a symptom-history reference. Applied its compact hierarchy: deep-teal selected-symptom header, severity/frequency segments, straight connected points with gentle area shading, 2W/1M/3M/All periods, daily/weekly grouping, concise period statistics and recorded-together counts. The recent multi-symptom time/severity block plot is retained. Frequency counts logs rather than episodes; severity is the mean of recorded scores. Missing severity buckets break lines, not zero values. Weekly groups use local calendar days from the selected window start; the final group may be partial. Associations only count symptoms in the same saved entries, with explicit denominators. No trigger claims, treatment comparisons or inferred improvements. Existing token palette, heading font and SDK Shell remain.

## Interaction clarity review — 5 November 2026

Reviewed profile chooser, diary rows, body selection, marking, feelings, review form, chart controls, photos, detail actions and backups. Changed profiles and entries from floating tiles to grouped rows. Optional marking steps share a footer with Skip first and a single Continue action; feelings shows Skip only when empty, avoiding silent removal of selected feelings. Back is in the entry header, with a submit intent preserving review drafts/photos. Removed duplicate lower Back and Change body part buttons, competing profile-switch controls during editing and repeated step titles. Progress now includes Review. Symptom choices use radios, physical symptoms/mood use checkboxes, and only four symptom suggestions are shown initially. Map defaults to tap-to-mark, with one interaction segment and less-used reset/zoom controls under Adjust view. Photos retain distinct camera/file actions; destructive actions stay labelled and separate. SDK navigation, chart measure/range toggles and source/privacy details are retained because each has a distinct purpose.

Validation of interaction pass: all 45 tests/build pass. At 393px, walked Area skip → Point skip → selected physical feeling → Review → header Back → Review; the unsaved note remained intact and no horizontal overflow was present. The final small cleanup aligns screen-reader step counts with the four visible stages and enables header Back on the skipped-area point-selection screen. No test diary entry was saved in this pass.

## Mobile selection and attachment revision — 5 November 2026

Replaced inline symptom/feeling libraries with one choose action and an A–Z dialog with search. Physical/mood categories can be filtered; multiple selection uses a draft committed by Done, so closing the dialog leaves prior choices intact. Selected feelings are compact expandable rows, preserving separate intensity/notes. Regional primary symptoms use the same dictionary in single-select mode. Photo input is now a recognisable dashed attachment area with image icon, primary Choose photos and secondary camera action; desktop drop and multi-file selection share the local processing/limit checks. No cloud-upload icon is used. Progress follows the supplied connected-circle reference, retaining all four existing steps.

Mobile verification: A–Z category/filter/search, selection confirmation, compact selected rows and connected-circle progress were inspected at 393px. Two local demo images were selected together, processed and then removed from the unsaved draft. Photo empty-state controls remained clear and usable. No entry was saved. Female suit rendered without shader errors with retained contour and bare armholes. Actual phone camera capture and desktop drag/drop were not exercised in this pass. Search Enter is prevented from submitting the surrounding entry form.

## Contextual recording, camera and duration recap — 5 November 2026

Location, specific part, primary symptom, intensity and optional area/point markings now share one contextual view, with focused anatomy and the selected body part visible above its symptom menu. One Continue leads to Review; accompanying symptoms/mood can be added inline there. No forced area → point → feelings screens remain in the main flow. The connected-circle indicator now has two real stages: Record and Review. Existing entries, model versions, geometry and local storage remain compatible.

Camera capture now has a live preview, simple frame guide, capture button, retake/use preview, front/back switching and file fallback. No diagnostic scanning, pulse, blood pressure or treatment claims from the reference are reproduced. Browser getUserMedia permission is required; tracks are stopped on close, capture preview and backgrounding, including requests resolving after closure. Sources: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia and https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop . Actual camera permission/capture is not exercised on the user device without consent.

Multi-symptom recap retains severity on the vertical axis per user confirmation. Pastel outlined bands represent only explicitly recorded durations with supported units; unknown/ongoing durations remain point logs. No duration is inferred for accompanying symptoms. Added Today range for detailed timing.

Contextual flow verification: chose Head → Nose → Blocked nose and advanced straight to Review. The A–Z dialog retained Nose in its title. The review uses one Edit location or symptom action, with accompanying symptoms embedded rather than a separate forced step. Camera lifecycle tests include pending permission results after close, active stream release and rejected permission. No real camera was opened during agent validation.


## Separate logging paths and fine surface selection — 5 November 2026

Home offers Body symptoms, General symptoms, Mental health, and Temperature. Only body entries use Record → Review; quick paths open one editable form. No new general/mood observations are attached to body entries; legacy accompanied entries remain readable/editable without deleting those observations.

Body and quick symptom entries can contain up to 20 independently rated symptoms. The additive `symptoms` array is canonical for charts; legacy `symptom`/`severity` mirror its first item for old backup compatibility. No duplicate primary observation is emitted. Every item shares the entry time, location, duration, notes and photos. Detail and print output list each score. Body-part history filters both charts and printable entries by exact part or parent region.

Typed names offer explicit Save to library / Not now. Personal vocabulary is scoped to the local profile and location/category, validated and included in backups; it is not added to the medical catalogue or sent anywhere. Temperature accepts a real thermometer reading in °C/°F (stored in °C), a measurement site, date, notes and photos. It has a separate units-correct chart and never creates a severity point.

Tap selection now derives candidate names from surface coordinates; digit segments use each model’s own MakeHuman CC0 rig landmarks (`scripts/build-detail-landmarks.py`). All coarse regions have detailed choices. Face/torso/limb rules remain approximate surface heuristics, not clinically validated segmentation; users can correct names. A real browser tap on the nose returned Nose; all finger/toe segment tests pass on both rigs. Manual region/part selection remains accessible. Small features require zoom; no internal organ is inferred.

Drag rotates and tap selects, without mode tabs. Tool/period/measure/category settings use labelled select controls. The female garment uses narrower armhole masks, and render-only quadratic fabric fitting across the nipple footprints retains the surrounding breast envelope. Original geometry and raycast anchors are unchanged. Phone-size frontal render inspected; oblique views and individual model differences need further design review.

Regional suggestions now include editorial, simple descriptions for nose, eyes/eyelids, ears, mouth/teeth/jaw, scalp, fingers, toes/nails, heels/soles, breasts/armpits, joints and muscle surfaces, with shared skin observations. Sources live in `detailed-symptoms.ts`; NHS references include eye pain, earache, finger pain, toe pain, nail problems, breast pain, nosebleeds and smell changes. These are suggestions for recording observations, awaiting clinical review; no diagnostic relationships or WebMD text/database were imported. FreeAppStore Shell, Tailwind tokens and standalone local-storage/zero-analytics guidance remain preserved.


## 5 November — usability review follow-up
- Found canvas touch-none/wheel capture prevented natural page scrolling. Canvas now permits vertical page gestures; wheel no longer zooms the model. Explicit Up/Down pan and Zoom controls remain visible. Sideways drag rotates; native view selector replaces four pills and hidden Adjust view disclosure. Real-device gesture verification remains outstanding.
- Increased renderer pixel-ratio cap from 1.5 to 2 for sharper edges, retaining on-demand rendering. This does not replace or certify the underlying anatomy mesh.
- Four home actions now use local decorative vector illustrations with distinct teal, blue, violet and mint surfaces. Lighter page canvas separates white content surfaces without adding rigid borders. Labels, not illustrations, convey purpose.
- Added neck, throat and abdominal observable symptom suggestions, with NHS references in detailed-symptoms.ts. These are editorial descriptions, not diagnostic rules or a clinically validated catalogue.
- Retained separate quick flows and independent symptom scores, local-only persistence and zero analytics. Platform Styling guidance followed through app-local components, Tailwind utilities and theme tokens.
- Production build and 55 regression tests passed before the final layout-only adjustments. Phone-width home visually inspected; body-map interaction review was interrupted by navigation, so full touch/gesture QA is not claimed.

## 5 November — code and security review
Scope: local diary validation, import/export paths, photo handling, camera lifecycle, analytics logger, recent map flows and dependency audit. This is a targeted code review, not penetration testing or certification.

Fixed: rejected type-coerced enum/profile identifiers in backups; validated surface structure before subregion lookup; restricted dictionary lookups to own properties; capped imported record counts (1,000 profiles / 100,000 entries). Added regression coverage for coerced identifiers/enums and malformed location metadata. Development server now binds 127.0.0.1 by default (restart required for existing server).

Cleanup: removed unreachable refine/feelings wizard branches and redundant mark-stage state. Retained legacy feeling data display and read-only LocationSketch for existing entries/reports. Renamed misleading RecordForm callback to onBack and removed unused callback prop.

Dependencies updated within declared ranges using pnpm update -r --depth 100; SDK 0.16.0 privacy patch retained. npm audit reduced from 40 findings (24 high, 11 moderate, 5 low) to 3 (0 high/critical, 2 moderate, 1 low). Remaining chain: vite-plugin-pwa > workbox-build: glob and minimatch (moderate; fixes require newer major versions outside upstream range), @rollup/plugin-node-resolve > deepmerge (low; audit reports no patched release). No forced incompatible overrides. Revisit when upstream updates. These are build-tool findings, not evidence of diary data exposure.

Verification: production build and all 57 tests passed after updates, including logger privacy, photo import, storage isolation/stale-tab/quota and new malicious-backup cases. No browser end-to-end or penetration test performed for this review. No backend, telemetry, publishing or commits added. Browser localStorage and downloaded backups remain unencrypted; same-origin scripts and people with access to the browser profile can access them. External Google font requests remain (not analytics); zero analytics must not be described as zero network traffic.

## 5 November — searchable libraries and mobile mapping
LibrarySelect reuses the searchable A–Z dictionary for specific body parts, body regions, history filters and chart series. Existing symptom dictionaries retain search. Small setting selectors (view, units, period) stay native.
Daily overview adds symptom rows, counts of logged days, daily mean severity dots and direct latest-log links. Missing logs remain empty; no inferred diagnosis or symptom duration. The existing time/severity plot remains available. Long periods scroll horizontally.
Interactive maps now use 72–76dvh, one-finger rotation and two-finger dolly/pan; touch gestures are captured inside the map. Scroll outside it. On-map controls remain accessible alternatives. A dismissible gesture guide appears on each mapping mount and can be reopened. Read-only maps remain compact.
Verification: production build and 57 tests passed; final selector additions passed TypeScript. Physical mobile touch gesture validation remains outstanding.

## Body history and gesture demonstrations
BodyHistory filters mapped entries by symptom and calendar period. Reuses the existing 3D anatomy, with surface markers coloured by each recorded severity (0–3 teal, 4–6 blue, 7–10 pain colour). Markers can overlap; this is a recorded-location view, not interpolated disease/heat-map data. Entries beneath open originals. Mixed-model histories show the latest model's marks and disclose excluded model marks while keeping all matching entries in the list.
GestureGuide uses local SVG hand drawings and CSS animation for tap, turn, pinch contact points and two-finger movement. motion-safe utilities suppress animation for reduced-motion preferences. No external video or tracking. Production build and 57 tests pass. Live mobile visual/gesture verification remains outstanding.

## Heat-map history and one-finger navigation
History markers replaced by surface heat shading. Gaussian weights blend nearby marks, gated by surface normals to reduce opposite-surface bleed. Density uses nearby recording counts relative to the strongest location cluster; intensity uses nearby weighted average recorded scores /10. Blue-green-yellow-red legend labels the chosen quantity. It is an approximate spatial summary, not anatomical segmentation or diagnostic inference. Rendering bins locations and limits to512 highest-count clusters for CPU bounds; UI discloses this for large histories. No external service or data transmission added.
One-finger touch now pans, two-finger touch rotates/pinches (OrbitControls DOLLY_ROTATE). Tap still selects only when pointer movement is under7px; multi-touch never selects. Persistent on-map '?' opens GestureGuide for history and entry maps. Animated hand illustrations and instruction text updated. Production build and57tests passed; actual-device gesture and GPU visual checks remain outstanding.

## History consolidation
All-body heat map now consumes all current-profile mapped entries, independent of symptom and body-part filter. Density counts each entry once; intensity uses its mean symptom score before spatial blending. Five-series comparison replaces the duplicate recent scatter plot, uses distinct circle/square/triangle/diamond/plus markers and token colours in both lines and same-line legend labels. Shared searchable picker enforces maximum five selections. Missing severity buckets break lines; frequency retains zero counts. Calendar replaces the always-expanded date list; day counts count recorded symptom/feeling observations (temperature readings count once), tapping reveals only that day's entries. Search/body-part filters affect calendar and comparison. Production build and57 regression tests pass; new layouts require device visual review.
