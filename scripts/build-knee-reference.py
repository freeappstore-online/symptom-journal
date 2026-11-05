from pathlib import Path
import zipfile,json,struct
root=Path(__file__).resolve().parents[1]
import sys
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/private/tmp')
from anatomy_glb import glb
z=zipfile.ZipFile(source/'bp3d.zip');parts=[]
ids=[('Femur','FJ3365'),('Patella','FJ3381'),('Tibia','FJ3387'),('Fibula','FJ3366')]
for name,id in ids:
 vs=[];fs=[]
 for line in z.read('partof_BP3D_4.0_obj_99/'+id+'.obj').decode().splitlines():
  a=line.split()
  if not a:continue
  if a[0]=='v':
   x,y,h=map(float,a[1:4]);vs.append([(x+82)/260,(h-250)/260,(-y-85)/260])
  if a[0]=='f':
   face=[int(t.split('/')[0])-1 for t in a[1:]]
   for i in range(1,len(face)-1):
    f=[face[0],face[i],face[i+1]]
    # Crop around the joint, retaining original triangle coordinates; no invented tissue.
    if all(0<=vs[n][1]<=1 for n in f):fs.append(f)
 parts.append((name,vs,fs));print(name,len(fs))
glb(root/'web/public/anatomy/right-knee-bones-v1.glb',parts)
