import { specificLocationName } from "./subregions";
import { useState } from "react";
import type { Location } from "./store";
import { suggestionsFor, catalogueFor, skinSuggestions } from "./symptom-catalogue";
import { buttonSecondary } from "./ui";
import { DictionaryPicker } from "./DictionaryPicker";
export function SymptomSuggestions({ location,value,onChange }: { location:Location|null;value:string;onChange:(label:string)=>void }) {
  const [open,setOpen]=useState(false);
  const labels=suggestionsFor(location);
  return <div className="space-y-3">
    <button type="button" className={`${buttonSecondary} w-full justify-between`} onClick={()=>setOpen(true)}>
      <span>{value || "Choose a symptom"}</span><span aria-hidden="true">⌕</span>
    </button>
    {open && <DictionaryPicker title={location ? `${specificLocationName(location)} symptoms` : "Choose a symptom"} options={labels.map(label=>({id:label,label}))} selected={labels.includes(value)?[value]:[]} onClose={()=>setOpen(false)} onDone={ids=>{onChange(ids[0]);setOpen(false);}} />}
        <details className="text-xs text-muted">
          <summary className="min-h-11 cursor-pointer">About these suggestions</summary>
          <p className="mb-2">Observations only. This list is incomplete and is awaiting clinical review.</p>
          <ul className="space-y-2 break-words">{[...new Set([...(catalogueFor(location)?.sources ?? []), skinSuggestions.source])].map(url =>
            <li key={url}><a className="underline" href={url} target="_blank" rel="noreferrer">{url.replace("https://www.nhs.uk/", "Reference: ")}</a></li>)}</ul>
          <p className="mt-2">Contains public sector information licensed under the <a className="underline" href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noreferrer">Open Government Licence v3.0</a>.</p>
        </details>
  </div>;
}
