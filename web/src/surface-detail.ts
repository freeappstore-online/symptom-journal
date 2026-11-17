import { digitLandmarks } from "./digit-landmarks.ts";
import { closestBodyRegion, getBodyRegions, MALE_MODEL_ID, MODEL_ID, surfaceLocation, type Anchor, type SurfaceModel, type Vec3 } from "./anatomy.ts";
// Correctable surface heuristics in the model coordinate system, not medical inference.
const distance=(p:Vec3,a:number[],b:number[])=>{
 const v=b.map((n,i)=>n-a[i]),q=[p.x,p.y,p.z];
 const t=Math.max(0,Math.min(1,v.reduce((n,x,i)=>n+x*(q[i]-a[i]),0)/Math.max(1e-9,v.reduce((n,x)=>n+x*x,0))));
 return Math.hypot(...q.map((n,i)=>n-a[i]-t*v[i]));
};
export function detailedSurfaceLocation(anchor:Anchor,model:SurfaceModel=MODEL_ID) {
 const p=anchor.position,n=anchor.normal,side=p.x>=0?"Left":"Right",prefix=p.x>=0?"l":"r";
 const rig:Record<string,number[]>=digitLandmarks[model===MALE_MODEL_ID?"male":"female"];
 let region=closestBodyRegion(p,model),detail:string|undefined;
 const digitCandidates:{id:string;name:string;d:number}[]=[];
 for(const kind of ["finger","toe"]) for(let digit=1;digit<=5;digit++) for(let j=1;j<4;j++) {
   const a=rig[`${prefix}-${kind}-${digit}-${j}`],b=rig[`${prefix}-${kind}-${digit}-${j+1}`];
   if(a&&b) digitCandidates.push({id:kind==="finger"?"hand":"foot",name:(kind==="finger"?["Thumb","Index finger","Middle finger","Ring finger","Little finger"]:["Big toe","Second toe","Third toe","Fourth toe","Little toe"])[digit-1],d:distance(p,a,b)});
 }
 const digit=digitCandidates.sort((a,b)=>a.d-b.d)[0];
 if(digit && digit.d<(digit.id==="hand"?0.009:0.007)) {
   region=getBodyRegions(model).find(r=>r.id===`${side.toLowerCase()}-${digit.id}`)!;detail=digit.name;
 } else {
 const id=region.id.replace(/^(left|right)-/,""),front=n.z>=0,ax=Math.abs(p.x),at=region.at;
 const sideNormal = n.x * (p.x >= 0 ? 1 : -1);
 const sideFacing = Math.abs(sideNormal) > 0.62 && Math.abs(sideNormal) > Math.abs(n.z);
 if(id==="head") {
   const eye=rig[`${prefix}-eye`],jaw=rig.jaw,head=rig.head;
   if(p.z<head[2] && n.z<0) detail=p.y>eye[1]+0.025?"Scalp":"Back of head";
   else if(ax>0.038 && p.y>jaw[1]+0.025 && p.y<eye[1]+0.018) detail=`${side} ear`;
   else if(p.y>eye[1]+0.017) detail="Forehead";
   else if(Math.abs(p.y-eye[1])<0.009 && ax>0.009 && ax<0.032) detail=`${side} eye`;
   else if(ax<0.010 && p.y>jaw[1]+0.022 && p.y<eye[1]+0.004) {
     detail = p.y > eye[1] - 0.006 ? "Bridge of nose"
       : ax > 0.004 && n.y < -0.35 ? `${side} nostril`
       : n.z > 0.65 ? "Tip of nose" : "Nose";
   }
   else if(ax<0.019 && p.y>jaw[1]+0.009 && p.y<=jaw[1]+0.022) detail=p.y>jaw[1]+0.016?"Upper lip":"Lower lip";
   else if(p.y<=jaw[1]+0.009) detail=ax<0.017?"Chin":"Jaw";
   else detail=`${side} cheek`;
 } else if(id==="neck") detail=sideFacing?`${side} side of neck`:front?"Front of neck":"Back of neck";
 else if(id==="chest") detail=p.y>at.y+0.027?`${side} collarbone`:ax<0.018?"Breastbone":ax>0.09?`${side} armpit`:p.y>at.y-0.045?`${side} breast`:`${side} ribs`;
 else if(id==="abdomen") detail=`${p.y>at.y+0.025?"Upper":p.y<at.y-0.025?"Lower":"Around"} ${Math.abs(p.y-at.y)<=0.025?"belly button":ax<0.025?"middle abdomen":side.toLowerCase()+" abdomen"}`;
 else if(id==="upper-back") detail=ax<0.025?"Between shoulder blades":`${side} shoulder blade`;
 else if(id==="lower-back") detail=ax<0.022?"Lower spine":`${side} lower back`;
 else if(id==="pelvis") detail=ax>0.085?`${side} hip`:ax>0.03?`${side} groin`:"Pubic area";
 else if(id==="buttocks") detail=`${side} buttock`;
 else if(id==="shoulder") detail=p.y<at.y-0.018 && ax<Math.abs(at.x)?"Armpit":n.y>0.68?"Top of shoulder":sideFacing?"Outer shoulder":front?"Front of shoulder":"Back of shoulder";
 else if(id==="upper-arm") detail=sideFacing?(sideNormal>0?"Outer upper arm":"Inner upper arm"):front?"Front of upper arm":"Back of upper arm";
 else if(id==="forearm") detail=sideFacing?(sideNormal>0?"Outer forearm":"Inner forearm"):front?"Palm side of forearm":"Back of forearm";
 else if(id==="elbow") detail=sideFacing?(sideNormal>0?"Outer elbow":"Inner elbow"):front?"Elbow crease":"Tip of elbow";
 else if(id==="wrist") detail=sideFacing?(sideNormal>0?"Little-finger side of wrist":"Thumb side of wrist"):front?(Math.abs(p.y-at.y)<0.006?"Wrist crease":"Palm side of wrist"):"Back of wrist";
 else if(id==="hand") detail=front?"Palm":"Back of hand";
 else if(id==="thigh") detail=sideFacing?(sideNormal>0?"Outer thigh":"Inner thigh"):front?"Front of thigh":"Back of thigh";
 else if(id==="knee") detail=sideFacing?(sideNormal>0?"Outer side of knee":"Inner side of knee"):!front?"Back of knee":p.y>at.y+0.014?"Above kneecap":p.y<at.y-0.014?"Below kneecap":"Kneecap";
 else if(id==="lower-leg") detail=sideFacing?(sideNormal>0?"Outer lower leg":"Inner lower leg"):front?(p.y<at.y-0.045?"Lower shin":"Shin"):p.y>at.y+0.025?"Upper calf":p.y<at.y-0.025?"Lower calf":"Calf";
 else if(id==="ankle") detail=sideFacing?(sideNormal>0?(Math.abs(p.y-at.y)<0.014?"Outer ankle bone":"Outer ankle"):(Math.abs(p.y-at.y)<0.014?"Inner ankle bone":"Inner ankle")):front?"Front of ankle":p.y>at.y+0.01?"Achilles tendon area":"Back of ankle";
 else if(id==="foot") detail=p.z<at.z-0.025?"Heel":n.y<0?"Sole":"Top of foot";
 }
 return {...surfaceLocation(region,anchor,undefined,model),...(detail?{detail}:{})};
}
