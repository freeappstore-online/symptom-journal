import {test} from "node:test";
import assert from "node:assert/strict";
import {validateDiary} from "../web/src/store.ts";
import {validPhotos,MAX_PHOTO_CHARS} from "../web/src/photo-policy.ts";
const photo={id:"photo",dataUrl:"data:image/jpeg;base64,"+btoa(String.fromCharCode(255,216,255,0,255,217)),width:320,height:240,caption:"Fictional photo"};
const diary={version:1,profiles:[{id:"p",name:"Demo",age:30,sex:"male"}],entries:[{id:"e",profileId:"p",symptom:"Swelling",severity:4,occurredAt:"2026-11-05T10:00:00Z",duration:"",notes:"",location:null,photos:[photo]}]};
test("photo payloads and captions survive backup validation; unknown properties are removed",()=>{
 const d=structuredClone(diary);d.entries[0].photos[0].extra="drop";
 assert.deepEqual(validateDiary(JSON.parse(JSON.stringify(d))).entries[0].photos,[photo]);
 const old=structuredClone(diary);delete old.entries[0].photos;assert.equal(validateDiary(old).entries[0].photos,undefined);
});
test("photo imports reject remote URLs, active formats, corrupt bytes, excess size and duplicates",()=>{
 for(const bad of [{...photo,dataUrl:"https://example.com/p.jpg"},{...photo,dataUrl:"data:image/svg+xml;base64,PHN2Zz4="},{...photo,dataUrl:"data:image/jpeg;base64,YWJjZA=="},{...photo,width:99999},{...photo,caption:"x".repeat(201)},{...photo,dataUrl:"x".repeat(MAX_PHOTO_CHARS+1)}]) {
  assert.equal(validPhotos([bad]),false);const d=structuredClone(diary);d.entries[0].photos=[bad];assert.throws(()=>validateDiary(d));
 }
 assert.equal(validPhotos([photo,photo]),false);assert.equal(validPhotos([1,2,3,4]),false);
});
