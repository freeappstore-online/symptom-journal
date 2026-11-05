export const MAX_PHOTOS = 3;
export const MAX_PHOTO_CHARS = 200_000;
export type EntryPhoto = { id: string; dataUrl: string; width: number; height: number; caption: string };
export function validPhotos(value: unknown): value is EntryPhoto[] {
  if (!Array.isArray(value) || value.length > MAX_PHOTOS) return false;
  const ids = new Set<string>();
  return value.every(p => {
    if (!p || typeof p !== "object" || typeof p.id !== "string" || !p.id || p.id.length > 80 || ids.has(p.id) ||
      typeof p.caption !== "string" || p.caption.length > 200 || !Number.isInteger(p.width) || p.width < 1 || p.width > 1280 ||
      !Number.isInteger(p.height) || p.height < 1 || p.height > 1280 || typeof p.dataUrl !== "string" ||
      p.dataUrl.length > MAX_PHOTO_CHARS || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.dataUrl)) return false;
    try {
      const bytes = atob(p.dataUrl.slice("data:image/jpeg;base64,".length));
      if (bytes.length < 4 || bytes.charCodeAt(0) !== 255 || bytes.charCodeAt(1) !== 216 || bytes.charCodeAt(2) !== 255 ||
        bytes.charCodeAt(bytes.length-2) !== 255 || bytes.charCodeAt(bytes.length-1) !== 217) return false;
    } catch { return false; }
    ids.add(p.id); return true;
  });
}
