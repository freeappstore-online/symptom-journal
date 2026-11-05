# Anatomy source credits — SymptomMap prototype

## Adult female surface
MakeHuman hm08 base mesh and official `caucasian-female-young`, `african-female-young`, `asian-female-young` targets, equally weighted. These are source asset names; the app does not infer ancestry or individual anatomy. Core assets are CC0. Original CC0 copyright holders: Data Collection AB, Joel Palmius, Jonas Hauquier. Licence: MAKEHUMAN-CC0.txt.

Sources: https://github.com/makehumancommunity/makehuman/tree/master/makehuman/data and https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md . Exact source tree and file hashes: provenance.json.

Changes: extract body faces, add the three target displacements at weight 1/3, triangulate quads, remove unused/helper geometry, normalize whole-body height to 1, export untextured GLB. No hand/foot decimation. Model units are relative, not patient measurements. This is a generic adult-female surface illustration, not a scan or clinically validated patient model.

## Right knee bones
BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.
Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html
Licence: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27).
Archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip
Mapping: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_element_parts.txt

Extracted right femur FMA24474/FJ3365, right patella FMA24486/FJ3381, right tibia FMA24477/FJ3387 and right fibula FMA24480/FJ3366. Changes: retain source triangles within superior coordinates 250–510 around the knee, transform source superior axis to Y and anterior direction to +Z, translate and uniformly normalize; export GLB. Bone ends are cropped and open. Source is the already reduced 4.0 archive. No cartilage, ligaments, menisci or diagnostic annotations. This adult-male reference is separate, not registered to the female surface. No claim of clinical validation or suitability for diagnosis.

## Terminology and region mapping
FIPAT. Terminologia Anatomica, 2nd ed., 2019; adopted by IFAA 2020. https://fipat.library.dal.ca/wp-content/uploads/2021/08/FIPAT-TA2-Front-Matter.pdf
Individual terms are public domain per FIPAT; the publication itself is CC BY-ND 4.0. We do not redistribute or modify its publication. Familiar surface names and anterior/posterior/medial/lateral directions are used as a terminology reference. Our nearest-landmark regions and plain-English mappings are original, approximate selection guides, not FIPAT-certified segmentation; clinical/anatomist review is outstanding.

## Viewer
Three.js, MIT, https://github.com/mrdoob/three.js . Licence included as THREE-LICENSE.txt. All model files and viewer code are served from this app's own origin. No external viewer, analytics or model-service API.


## Adult male surface — 5 November 2026
MakeHuman hm08 body mesh with equally weighted official `caucasian-male-young.target`, `african-male-young.target` and `asian-male-young.target` core assets, CC0. Applied using the same source-preserving conversion as the female model, without hand/foot decimation. Output: adult-male-v1.glb; model ID: makehuman-male-v1. Source Git blob identities and SHA-256 hashes are recorded in provenance.json. The female v1 model was rebuilt and verified byte-for-byte against its existing hash before adding the male model.

Male region centres are derived separately from the male rig landmarks (makehuman-male-landmarks.json); generated selection points are in web/src/male-region-points.ts. They are approximate selection guides requiring clinical review, not registered joint anatomy or a diagnostic segmentation. The knee reference stays independent of both surface models.
