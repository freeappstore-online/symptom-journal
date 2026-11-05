import { useEffect, useRef, useState } from "react";
import { Modal } from "@freeappstore/sdk/ui";
import { stopCameraStream, connectCamera } from "./camera";
import { buttonPrimary, buttonSecondary, Icon } from "./ui";
export function CameraCapture({onClose,onCapture,onChooseFile}:{onClose:()=>void;onCapture:(f:File)=>void;onChooseFile:()=>void}) {
  const video=useRef<HTMLVideoElement>(null);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const [facing,setFacing]=useState<"environment"|"user">("environment");
  const [shot,setShot]=useState<{file:File;url:string}|null>(null);
  const [error,setError]=useState("");const [ready,setReady]=useState(false);const [attempt,setAttempt]=useState(0);
  const [capturing,setCapturing]=useState(false);
  useEffect(()=>{
    if(shot) return;
    let cancelled=false, stream:MediaStream|null=null;
    setReady(false);setError("");
    if(!navigator.mediaDevices?.getUserMedia) {setError("Camera access is unavailable here. Choose a photo instead.");return;}
    const pause=()=>{if(document.hidden) {stopCameraStream(stream);setReady(false);setError("Camera paused. Tap Retry to restart.");}};
    document.addEventListener("visibilitychange",pause);
    const disconnect=connectCamera(
      ()=>navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1600},height:{ideal:1200}}}),
      media=>{
        stream=media;
        if(document.hidden){stopCameraStream(media);setError("Camera paused. Tap Retry to restart.");return;}
        if(video.current) {video.current.srcObject=media;void video.current.play().catch(()=>{
          stopCameraStream(media);if(!cancelled)setError("Camera preview could not start. Retry or choose a photo.");
        });}
      },
      error=>{const name=error instanceof DOMException?error.name:"";setError(name==="NotAllowedError"?"Camera permission was not granted. You can choose a photo instead.":"No camera could be opened. Retry or choose a photo.");},
    );
    return ()=>{cancelled=true;document.removeEventListener("visibilitychange",pause);disconnect();};
  },[facing,attempt,shot]);
  useEffect(()=>()=>{if(shot)URL.revokeObjectURL(shot.url);},[shot]);
  const capture=async()=>{
    if(!video.current?.videoWidth || capturing)return;
    setCapturing(true);
    try {
      const canvas=document.createElement("canvas");const scale=Math.min(1,1600/Math.max(video.current.videoWidth,video.current.videoHeight));
      canvas.width=Math.round(video.current.videoWidth*scale);canvas.height=Math.round(video.current.videoHeight*scale);
      const context=canvas.getContext("2d");if(!context)throw Error();context.drawImage(video.current,0,0,canvas.width,canvas.height);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),"image/jpeg",0.95));
      if(!mounted.current)return;
      const file=new File([blob],"entry-photo.jpg",{type:"image/jpeg"});setShot({file,url:URL.createObjectURL(file)});
    }catch{setError("The photo could not be captured. Please try again.");}finally{setCapturing(false);}
  };
  return <Modal open onClose={onClose} title={shot?"Review photo":"Take a photo"} maxWidth={560}>
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-camera text-camera-ink">
        {shot?<img src={shot.url} alt="Captured photo preview" className="max-h-[55dvh] w-full object-contain"/>:<>
          <video ref={video} autoPlay playsInline muted aria-label="Live camera preview" className="max-h-[55dvh] min-h-60 w-full object-contain" onCanPlay={()=>setReady(true)}/>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-[15%] h-[70%] w-[70%]" viewBox="0 0 100 100" fill="none"><path d="M0 24V5Q0 0 5 0H24M76 0H95Q100 0 100 5V24M100 76V95Q100 100 95 100H76M24 100H5Q0 100 0 95V76" stroke="currentColor" strokeWidth="1.5"/></svg>
          {!ready&&!error&&<p role="status" className="absolute inset-0 flex items-center justify-center bg-camera p-4 text-center text-sm">Waiting for camera permission…</p>}
        </>}
      </div>
      {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
      {shot?<div className="flex justify-between gap-3"><button type="button" className={buttonSecondary} onClick={()=>setShot(null)}>Retake</button><button type="button" className={buttonPrimary} onClick={()=>onCapture(shot.file)}>Use photo</button></div>:<>
        <p className="text-center text-xs text-muted">Keep the area in the frame. Photos are saved only on this device.</p>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="min-h-11 text-sm text-accent underline" onClick={()=>setFacing(f=>f==="environment"?"user":"environment")}>Switch camera</button>
          <button type="button" aria-label="Capture photo" disabled={!ready||capturing||!!error} className="flex size-16 items-center justify-center rounded-full border-4 border-accent bg-panel text-accent disabled:opacity-40" onClick={()=>void capture()}><Icon name="camera" className="size-7"/></button>
          <button type="button" className="min-h-11 text-sm text-accent underline" onClick={onChooseFile}>Choose file</button>
        </div>
        {error&&<button type="button" className={buttonSecondary} onClick={()=>setAttempt(n=>n+1)}>Retry camera</button>}
      </>}
    </div>
  </Modal>;
}
