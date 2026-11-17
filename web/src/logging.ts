import type { Entry, LogCategory, SymptomRating, Location } from "./store";
import { isReadingCategory, readingLabels } from "./store.ts";
import { parentRegion } from "./subregions.ts";
export function entrySymptoms(e: Pick<Entry,"symptom"|"severity"|"symptoms"|"kind"|"category"|"temperature">|undefined):SymptomRating[] {
 if(e?.temperature || isReadingCategory(e?.category))return [];
 return e?.symptoms ?? (e && e.kind!=="general" && e.symptom.trim()? [{name:e.symptom,severity:e.severity??5}]:[]);
}
export function readingValue(e: Entry): string {
  if (e.temperature) return `${e.temperature.celsius.toFixed(1)} °C`;
  if (e.bloodPressure) return `${e.bloodPressure.systolic}/${e.bloodPressure.diastolic} mmHg`;
  if (e.bloodGlucose) return `${e.bloodGlucose.value} ${e.bloodGlucose.unit}`;
  return e.period?.flow ?? "";
}

export function entryTitle(e: Entry): string {
  if (e.temperature) return `Temperature · ${readingValue(e)}`;
  if (isReadingCategory(e.category)) return `${readingLabels[e.category]} · ${readingValue(e)}`;
  return e.symptoms?.map(symptom => symptom.name).join(" · ") ?? e.symptom;
}
export const libraryScope=(l:Location|null,category:LogCategory)=>l?parentRegion(l)+":"+(l.detail??"region"):category;
export const quickOptions = {
 physical:["Feeling feverish","Fatigue","Nausea","Dizziness","Feeling unwell","Brain fog","Sleepiness","Chills","Sweating","Loss of appetite","Vomiting","Feeling faint","Generalised aches","Trouble sleeping","Excessive thirst", "Night sweats", "Waking up tired", "Hard to stay awake", "Lightheaded when standing", "Room feels like it is spinning", "Dry mouth", "Shaky hands", "Muscle weakness", "Poor sleep", "Waking during the night", "Feeling unusually cold", "Feeling unusually hot",
    "Getting tired after small tasks", "Sudden drop in energy", "Hard to fall asleep", "Waking up too early", "Vivid dreams", "Feeling cold and clammy", "Hot flushes", "Sudden sweating", "Feeling off balance", "Vision dims when standing", "Dry heaving", "Getting full quickly", "Increased appetite", "Burping more than usual", "Food tastes different", "Urinating more often", "Waking up to urinate", "Shivering", "Whole-body stiffness", "Swelling in several areas", "Short of breath with activity", "Heart feels like it is racing", "Heart feels like it skips a beat", "Sensitive to sound", "Sensitive to bright light"
  ],
 mental:["Anxious","Low mood","Irritable","Overwhelmed","Restless","Trouble concentrating","Calm","Content","Worried","Lonely","Tearful","Emotionally exhausted", "Frustrated", "On edge", "Feeling down", "Feeling detached", "Motivated", "Hopeful", "Feeling tense", "Trouble enjoying things", "Racing thoughts", "Stressed",
    "Uneasy", "Panicky", "Easily startled", "Hard to relax", "Worrying about what might happen", "Getting stuck on the same thought", "Hard to switch off at night", "Hard to make decisions", "Forgetful", "Mentally drained", "Hard to get started", "Feeling unmotivated", "Feeling numb emotionally", "Feeling disconnected from others", "Wanting to be alone", "Feeling discouraged", "Feeling guilty", "Feeling ashamed", "Feeling hopeless", "Angry", "Impatient", "Mood changes quickly", "Feeling rejected", "Grieving", "Feeling relieved", "Feeling grateful", "Feeling connected", "Feeling supported", "Feeling confident", "Joyful", "Excited", "Feeling focused", "Feeling at peace", "Feeling proud"
  ],
};
