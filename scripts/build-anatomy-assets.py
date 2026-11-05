"""Convert official MakeHuman CC0 assets. Usage: script SOURCE_DIR [female|male]."""
from pathlib import Path
import json
import sys
from anatomy_glb import glb

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/private/tmp')
sex = sys.argv[2] if len(sys.argv) > 2 else 'female'
if sex not in ('female', 'male'):
    raise SystemExit('Expected female or male')
out = root / 'web/public/anatomy'
out.mkdir(parents=True, exist_ok=True)
vertices, faces, joints = [], [], {}
group = ''
for line in (source / 'mh-base.obj').read_text().splitlines():
    fields = line.split()
    if not fields:
        continue
    if fields[0] == 'v':
        vertices.append(list(map(float, fields[1:4])))
    elif fields[0] == 'g':
        group = fields[1]
    elif fields[0] == 'f':
        ids = [int(token.split('/')[0]) - 1 for token in fields[1:]]
        if group == 'body':
            faces.extend([ids[0], ids[i], ids[i+1]] for i in range(1, len(ids)-1))
        elif group.startswith('joint-'):
            joints.setdefault(group, set()).update(ids)
# Equal weighting of official target assets; no ancestry inference from profiles.
files = ['mh-female.target', 'mh-african.target', 'mh-asian.target'] if sex == 'female' else [f'mh-male-{a}.target' for a in ('caucasian', 'african', 'asian')]
for filename in files:
    for line in (source / filename).read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        fields = line.split()
        index = int(fields[0])
        for axis, delta in enumerate(map(float, fields[1:4])):
            vertices[index][axis] += delta / 3
used = sorted({index for face in faces for index in face})
low = min(vertices[i][1] for i in used)
height = max(vertices[i][1] for i in used) - low
vertices = [[v[0]/height, (v[1]-low)/height, v[2]/height] for v in vertices]
glb(out / f'adult-{sex}-v1.glb', [(f'{sex.title()} surface', vertices, faces)])
landmarks = {key.removeprefix('joint-'): [sum(vertices[n][axis] for n in ids)/len(ids) for axis in range(3)] for key, ids in joints.items()}
filename = 'makehuman-landmarks.json' if sex == 'female' else 'makehuman-male-landmarks.json'
(out / filename).write_text(json.dumps(landmarks, indent=2))
(out / 'MAKEHUMAN-CC0.txt').write_text((source / 'mh-license.md').read_text())
if sex == 'male':
    # Coarse regional centres derived independently from this model's rig.
    # These are selection guides, not validated anatomical segmentation.
    points = {}
    def mix(a, b, t=.5):
        return [a[i]*(1-t) + b[i]*t for i in range(3)]
    def put(name, value):
        points[name] = dict(zip(('x', 'y', 'z'), value))
    put('head', mix(landmarks['head'], landmarks['head-2']))
    put('neck', landmarks['neck'])
    shoulder_y = (landmarks['l-shoulder'][1] + landmarks['r-shoulder'][1])/2
    pelvis_y = landmarks['pelvis'][1]
    for name, y, z in [('chest',shoulder_y-.035,.04), ('upper-back',shoulder_y-.035,-.04), ('abdomen',shoulder_y*.45+pelvis_y*.55,.035), ('lower-back',shoulder_y*.45+pelvis_y*.55,-.035), ('pelvis',pelvis_y,.04), ('buttocks',pelvis_y,-.04)]:
        put(name, [0,y,z])
    for side, prefix in [('left','l'),('right','r')]:
        def joint(name):
            return landmarks[f'{prefix}-{name}']
        values = {'shoulder':joint('shoulder'), 'upper-arm':mix(joint('shoulder'),joint('elbow')), 'elbow':joint('elbow'), 'forearm':mix(joint('elbow'),joint('hand')), 'wrist':joint('hand'), 'hand':mix(joint('hand'),joint('finger-3-1'),.6), 'thigh':mix(joint('upper-leg'),joint('knee'),.4), 'knee':joint('knee'), 'lower-leg':mix(joint('knee'),joint('ankle')), 'ankle':joint('ankle'), 'foot':mix(joint('foot-1'),joint('foot-2'))}
        for name, point in values.items():
            put(f'{side}-{name}', point)
    (root / 'web/src/male-region-points.ts').write_text('// Generated from MakeHuman CC0 male rig landmarks; approximate region centres.\nexport const maleRegionPoints: Record<string, { x: number; y: number; z: number }> = ' + json.dumps(points,indent=2) + ';\n')
print(f'{sex}: {len(used)} vertices, {len(faces)} triangles, {(out / f"adult-{sex}-v1.glb").stat().st_size} bytes')
