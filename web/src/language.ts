import { searchAliases } from "./search-aliases.ts";
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
  return currentLanguage === "vi" ? vietnameseLabel(text) : text;
}

function vietnameseLabel(text: string): string {
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

const searchWords = (text: string) => foldSearch(text).match(/[\p{L}\p{N}]+/gu) ?? [];
const fillerWords = new Set(["a", "an", "at", "by", "for", "in", "my", "of", "on", "the", "to", "with", "o", "bi", "cua", "toi"]);

function typoMatch(query: string, word: string) {
  if (query.length < 4 || Math.abs(query.length - word.length) > 1) return false;
  let i = 0;
  while (i < query.length && query[i] === word[i]) i++;
  if (query.length > word.length) return query.slice(i + 1) === word.slice(i);
  if (word.length > query.length) return word.slice(i + 1) === query.slice(i);
  return query.slice(i + 1) === word.slice(i + 1) ||
    (query[i] === word[i + 1] && query[i + 1] === word[i] && query.slice(i + 2) === word.slice(i + 2));
}

const aliasesByLabel = new Map(Object.entries(searchAliases).map(([label, aliases]) => [label.toLowerCase(), aliases]));
function keywords(label: string) {
  return label.split(" · ").flatMap(part => {
    const base = part.replace(/^(left|right) /i, "");
    return [aliasesByLabel.get(part.toLowerCase()), aliasesByLabel.get(base.toLowerCase())];
  }).filter(Boolean).join(" ");
}

function wordScore(query: string, words: readonly string[]) {
  if (words.includes(query)) return 6;
  if (words.some(word => word.startsWith(query))) return 4;
  if (words.some(word => typoMatch(query, word))) return 2;
  return 0;
}

export function searchScore(label: string, query: string, context = "") {
  const all = searchWords(query);
  if (!all.length) return 0;
  const words = all.filter(word => !fillerWords.has(word));
  const direct = searchWords(`${label} ${vietnameseLabel(label)}`);
  const aliases = searchWords(keywords(label));
  const contextual = searchWords(`${context} ${vietnameseLabel(context)} ${keywords(context)}`);
  let total = 0;
  let matchedLabel = false;
  for (const word of words.length ? words : all) {
    const score = Math.max(wordScore(word, direct), wordScore(word, aliases) - 1);
    if (score) matchedLabel = true;
    else if (!wordScore(word, contextual)) return -1;
    total += score;
  }
  if (!matchedLabel) return -1;
  const phrase = all.join(" ");
  const exact = [label, vietnameseLabel(label)].some(value => searchWords(value).join(" ") === phrase);
  return total + (exact ? 10 : 0);
}

export function matchesLabel(text: string, query: string) {
  return searchScore(text, query) >= 0;
}
