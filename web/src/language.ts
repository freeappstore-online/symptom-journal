import { vietnamese } from "./vietnamese.ts";

export type Language = "en" | "vi";
const storageKey = "symptom-map:language";
function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "en" || saved === "vi") return saved;
  } catch {
    // The browser preference is still available without storage.
  }
  return typeof navigator !== "undefined" && /^vi(?:-|$)/i.test(navigator.language) ? "vi" : "en";
}
let currentLanguage = initialLanguage();

export function language() {
  return currentLanguage;
}

export function setLanguage(value: Language) {
  currentLanguage = value;
  document.documentElement.lang = value;
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // The selected language still works until the page reloads.
  }
}

export function formatLocale() {
  return currentLanguage === "vi" ? "vi-VN" : undefined;
}

export function t(text: string, values?: Record<string, string | number>): string {
  const copy = currentLanguage === "vi" && Object.hasOwn(vietnamese, text) ? vietnamese[text] : text;
  return values ? copy.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key]?.toString() ?? placeholder) : copy;
}

const vocabulary = new Map(Object.entries(vietnamese).map(([key, value]) => [key.toLowerCase(), value]));
export function displayLabel(text: string): string {
  if (currentLanguage !== "vi") return text;
  return text.split(" · ").map(part => {
    const exact = vocabulary.get(part.toLowerCase());
    if (exact) return exact;
    const side = /^(left|right) (.+)$/i.exec(part);
    const region = side && vocabulary.get(side[2].toLowerCase());
    return region ? `${region} ${side[1].toLowerCase() === "left" ? "trái" : "phải"}` : part;
  }).join(" · ");
}

export function foldSearch(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("đ", "d");
}

export function matchesLabel(text: string, query: string) {
  const searchable = foldSearch(`${text} ${displayLabel(text)}`);
  return foldSearch(query).trim().split(/\s+/).every(word => searchable.includes(word));
}
