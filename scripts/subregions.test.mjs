import {test} from "node:test";
import assert from "node:assert/strict";
import {validSubregion,specificLocationName} from "../web/src/subregions.ts";
import {suggestionsFor} from "../web/src/symptom-catalogue.ts";
import {validateDiary} from "../web/src/store.ts";
import {locationLabel} from "../web/src/anatomy.ts";
import {defaultLocation} from "../web/src/location.ts";
test("specific locations preserve parent and patient side in backups and reports",()=>{
 const location={...defaultLocation("Head","front"),detail:"Nose"};
 const d={version:1,profiles:[{id:"p",name:"Demo",age:30,sex:"male"}],entries:[{id:"e",profileId:"p",symptom:"Pain",severity:4,occurredAt:"2026-11-05T10:00:00Z",duration:"",notes:"",location}]};
 assert.equal(validateDiary(JSON.parse(JSON.stringify(d))).entries[0].location.detail,"Nose");
 assert.equal(locationLabel(location),"Nose · Front");
 assert.equal(specificLocationName({...defaultLocation("Left hand","front"),detail:"Thumb"}),"Left thumb");
 assert.equal(validSubregion({...location,detail:"Thumb"}),false);
 assert.equal(validSubregion({...location,detail:undefined}),true);
});
test("nose and eye menus do not suggest unrelated head symptoms",()=>{
 const nose=suggestionsFor({...defaultLocation("Head","front"),detail:"Nose"});
 assert.ok(nose.includes("Blocked nose"));assert.ok(!nose.includes("Ear pain"));
 const eye=suggestionsFor({...defaultLocation("Head","front"),detail:"Left eye"});
 assert.ok(eye.includes("Gritty eyes"));assert.ok(!eye.includes("Toothache"));
});
