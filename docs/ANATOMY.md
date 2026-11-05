# 3D anatomy prototype — 4 November 2026

## Implemented scope
The approved first stage replaces *new adult-female selections* with a real source-derived 3D surface. Other age/sex profiles retain the familiar body-part list. Old 2D entries retain their original illustration and coordinates, rather than receiving a misleading reinterpretation.

- Three.js + GLTFLoader + OrbitControls, dynamically imported. Drag to rotate, touch pinch to zoom, view shortcuts for front/back/patient left/right, zoom buttons and reset.
- A region confirmation includes a body-part list and front/back/inner/outer options. Region suggestion is nearest-landmark geometry, not clinically verified segmentation. Selecting a region/aspect manually changes the camera focus; actual marks require a body-surface hit.
- Optional area then optional point, followed by general physical symptoms/mood. Area shading is a smooth surface patch within a relative model radius; it is not a measurement in centimetres or freehand drawing. A separate focal point remains fixed in 3D when rotated.
- Expanded viewer uses the platform SDK Modal (focus trapping and Escape close). WebGL/load failures keep the named-region route and allow marking steps to be skipped.
- A right-knee bone reference, from BodyParts3D, can be expanded separately. It shows original femur/patella/tibia/fibula meshes, cropped to the joint; render clipping straightens the open cropped ends. It does not show cartilage/ligaments and is never registered to the female body. The prototype labels it as an adult-male right-knee reference, even when the user selected the left knee.
- `Location.surface3d` retains exact model ID, region ID, aspect, camera focus, area/point positions and normals, and relative area radius. Backup validation rejects unknown models, invalid coordinates/normals/radii, and inconsistent placement state. Legacy v1 backup data remains valid.

## Source / accuracy decisions
Source credits, licence statements, source hashes, output hashes and anatomical mesh IDs ship in `web/public/anatomy/`. MakeHuman core assets (CC0) provide the exterior; BodyParts3D (current archive licence CC BY 4.0) provides the four reference bones. Three.js is MIT. These assets keep their own licences; the app code remains MIT.

FIPAT Terminologia Anatomica 2 (2019, IFAA adoption 2020) is the terminology reference, not a diagnostic benchmark. The app uses plain English for patients. Our region boundaries and plain-English mappings have **not** been reviewed by a clinician/anatomist. The model is generic, not patient-specific; age and sex select an illustration and do not establish a person's anatomy. No clinical-use validation is claimed.

## Platform guidance applied
https://freeappstore.online/skills.md :
- **Platform Rules**: static hosting/no app server. All rendering and marks run in the browser; models are served on the same origin.
- **Privacy Rules**: zero analytics, no remote model viewer or third-party executable scripts; existing SDK logger patch is unchanged.
- **React + Tailwind 4 / Brand Design**: shared cool-teal tokens and utility classes, no new custom navigation.
- **UI Components**: SDK Modal and Spinner, retaining Shell and its navigation.
- **Compliance Checks**: dynamically import the renderer so the initial app bundle stays below 300 KB gzip. Approximate model size: surface 0.48 MB, knee 0.06 MB. Models are included in the service worker precache for offline use after installation/cache completion; no claim that the first-ever offline visit can download them.

## Reproduce assets
Input files are not committed in full. Obtain the official URLs listed in `web/public/anatomy/SOURCES.md`, verify SHA-256 against `provenance.json`, and put them in a source directory:
`mh-base.obj`, `mh-female.target` (caucasian-female-young), `mh-african.target`, `mh-asian.target`, `mh-license.md` (LICENSE.ASSETS.md), `bp3d.zip`, `bp3d-elements.txt`, `bp3d-names.txt`.

Run `python3 scripts/build-anatomy-assets.py /path/to/sources` and `python3 scripts/build-knee-reference.py /path/to/sources`. Both use `scripts/anatomy_glb.py`; no Blender or private asset service is required. Outputs are immutable v1 model assets: changing geometry requires a new model ID and an explicit migration decision.

## Remaining review
Clinical/anatomist review of surface mapping and source fidelity, further foot review, device testing on actual lower-end Android/iOS hardware, and richer joint tissues are outstanding. Browser viewport checks do not establish performance on physical phones. Multi-entry printed reports currently create a viewer per 3D entry; very long reports need a static thumbnail pipeline before claiming reliable large exports.


## Verification results
Production build and all 30 tests pass. `fas check` passes all hard checks, with its pre-existing CLAUDE/SKILLS pointer warning. Initial JavaScript is approximately 94 KB gzip; the Three.js renderer is a separate lazy chunk (approximately 162 KB gzip). Browser checked at 393×852 and 320×568: no horizontal overflow in the picker or saved entry. Expanded hand view visibly retains a thumb and four fingers. Tested area plus point marking, rotated side view, separate knee-bone view, and saving/reloading the explicitly fictional “3D knee mapping demo” entry in Demo Alex. No existing entries were edited or removed. Physical-phone performance and clinical review remain unverified.


## Adult male map and editable illustration — 5 November 2026
The adult-male MakeHuman CC0 surface is now available with the same rotate/zoom, expanded mobile view, region confirmation, optional area and point, and general-feelings flow. Regions use their own male rig-derived centres rather than the female coordinates. The new versioned model is approximately 0.48 MB. The original female v1 geometry and all existing saved coordinates remain unchanged.

Profile setup now stores an optional `bodyIllustration` preference (female, male or body-part list), separate from sex. The initial suggestion follows sex until the user overrides it. Under-18 profiles always use the list, even if an imported preference requests an adult illustration. Existing adult profiles without the field use their previous sex-based suggestion; old saved entries use their own saved model, irrespective of subsequent profile changes. The confirmation screen shows the chosen map.

`Location.surface3d.model` accepts the separately versioned male/female model IDs. Import validation checks illustration/model agreement; profile preferences and model-specific markers survive backup roundtrips. No migration rewrites existing entry geometry. No backend, analytics or extra browser permissions were added. Both models are same-origin static assets included in the existing service-worker precache; the renderer remains lazy-loaded as required by FreeAppStore's bundle guidance.

The asset converter was repaired and generalized: `python3 scripts/build-anatomy-assets.py /path/to/sources male` uses `mh-male-caucasian.target`, `mh-male-african.target`, `mh-male-asian.target` alongside the base mesh and licence. Omit the last argument or use `female` to rebuild the original model. All Python converter scripts pass compilation. Source credits and hashes ship with the app.

Build and all 34 regression tests pass, including male geometry provenance, independently calibrated region centres, illustration overrides, minor fallback, model/presentation mismatch rejection, old profile compatibility and saved-model preservation across profile changes. Clinical/anatomist review and testing on physical phones remain outstanding.


Male-map browser verification: at393×852, checked the full male front and side views, selected Left knee / Outer side directly from the 3D surface, marked area and point, rotated the view, saved a clearly fictional entry in Demo Male, reloaded, and reopened the entry with both marks intact. The saved-entry layout has no horizontal overflow at320×568. Profile UI verified that an explicit female illustration remains selected when sex changes, and that entering age17 removes adult illustration choices. `fas check` passes every hard check with its pre-existing SKILLS pointer warning. Actual-device performance and clinical/anatomist review remain unverified. No pre-existing records were modified or removed; no push or publish.

## Patient orientation — 5 November 2026

The 3D map displays patient-left/right labels at image edges, reversing with front/back rotation. Side views use one patient-side label rather than implying two visible sides; near-pole views are labelled top/below. Labels use camera orientation, not screen coordinates of a stored marker. The shared viewer includes these labels in entry detail, expanded view and printable recaps. Print reports clarify that left/right always refer to the patient. Bone reference is a separate right-knee model and does not use whole-body side labels. Legacy close-ups retain their recorded region and front/back text rather than implying that a cropped body part spans both patient sides.

## Specific surface parts — 5 November 2026

Added patient-confirmed subregions to Head, Neck, Chest, Abdomen, Hand, Wrist, Knee, Foot and Ankle. Head includes nose, individual eyes/eyelids, ears, temples, cheeks, scalp, mouth/lips, teeth/gums, jaw and chin. This is a named-location layer, not newly validated 3D segmentation: tapping still suggests the broad surface region and the user explicitly confirms a specific body part. Existing raycast coordinates/marks stay unchanged. Broad region IDs remain stable; optional validated detail survives backup/import, appears in report labels and separates history series. No detail is invented for old entries. Head suggestions filter by the selected part; other regions retain their regional observations. Terminology uses familiar patient-facing surface names and patient-left/right. Clinical review remains outstanding.

## Modest clothing — 5 November 2026

Added a neutral light-coloured fitted bodysuit with straps/short legs to the female surface and shorts to the male surface, following the user reference. Clothing is an app-authored shader mask on the existing anatomical surface, not downloaded garment assets or a new anatomical model. Original GLB geometry and hashes, saved coordinates, normals and picking targets remain unchanged. Pain overlays render above the garment. Bone reference remains separate and unclothed. This is a schematic fitted covering, not a cloth simulation; garment colour and trim use theme tokens.

### Bodysuit refinement

Replaced hard garment boundaries with screen-space anti-aliased coverage, narrower connected straps that wrap over the shoulders, and lighter neckline trim. The female fabric-covered front chest uses a smooth lighting normal to suppress small underlying skin/nipple relief. Source geometry and picking coordinates stay unchanged; this is a rendering treatment rather than a patient anatomy change.

### Preserve breast contour and clear armholes

Replaced the broad front-chest normal override with a small geometry-aware smoothed-normal patch around each nipple point. Larger breast contours remain shaded by the original normals. Added explicit armhole cutouts to keep textile off the armpits. Geometry, saved anchors and picking remain unchanged.
