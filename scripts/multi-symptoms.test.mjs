import {test} from "node:test";
import assert from "node:assert/strict";
import {validateDiary} from "../web/src/store.ts";
import {observations} from "../web/src/recap.ts";
import {detailedSurfaceLocation} from "../web/src/surface-detail.ts";
import {digitLandmarks} from "../web/src/digit-landmarks.ts";
import {validSubregion} from "../web/src/subregions.ts";
const entry={id:"e",profileId:"p",symptom:"Pain",severity:4,occurredAt:"2026-11-05T10:00:00Z",duration:"45 minutes",notes:"",location:null};
const diary={version:1,profiles:[{id:"p",name:"Test",age:28,sex:"female"}],entries:[entry]};
test("multiple symptoms preserve individual ratings through backup and charts",()=>{
 const e={...entry,symptoms:[{name:"Pain",severity:4},{name:"Looks swollen",severity:7}]};
 const saved=validateDiary({...diary,entries:[e],customSymptoms:[{profileId:"p",name:"My symptom",scope:"hand:Thumb"}]});
 assert.equal(saved.entries[0].symptoms[1].severity,7);assert.equal(saved.customSymptoms[0].name,"My symptom");
 const rows=observations(saved.entries);assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.score),[4,7]);assert.notEqual(rows[0].key,rows[1].key);
 assert.equal(observations(validateDiary(diary).entries).length,1);
});
test("invalid or inconsistent multi-symptom imports are rejected",()=>{
 for(const symptoms of [[{name:"Pain",severity:11}],[{name:"Other",severity:4}],[{name:"Pain",severity:4},{name:"pain",severity:5}],[]])assert.throws(()=>validateDiary({...diary,entries:[{...entry,symptoms}]}));
 assert.throws(()=>validateDiary({...diary,customSymptoms:[{profileId:"other",name:"X",scope:"body"}]}));
});
test("temperature retains measurement units without entering severity charts",()=>{
 const e={...entry,symptom:"Body temperature",severity:undefined,category:"temperature",temperature:{celsius:38.2,method:"Mouth"}};
 assert.equal(validateDiary({...diary,entries:[e]}).entries[0].temperature.celsius,38.2);assert.equal(observations([e]).length,0);
 assert.throws(()=>validateDiary({...diary,entries:[{...e,temperature:{celsius:200,method:""}}]}));
});
test("both model rigs identify all ten fingers and ten toes, preserving patient side",()=>{
 for(const [sex,rig] of Object.entries(digitLandmarks)) for(const prefix of ["l","r"]) for(const kind of ["finger","toe"])for(let d=1;d<=5;d++) {
  const a=rig[`${prefix}-${kind}-${d}-2`],b=rig[`${prefix}-${kind}-${d}-3`];
  const p=a.map((n,i)=>(n+b[i])/2);const l=detailedSurfaceLocation({position:{x:p[0],y:p[1],z:p[2]},normal:{x:0,y:0,z:1}},`makehuman-${sex}-v1`);
  assert.equal(l.detail,(kind==="finger"?["Thumb","Index finger","Middle finger","Ring finger","Little finger"]:["Big toe","Second toe","Third toe","Fourth toe","Little toe"])[d-1]);assert.ok(l.region.startsWith(prefix==="l"?"Left":"Right"));assert.ok(validSubregion(l));
 }
});
test("surface suggestions recognise nose and keep all returned names valid",()=>{
 for(const [sex,rig] of Object.entries(digitLandmarks)) {
 const eye=rig["l-eye"],jaw=rig.jaw;
 const l=detailedSurfaceLocation({position:{x:0,y:(eye[1]+jaw[1]+.022)/2,z:.09},normal:{x:0,y:0,z:1}},`makehuman-${sex}-v1`);assert.equal(l.detail,"Nose");assert.ok(validSubregion(l));
 }
});

test("temperature edit never fabricates a rated symptom",async()=>{
 const {entrySymptoms}=await import("../web/src/logging.ts");
 assert.deepEqual(entrySymptoms({...entry,symptom:"Body temperature",severity:undefined,temperature:{celsius:38,method:"Mouth"}}),[]);
});
