import { t } from "./language";
import { CameraCapture } from "./CameraCapture";
import { useRef, useState } from "react";
import { Modal } from "@freeappstore/sdk/ui";
import { MAX_PHOTOS, type EntryPhoto } from "./photo-policy";
import { preparePhoto } from "./photos";
import { buttonPrimary, inputClass, Icon } from "./ui";
export function PhotoEditor({value,onChange,onBusy}: {value: EntryPhoto[];onChange:(p:EntryPhoto[])=>void;onBusy:(b:boolean)=>void}) {
  const upload = useRef<HTMLInputElement>(null);
  const [cameraOpen,setCameraOpen]=useState(false);
  const [busy,setBusy] = useState(false), [error,setError] = useState("");
  const busyRef = useRef(false);
  const [dragging,setDragging] = useState(false);
  const add = async (files: File[]) => {
    if(!files.length || busyRef.current) return;
    if(value.length+files.length>MAX_PHOTOS) {setError(`You can add ${MAX_PHOTOS-value.length} more photos.`);return;}
    busyRef.current=true;setError("");setBusy(true);onBusy(true);
    try { const prepared:EntryPhoto[]=[];for(const file of files) prepared.push(await preparePhoto(file));onChange([...value,...prepared]); }
    catch(e) {setError(e instanceof Error ? e.message : "Could not add photos.");}
    finally {busyRef.current=false;setBusy(false);onBusy(false);}
  };
  return <section className="space-y-3" aria-label={t("Entry photos")}>
    <div className="flex items-center justify-between gap-3"><h2 className="text-base">{t("Photos")} <span className="font-normal text-muted">{t("(optional)")}</span></h2><span className="text-xs text-muted">{value.length}/{MAX_PHOTOS}</span></div>
    <div className={`flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 text-center ${dragging?"border-accent bg-accent-soft":"border-line-strong bg-panel"}`}
      onDragOver={e=>{e.preventDefault();if(!busy && value.length<MAX_PHOTOS)setDragging(true);}}
      onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragging(false);}}
      onDrop={e=>{e.preventDefault();setDragging(false);void add(Array.from(e.dataTransfer.files));}}>
      <Icon name="photo" className="size-12 text-accent"/>
      <p className="font-bold">{value.length===MAX_PHOTOS?t("All 3 photos added"):value.length?t("Add another photo"):t("Add photos to this entry")}</p>
      <p className="hidden text-xs text-muted sm:block">{t("Drop image files here, or choose photos.")}</p>
      <button type="button" className={buttonPrimary} disabled={busy || value.length>=MAX_PHOTOS} onClick={()=>upload.current?.click()}>{t("Choose photos")}</button>
      <button type="button" className="flex min-h-11 items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4 disabled:opacity-40" disabled={busy || value.length>=MAX_PHOTOS} onClick={()=>setCameraOpen(true)}><Icon name="camera" className="size-4"/>{t("Take a photo")}</button>
    </div>

    {cameraOpen&&<CameraCapture onClose={()=>setCameraOpen(false)} onCapture={file=>{setCameraOpen(false);void add([file]);}} onChooseFile={()=>{setCameraOpen(false);upload.current?.click();}}/>}
    <input ref={upload} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" aria-label={t("Choose an entry photo")} onChange={e=>{void add(Array.from(e.target.files ?? []));e.target.value="";}} />
    <p className="text-xs text-muted">{t("Photos are resized. Keep your originals.")}</p>
    {busy && <p role="status" className="text-sm">{t("Preparing photo…")}</p>}
    {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
    <div className="space-y-4">{value.map((p,i)=><div key={p.id} className="rounded-2xl bg-sky-soft p-3">
      <img src={p.dataUrl} alt={p.caption || t("Patient-provided photo {number}", {number:i+1})} className="mx-auto max-h-64 rounded-xl object-contain"/>
      <label className="mt-3 block text-xs font-semibold">{t("Photo {number} caption (optional)", {number:i+1})}
        <input className={`${inputClass} mt-1`} maxLength={200} value={p.caption} placeholder={t("What does this photo show?")} disabled={busy}
          onChange={e=>onChange(value.map(photo=>photo.id===p.id?{...photo,caption:e.target.value}:photo))}/>
      </label>
      <button type="button" className="mt-2 min-h-11 px-2 text-sm font-semibold text-danger" disabled={busy} onClick={()=>onChange(value.filter(photo=>photo.id!==p.id))}>{t("Remove photo {number}", {number:i+1})}</button>
    </div>)}</div>
  </section>;
}
export function EntryPhotos({photos}: {photos?:EntryPhoto[]}) {
  const [selected,setSelected]=useState<EntryPhoto|null>(null);
  if(!photos?.length) return null;
  return <section className="mt-5 space-y-3" aria-label={t("Patient-provided photos")}>
    <h3 className="text-base">{t("Patient-provided photos")}</h3>
    <div className="grid gap-4 sm:grid-cols-2">{photos.map((p,i)=><figure key={p.id} className="break-inside-avoid">
      <button type="button" className="block w-full rounded-2xl bg-sky-soft p-2 print:hidden" aria-label={t("Enlarge photo {number}", {number:i+1})} onClick={()=>setSelected(p)}>
        <img src={p.dataUrl} alt={p.caption || t("Patient-provided photo {number}", {number:i+1})} className="mx-auto max-h-72 rounded-xl object-contain"/>
      </button>
      <img src={p.dataUrl} alt={p.caption || t("Patient-provided photo {number}", {number:i+1})} className="mx-auto hidden max-h-72 object-contain print:block"/>
      {p.caption && <figcaption className="mt-2 break-words text-sm">{p.caption}</figcaption>}
    </figure>)}</div>
    <Modal open={!!selected} onClose={()=>setSelected(null)} title={t("Entry photo")} maxWidth={800}>
      {selected && <figure><img src={selected.dataUrl} alt={selected.caption || t("Patient-provided photo")} className="mx-auto max-h-[75dvh] object-contain"/>{selected.caption && <figcaption className="mt-3 break-words text-sm">{selected.caption}</figcaption>}</figure>}
    </Modal>
  </section>;
}
