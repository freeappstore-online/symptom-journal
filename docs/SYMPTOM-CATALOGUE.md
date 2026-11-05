# Symptom suggestions

Version: 2026-11-05. Editorial draft; awaiting clinical review.

The record form offers one optional primary observation selected from chips or written freely. Accompanying physical symptoms and mood remain in General feelings, with their own intensities. Existing records and backup schemas are unchanged. Region changes never silently replace entered text.

The bundled catalogue covers knee, wrist/hand, shoulder, abdomen and head. Left/right and male/female use the same observation choices. Other regions currently offer Pain and unrestricted custom text; this is deliberately incomplete coverage, not evidence that other observations are impossible. Wrist and hand share an initial menu: a reviewed mapping still needs finer hand-specific sources. No ear menu until a suitable ear subregion exists.

Labels describe experience, appearance or function; never inferred causes. Lists are not exhaustive, ranked by probability or a triage tool. These adaptations are not clinically approved by the source publishers. Some observations also appear in urgent-care guidance in the source articles; inclusion must not be interpreted as reassurance. No treatment or triage rules have been extracted.

## Sources and reuse

Each regional group in web/src/symptom-catalogue.ts records its source URL. Sources consulted 5 November 2026:

- https://www.nhs.uk/symptoms/knee-pain/
- https://www.nhs.uk/symptoms/hand-pain/wrist-pain/
- https://www.nhs.uk/symptoms/shoulder-pain/
- https://www.nhs.uk/symptoms/stomach-ache/
- https://www.nhs.uk/symptoms/headaches/

Contains public sector information licensed under the Open Government Licence v3.0.
https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/

These are adapted editorial labels; they must not be presented as NHS-approved content. Review adaptation requirements before publication: https://www.nhs.uk/our-policies/terms-and-conditions/

SYMP (https://obofoundry.org/ontology/symp.html, CC0) is a future concept-ID reference, not an installed dependency. No ontology codes or diagnostic relationships have been assigned or claimed. MedlinePlus is a future additional reference; no content has been imported from it.

## Implementation rationale

Static TypeScript data is shipped with the browser app: no network lookup, backend, analytics or external AI. This follows FreeAppStore's static-hosting model and existing React/Tailwind-on-token conventions: https://freeappstore.online/skills.md . Existing pill buttons and form components are reused. No store or auth changes.

Before expanding: review each region-to-observation mapping and wording with a qualified clinician; review comprehensibility with patients; add reviewed concept IDs only when the observation matches exactly. Preserve patient wording in exports. Keep painful sensations separate from observation categories when a structured sensation field is introduced; do not fabricate that field in historical records.

## Expanded coverage — 5 November 2026

Supersedes the five-region initial coverage above. All 19 current region types now have region-specific observations, alongside four shared skin observations. Left/right remain independent location metadata, not separate symptom concepts. Legacy Arm and Pelvis labels resolve to the same catalogue. Head contains clearly named ear/eye/dental/nose observations while the anatomy remains a broad head region; no finer anatomical mapping is claimed. These can be marked more precisely on the surface but the catalogue does not identify an organ.

Six initial choices plus a searchable expanded list avoid placing long lists in the form. Synonym search supports terms such as tingling, swelling, stiffness, constipation and diarrhoea while retaining simple display labels. One primary observation remains the storage model; additional physical symptoms and mood remain separate. No existing entry or saved wording is changed.

Each group now records all reference URLs in `sources`; source URLs were consulted on 5 November 2026. Shared skin observations have their own reference. Wording is an editorial adaptation, not source-publisher endorsement or clinical validation. All mapped choices describe observable experiences, appearance or function; diagnoses in the source articles are deliberately excluded. The same menus remain available regardless of profile sex/illustration; sex does not justify hiding a patient's report.

WebMD https://symptoms.webmd.com/ was inspected with a fictional adult profile as a coverage/interaction benchmark: broad regions, head zoom, separate skin/general navigation. The live body-map controls did not expose a complete symptom menu reliably during inspection. No proprietary catalogue, underlying API or diagnostic logic was downloaded/imported; no reuse licence was established. Do not represent this catalogue as WebMD-derived or complete relative to it.

Reference additions include NHS arm/elbow, neck, back, chest, pelvis, ankle, top-of-foot, palm, leg cramps, sprains/strains, sciatica, itchy skin, earache, red eye, toothache, sore throat and allergic rhinitis pages. Full URLs are alongside each group in the source file and available in the expanded picker. Condition pages are used only for their observation descriptions; no cause is assigned from a selection. Some signs may require urgent care; this diary has no validated triage rules, and selection must not reassure users. Clinical review remains outstanding.
