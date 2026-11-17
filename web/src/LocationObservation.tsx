import { Cloud, CloudLightning, Frown, Smile, Sparkles, Waves } from "lucide-react";
import { t, displayLabel } from "./language";
import { useState } from "react";
import type { Location, SymptomRating } from "./store";
import { specificLocationName } from "./subregions";
import { suggestionsFor } from "./symptom-catalogue";
import { DictionaryPicker } from "./DictionaryPicker";
import { buttonSecondary, ScoreControl } from "./ui";
const moodIcons = new Map([
  ["Calm", Waves],
  ["Joyful", Sparkles],
  ["Anxious", CloudLightning],
  ["Low mood", Frown],
  ["Irritable", Cloud],
  ["Overwhelmed", CloudLightning],
]);
export function LocationObservation({location,value,onChange,options,quickPick,mood=false,custom=[],onSaveCustom,title="What do you notice here?"}:{location:Location|null;value:SymptomRating[];onChange:(v:SymptomRating[])=>void;options?:readonly string[];quickPick?:readonly string[];mood?:boolean;custom?:string[];onSaveCustom?:(names:string[])=>void;title?:string}) {
 const [open,setOpen]=useState(false);
 const labels=[...new Set([...(options??suggestionsFor(location)),...custom,...value.map(v=>v.name)])];
 return <section className="space-y-3" aria-label={t("Symptoms")}>
   <h3 className="text-base">{t(title)}</h3>
   {quickPick && <div className={mood ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-2"}>
     {quickPick.map(name => {
       const MoodIcon = mood ? moodIcons.get(name) ?? Smile : null;
       const selected = value.some(symptom => symptom.name === name);
       return <button type="button" key={name} aria-pressed={selected} disabled={!selected && value.length >= 20}
         className={`${mood ? "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl p-2 text-center" : "min-h-11 rounded-full px-3"} border text-sm ${selected ? "border-accent bg-accent-soft font-semibold" : "border-line bg-panel"} disabled:opacity-50`}
         onClick={() => onChange(selected ? value.filter(symptom => symptom.name !== name) : [...value, { name, severity: 5 }])}>
         {MoodIcon && <MoodIcon className="size-5 text-accent" aria-hidden="true" />}
         <span>{selected && <span aria-hidden="true">✓ </span>}{displayLabel(name)}</span>
       </button>;
     })}
   </div>}
   <button type="button" className={`${buttonSecondary} w-full justify-between`} onClick={()=>setOpen(true)}>{t(quickPick ? "Search or add your own" : "Choose symptoms")} <span aria-hidden="true">＋</span></button>
   {open && <DictionaryPicker
     title={location?t("{name} symptoms", {name:displayLabel(specificLocationName(location))}):t("Choose symptoms")}
     searchContext={location ? `${specificLocationName(location)} · ${location.region}` : ""}
     multiple customSymptoms canSaveCustom={!!onSaveCustom} maxSelections={20}
     options={labels.map(label=>({id:label,label}))} selected={value.map(v=>v.name)}
     onClose={()=>setOpen(false)}
     onDone={(ids,toSave)=>{
       onChange(ids.map(name=>value.find(v=>v.name===name)??{name,severity:5}));
       if(toSave.length)onSaveCustom?.(toSave);
       setOpen(false);
     }}
   />}
   <div className="divide-y divide-line">{value.map((v,i)=><div key={v.name} className="py-3">
     <div className="flex items-center justify-between gap-3"><h4 className="font-bold">{displayLabel(v.name)}</h4><button type="button" className="min-h-11 px-2 text-sm text-danger" aria-label={t("Remove {name}", {name:displayLabel(v.name)})} onClick={()=>onChange(value.filter((_,j)=>i!==j))}>{t("Remove")}</button></div>
     <ScoreControl label={t(mood ? "Intensity" : "Severity / intensity")} ariaLabel={t(mood ? "{name} intensity" : "{name} severity", {name:displayLabel(v.name)})} value={v.severity} onChange={severity=>onChange(value.map((old,j)=>i===j?{...old,severity}:old))}/>
   </div>)}</div>
 </section>;
}
