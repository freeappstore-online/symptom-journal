import { t, displayLabel, foldSearch, formatLocale, matchesLabel } from "./language";
import { useId, useMemo, useState } from "react";
import { Modal } from "@freeappstore/sdk/ui";
import { buttonPrimary, inputClass } from "./ui";
import { searchSuggestions } from "./symptom-catalogue";
export type DictionaryOption = { id: string; label: string; category?: string };
export function DictionaryPicker({title,options,selected,multiple=false,maxSelections,onDone,onClose,customSymptoms=false,canSaveCustom=false}: {
  title:string; options:DictionaryOption[]; selected:string[]; multiple?:boolean; maxSelections?:number;
  onDone:(ids:string[],customToSave:string[])=>void; onClose:()=>void;
  customSymptoms?:boolean; canSaveCustom?:boolean;
}) {
  const id=useId();
  const [query,setQuery]=useState(""), [category,setCategory]=useState("All");
  const [draft,setDraft]=useState(selected);
  const [added,setAdded]=useState<string[]>([]);
  const [saveCustom,setSaveCustom]=useState(false);
  const library=useMemo<DictionaryOption[]>(()=>[...options,...added.map(label=>({id:label,label}))],[options,added]);
  const name=query.trim();
  const canAdd=customSymptoms && name.length>0 && !library.some(option=>[option.label,displayLabel(option.label)].some(label=>foldSearch(label)===foldSearch(name)));
  const atLimit=maxSelections!==undefined && draft.length>=maxSelections;
  const selectedCustom=added.filter(label=>draft.includes(label));
  function addSymptom() {
    if(!canAdd || atLimit)return;
    setAdded(current=>[...current,name]);
    setDraft(current=>[...current,name]);
    setQuery("");
  }
  const categories=[...new Set(options.map(o=>o.category).filter((c):c is string=>!!c))];
  const sections=useMemo(()=>{
    const sorted=library.filter(o=>(category === "All" || o.category === category) && (matchesLabel(o.label,query) || searchSuggestions([o.label],query).length))
      .sort((a,b)=>displayLabel(a.label).localeCompare(displayLabel(b.label),formatLocale()));
    const groups = new Map<string, DictionaryOption[]>();
    for(const option of sorted) {
      const letter = foldSearch(displayLabel(option.label)[0]).toUpperCase();
      const items = groups.get(letter);
      if (items) items.push(option);
      else groups.set(letter, [option]);
    }
    return [...groups].map(([letter,items])=>({letter,items}));
  },[library,category,query]);
  return <Modal open onClose={onClose} title={title} maxWidth={560}>
    <div className="flex max-h-[70dvh] flex-col gap-3">
      <input autoFocus type="search" className={inputClass} aria-label={customSymptoms?t("Search or add a symptom"):t("Search")} placeholder={customSymptoms?t("Search or add a symptom"):t("Search")} maxLength={customSymptoms?80:undefined} onKeyDown={e=>{if(e.key==="Enter" && !e.nativeEvent.isComposing){e.preventDefault();addSymptom();}}} value={query} onChange={e=>setQuery(e.target.value)}/>
      {categories.length>1 && <select aria-label={t("Library category")} className={inputClass} value={category} onChange={e=>setCategory(e.target.value)}>{["All",...categories].map(c=><option key={c} value={c}>{displayLabel(c)}</option>)}</select>}
      <div className="flex items-center justify-between text-xs text-muted"><span>{multiple ? t("Select any that apply") : t("Choose one item")}</span><span>A–Z</span></div>
      <div className="min-h-32 overflow-y-auto overscroll-contain" role="group" aria-label={t("Alphabetical library")}>
        {sections.map(section=><section key={section.letter} aria-label={section.letter}>
          <h3 className="sticky top-0 bg-paper px-3 py-2 text-sm">{section.letter}</h3>
          <div className="divide-y divide-line">{section.items.map(option=><label key={option.id} className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 py-3 text-sm ${draft.includes(option.id)?"bg-accent-soft font-semibold":"bg-panel"}`}>
            <span>{displayLabel(option.label)}</span>
            <input type={multiple?"checkbox":"radio"} name={id} className="size-4 shrink-0 accent-accent" disabled={atLimit && !draft.includes(option.id)} checked={draft.includes(option.id)} onChange={()=>{
              if(!multiple) {onDone([option.id],[]);return;}
              setDraft(d=>d.includes(option.id)?d.filter(v=>v!==option.id):[...d,option.id]);
            }}/>
          </label>)}</div>
        </section>)}
        {!sections.length && !canAdd && <p role="status" className="py-8 text-center text-sm text-muted">{t("No matching items.")}</p>}
        {canAdd && <button type="button" className="min-h-11 w-full break-words px-3 py-2 text-left text-sm font-semibold text-accent underline disabled:opacity-50" disabled={atLimit} onClick={addSymptom}>{t("Add “{name}”", {name})}</button>}
      </div>
      {atLimit && <p className="text-xs text-muted">{t("Up to {count} items per selection.", {count:maxSelections!})}</p>}
      {canSaveCustom && !!selectedCustom.length && <label className="flex min-h-11 shrink-0 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-accent" checked={saveCustom} onChange={e=>setSaveCustom(e.target.checked)}/> {t("Save new symptoms to my library")}</label>}
      {multiple && <button type="button" className={`${buttonPrimary} w-full shrink-0`} onClick={()=>onDone(draft,saveCustom?selectedCustom:[])}>{t("Done · {count} selected", {count:draft.length})}</button>}
    </div>
  </Modal>;
}
