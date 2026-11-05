import { useId, useMemo, useState } from "react";
import { Modal } from "@freeappstore/sdk/ui";
import { buttonPrimary, inputClass } from "./ui";
import { searchSuggestions } from "./symptom-catalogue";
export type DictionaryOption = { id: string; label: string; category?: string };
export function DictionaryPicker({title,options,selected,multiple=false,maxSelections,onDone,onClose}: {
  title:string; options:DictionaryOption[]; selected:string[]; multiple?:boolean; maxSelections?:number;
  onDone:(ids:string[])=>void; onClose:()=>void;
}) {
  const id=useId();
  const [query,setQuery]=useState(""), [category,setCategory]=useState("All");
  const [draft,setDraft]=useState(selected);
  const categories=[...new Set(options.map(o=>o.category).filter((c):c is string=>!!c))];
  const sections=useMemo(()=>{
    const sorted=options.filter(o=>(category === "All" || o.category === category) && searchSuggestions([o.label],query).length)
      .sort((a,b)=>a.label.localeCompare(b.label));
    const groups: {letter:string;items:DictionaryOption[]}[]=[];
    for(const option of sorted) {
      const letter=option.label[0].toUpperCase();
      if(groups.at(-1)?.letter===letter) groups.at(-1)!.items.push(option);
      else groups.push({letter,items:[option]});
    }
    return groups;
  },[options,category,query]);
  return <Modal open onClose={onClose} title={title} maxWidth={560}>
    <div className="flex max-h-[70dvh] flex-col gap-3">
      <input autoFocus type="search" className={inputClass} aria-label={`Search ${title.toLowerCase()}`} placeholder="Search" onKeyDown={e=>{if(e.key==="Enter")e.preventDefault();}} value={query} onChange={e=>setQuery(e.target.value)}/>
      {categories.length>1 && <select aria-label="Library category" className={inputClass} value={category} onChange={e=>setCategory(e.target.value)}>{["All",...categories].map(c=><option key={c}>{c}</option>)}</select>}
      <div className="flex items-center justify-between text-xs text-muted"><span>{multiple ? "Select any that apply" : "Choose one item"}</span><span>A–Z</span></div>
      <div className="min-h-32 overflow-y-auto overscroll-contain" role="group" aria-label="Alphabetical library">
        {sections.map(section=><section key={section.letter} aria-label={section.letter}>
          <h3 className="sticky top-0 bg-paper px-3 py-2 text-sm">{section.letter}</h3>
          <div className="divide-y divide-line">{section.items.map(option=><label key={option.id} className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 py-3 text-sm ${draft.includes(option.id)?"bg-accent-soft font-semibold":"bg-panel"}`}>
            <span>{option.label}</span>
            <input type={multiple?"checkbox":"radio"} name={id} className="size-4 shrink-0 accent-accent" disabled={!!maxSelections && draft.length>=maxSelections && !draft.includes(option.id)} checked={draft.includes(option.id)} onChange={()=>{
              if(!multiple) {onDone([option.id]);return;}
              setDraft(d=>d.includes(option.id)?d.filter(v=>v!==option.id):[...d,option.id]);
            }}/>
          </label>)}</div>
        </section>)}
        {!sections.length && <p role="status" className="py-8 text-center text-sm text-muted">No matching items.</p>}
      </div>
      {multiple && <button type="button" className={`${buttonPrimary} w-full shrink-0`} onClick={()=>onDone(draft)}>Done · {draft.length} selected</button>}
    </div>
  </Modal>;
}
