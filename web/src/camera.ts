export function stopCameraStream(stream: Pick<MediaStream,"getTracks"> | null) {
  stream?.getTracks().forEach(track=>track.stop());
}

export function connectCamera(request:()=>Promise<MediaStream>,onReady:(stream:MediaStream)=>void,onError:(error:unknown)=>void) {
  let closed=false,stream:MediaStream|null=null;
  request().then(media=>{
    if(closed) {stopCameraStream(media);return;}
    stream=media;onReady(media);
  }).catch(error=>{if(!closed)onError(error);});
  return ()=>{closed=true;stopCameraStream(stream);};
}
