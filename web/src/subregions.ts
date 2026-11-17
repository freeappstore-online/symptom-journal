import type { Location } from "./store";
// Familiar surface names. Automatic coordinate suggestions are correctable, not clinical segmentation.
export const subregions: Record<string, readonly string[]> = {
  head: ["Scalp", "Forehead", "Left temple", "Right temple", "Left eye", "Right eye", "Left eyelid", "Right eyelid", "Nose", "Left ear", "Right ear", "Left cheek", "Right cheek", "Mouth", "Lips", "Teeth or gums", "Jaw", "Chin", "Back of head", "Crown of head", "Hairline", "Between the eyebrows", "Bridge of nose", "Tip of nose", "Left nostril", "Right nostril", "Left earlobe", "Right earlobe", "Behind left ear", "Behind right ear", "Upper lip", "Lower lip", "Tongue", "Roof of mouth", "Gums", "Jaw joint"],
  shoulder: ["Front of shoulder", "Top of shoulder", "Back of shoulder", "Armpit", "Outer shoulder", "Shoulder tip"],
  "upper-arm": ["Front of upper arm", "Back of upper arm", "Inner upper arm", "Outer upper arm", "Near shoulder", "Near elbow"],
  elbow: ["Tip of elbow", "Inner elbow", "Outer elbow", "Elbow crease", "Just above elbow", "Just below elbow"],
  forearm: ["Palm side of forearm", "Back of forearm", "Inner forearm", "Outer forearm", "Forearm near wrist", "Forearm near elbow"],
  "upper-back": ["Left shoulder blade", "Right shoulder blade", "Between shoulder blades", "Upper spine", "Middle of back", "Left side of upper back", "Right side of upper back"],
  "lower-back": ["Left lower back", "Right lower back", "Lower spine", "Tailbone", "Above tailbone", "Left flank", "Right flank"],
  pelvis: ["Left hip", "Right hip", "Left groin", "Right groin", "Pubic area", "Genital area", "Front of left hip", "Front of right hip", "Outer left hip", "Outer right hip"],
  buttocks: ["Left buttock", "Right buttock", "Buttock crease", "Around anus", "Left sitting bone area", "Right sitting bone area"],
  thigh: ["Front of thigh", "Back of thigh", "Inner thigh", "Outer thigh", "Thigh near hip", "Thigh near knee"],
  "lower-leg": ["Shin", "Calf", "Inner lower leg", "Outer lower leg", "Upper calf", "Lower calf", "Lower shin"],
  neck: ["Front of neck", "Back of neck", "Left side of neck", "Right side of neck", "Throat", "Base of neck", "Under jaw"],
  chest: ["Centre of chest", "Left chest", "Right chest", "Left ribs", "Right ribs", "Breastbone", "Left breast", "Right breast", "Left nipple", "Right nipple", "Left armpit", "Right armpit", "Left collarbone", "Right collarbone", "Upper chest", "Lower chest", "Under left breast", "Under right breast"],
  abdomen: ["Upper middle abdomen", "Upper left abdomen", "Upper right abdomen", "Around belly button", "Lower middle abdomen", "Lower left abdomen", "Lower right abdomen", "Left side of abdomen", "Right side of abdomen", "Just below ribs", "Below belly button"],
  hand: ["Palm", "Back of hand", "Thumb", "Index finger", "Middle finger", "Ring finger", "Little finger", "Knuckles", "Fingertips", "Base of thumb", "Thumb joint", "Finger joints", "Fingernails", "Between fingers", "Heel of palm"],
  wrist: ["Palm side of wrist", "Back of wrist", "Thumb side of wrist", "Little-finger side of wrist", "Wrist crease", "Just above wrist"],
  knee: ["Kneecap", "Above kneecap", "Below kneecap", "Inner side of knee", "Outer side of knee", "Back of knee", "Knee crease", "Along the edge of kneecap"],
  foot: ["Heel", "Sole", "Arch", "Ball of foot", "Top of foot", "Big toe", "Second toe", "Third toe", "Fourth toe", "Little toe", "Toenails", "Inner arch", "Outer edge of foot", "Instep", "Back of heel", "Bottom of heel", "Base of big toe", "Between toes"],
  ankle: ["Inner ankle", "Outer ankle", "Front of ankle", "Back of ankle", "Inner ankle bone", "Outer ankle bone", "Achilles tendon area"],
};
export function parentRegion(location: Pick<Location, "region"> & { surface3d?: {regionId:string} }): string {
  const region = (location.surface3d?.regionId ?? location.region.toLowerCase().replaceAll(" ", "-")).replace(/^(left|right)-/, "");
  return region;
}
export function specificLocationName(location: Location): string {
  if (!location.detail) return location.region;
  const side = location.region.match(/^(Left|Right) /)?.[1];
  return side ? `${side} ${location.detail.toLowerCase()}` : location.detail;
}
export function validSubregion(location: { region: string; surface3d?: {regionId:string}; detail?: unknown }): boolean {
  if (location.detail === undefined) return true;
  const parent = parentRegion(location);
  return typeof location.detail === "string" && Object.hasOwn(subregions,parent) && subregions[parent].includes(location.detail);
}
