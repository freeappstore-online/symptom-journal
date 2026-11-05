import type { Entry, LogCategory, SymptomRating, Location } from "./store";
import { parentRegion } from "./subregions.ts";
export function entrySymptoms(e: Pick<Entry,"symptom"|"severity"|"symptoms"|"kind"|"temperature">|undefined):SymptomRating[] {
 if(e?.temperature)return [];
 return e?.symptoms ?? (e && e.kind!=="general" && e.symptom.trim()? [{name:e.symptom,severity:e.severity??5}]:[]);
}
export const entryTitle=(e:Entry)=>e.temperature?`Temperature · ${e.temperature.celsius.toFixed(1)} °C`:e.symptoms?.map(s=>s.name).join(" · ")??e.symptom;
export const libraryScope=(l:Location|null,category:LogCategory)=>l?parentRegion(l)+":"+(l.detail??"region"):category;
export const quickOptions = {
 physical:["Feeling feverish","Fatigue","Nausea","Dizziness","Feeling unwell","Brain fog","Sleepiness","Chills","Sweating","Loss of appetite","Vomiting","Feeling faint","Generalised aches","Trouble sleeping","Excessive thirst"],
 mental:["Anxious","Low mood","Irritable","Overwhelmed","Restless","Trouble concentrating","Calm","Content","Worried","Lonely","Tearful","Emotionally exhausted"],
 temperature:["Feeling feverish","Chills","Sweating"],
};
