import type { Location } from "./store";
// Familiar surface names. Automatic coordinate suggestions are correctable, not clinical segmentation.
export const subregions: Record<string, readonly string[]> = {
  head: ["Scalp", "Forehead", "Left temple", "Right temple", "Left eye", "Right eye", "Left eyelid", "Right eyelid", "Nose", "Left ear", "Right ear", "Left cheek", "Right cheek", "Mouth", "Lips", "Teeth or gums", "Jaw", "Chin", "Back of head"],
  shoulder: ["Front of shoulder", "Top of shoulder", "Back of shoulder", "Armpit"],
  "upper-arm": ["Front of upper arm", "Back of upper arm", "Inner upper arm", "Outer upper arm"],
  elbow: ["Tip of elbow", "Inner elbow", "Outer elbow", "Elbow crease"],
  forearm: ["Palm side of forearm", "Back of forearm", "Inner forearm", "Outer forearm"],
  "upper-back": ["Left shoulder blade", "Right shoulder blade", "Between shoulder blades", "Upper spine"],
  "lower-back": ["Left lower back", "Right lower back", "Lower spine", "Tailbone"],
  pelvis: ["Left hip", "Right hip", "Left groin", "Right groin", "Pubic area", "Genital area"],
  buttocks: ["Left buttock", "Right buttock", "Buttock crease", "Around anus"],
  thigh: ["Front of thigh", "Back of thigh", "Inner thigh", "Outer thigh"],
  "lower-leg": ["Shin", "Calf", "Inner lower leg", "Outer lower leg"],
  neck: ["Front of neck", "Back of neck", "Left side of neck", "Right side of neck", "Throat"],
  chest: ["Centre of chest", "Left chest", "Right chest", "Left ribs", "Right ribs", "Breastbone", "Left breast", "Right breast", "Left nipple", "Right nipple", "Left armpit", "Right armpit", "Left collarbone", "Right collarbone"],
  abdomen: ["Upper middle abdomen", "Upper left abdomen", "Upper right abdomen", "Around belly button", "Lower middle abdomen", "Lower left abdomen", "Lower right abdomen"],
  hand: ["Palm", "Back of hand", "Thumb", "Index finger", "Middle finger", "Ring finger", "Little finger", "Knuckles", "Fingertips"],
  wrist: ["Palm side of wrist", "Back of wrist", "Thumb side of wrist", "Little-finger side of wrist"],
  knee: ["Kneecap", "Above kneecap", "Below kneecap", "Inner side of knee", "Outer side of knee", "Back of knee"],
  foot: ["Heel", "Sole", "Arch", "Ball of foot", "Top of foot", "Big toe", "Second toe", "Third toe", "Fourth toe", "Little toe", "Toenails"],
  ankle: ["Inner ankle", "Outer ankle", "Front of ankle", "Back of ankle"],
};
export function parentRegion(location: Location): string {
  return (location.surface3d?.regionId ?? location.region.toLowerCase().replaceAll(" ", "-")).replace(/^(left|right)-/, "");
}
export function specificLocationName(location: Location): string {
  if (!location.detail) return location.region;
  const side = location.region.match(/^(Left|Right) /)?.[1];
  return side ? `${side} ${location.detail.toLowerCase()}` : location.detail;
}
export function validSubregion(location: { region: string; surface3d?: {regionId:string}; detail?: unknown }): boolean {
  if (location.detail === undefined) return true;
  const parent = (location.surface3d?.regionId ?? location.region.toLowerCase().replaceAll(" ", "-")).replace(/^(left|right)-/, "");
  return typeof location.detail === "string" && Object.hasOwn(subregions,parent) && subregions[parent].includes(location.detail);
}
