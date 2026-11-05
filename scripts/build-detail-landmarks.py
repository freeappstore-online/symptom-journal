"""Derive static digit/face guides from the shipped MakeHuman CC0 rig landmarks."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
data={}
for sex,name in [("female","makehuman-landmarks.json"),("male","makehuman-male-landmarks.json")]:
    rig=json.loads((root/"web/public/anatomy"/name).read_text())
    data[sex]={k:v for k,v in rig.items() if any(t in k for t in ["finger-","toe-","eye","head","jaw"])}
(root/"web/src/digit-landmarks.ts").write_text("// MakeHuman CC0 rig landmarks, normalized independently for each shipped model.\nexport const digitLandmarks = "+json.dumps(data,separators=(",",":"))+";\n")
