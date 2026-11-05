import { MAX_PHOTO_CHARS, type EntryPhoto } from "./photo-policy";
export async function preparePhoto(file: File): Promise<EntryPhoto> {
  if (file.size > 20_000_000) throw Error("Choose a photo smaller than 20 MB.");
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw Error("Choose a JPEG, PNG or WebP photo. Convert HEIC to JPEG if it cannot open.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    try { await image.decode(); } catch { throw Error("This photo could not open. Try a JPEG, PNG or WebP copy."); }
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth*image.naturalHeight > 50_000_000)
      throw Error("This photo is too large to process. Choose a smaller copy.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d"); if(!context) throw Error("Photo processing is unavailable in this browser.");
    let scale = Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));
    for(let attempt=0; attempt<5; attempt++) {
      canvas.width = Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
      context.fillStyle = "white"; context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,0,0,canvas.width,canvas.height);
      for(const quality of [0.9,0.8,0.7]) {
        const dataUrl = canvas.toDataURL("image/jpeg",quality);
        if(dataUrl.startsWith("data:image/jpeg;base64,") && dataUrl.length <= MAX_PHOTO_CHARS)
          return {id:crypto.randomUUID(),dataUrl,width:canvas.width,height:canvas.height,caption:""};
      }
      scale *= 0.75;
    }
    throw Error("This photo is too detailed to save. Try a smaller copy.");
  } finally { URL.revokeObjectURL(url); }
}
