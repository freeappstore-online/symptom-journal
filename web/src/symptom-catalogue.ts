import { detailSuggestions, detailedSymptoms } from "./detailed-symptoms.ts";
import { parentRegion } from "./subregions.ts";
import type { Location } from "./store";

// Editorial observations, not diagnoses or a validated clinical ruleset.
// IDs and diagnostic relationships from SYMP/WebMD have not been imported.
export const catalogueVersion = "2026-11-05-expanded";
export const catalogueReview = "awaiting-clinical-review";
export const regionalSuggestions = {
  "head": {
    "labels": [
      "Headache",
      "Scalp feels tender",
      "Ear pain",
      "Trouble hearing",
      "Fluid coming from ear",
      "Ringing or buzzing in ear",
      "Red eye",
      "Watery eyes",
      "Gritty eyes",
      "Sticky eyes",
      "Itchy eyelids",
      "Toothache",
      "Pain when biting",
      "Swollen cheek or jaw",
      "Blocked nose",
      "Runny nose",
      "Sneezing",
      "Itchy nose"
    ],
    "source": "https://www.nhs.uk/symptoms/headaches/",
    "sources": [
      "https://www.nhs.uk/symptoms/headaches/",
      "https://www.nhs.uk/symptoms/earache/",
      "https://www.nhs.uk/conditions/tinnitus/",
      "https://www.nhs.uk/symptoms/red-eye/",
      "https://www.nhs.uk/symptoms/toothache/",
      "https://www.nhs.uk/conditions/allergic-rhinitis/"
    ]
  },
  "neck": {
    "labels": [
      "Pain",
      "Feels stiff",
      "Hard to turn my head",
      "Sore throat",
      "Pain when swallowing",
      "Lump in my neck"
    ],
    "source": "https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/",
    "sources": [
      "https://www.nhs.uk/symptoms/neck-pain-and-stiff-neck/",
      "https://www.nhs.uk/symptoms/sore-throat/",
      "https://www.nhs.uk/symptoms/earache/"
    ]
  },
  "shoulder": {
    "labels": [
      "Pain",
      "Feels stiff",
      "Looks swollen",
      "Pins and needles",
      "Feels numb",
      "Hard to move my arm",
      "Feels warm",
      "Feels cold"
    ],
    "source": "https://www.nhs.uk/symptoms/shoulder-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/shoulder-pain/"
    ]
  },
  "upper-arm": {
    "labels": [
      "Pain",
      "Looks swollen",
      "Bruising",
      "Tender to touch",
      "Pins and needles",
      "Feels numb",
      "Hard to move my arm",
      "Feels stiff"
    ],
    "source": "https://www.nhs.uk/symptoms/elbow-and-arm-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/elbow-and-arm-pain/"
    ]
  },
  "forearm": {
    "labels": [
      "Pain",
      "Looks swollen",
      "Bruising",
      "Tender to touch",
      "Pins and needles",
      "Feels numb",
      "Hard to move my arm",
      "Feels stiff"
    ],
    "source": "https://www.nhs.uk/symptoms/elbow-and-arm-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/elbow-and-arm-pain/"
    ]
  },
  "elbow": {
    "labels": [
      "Pain",
      "Looks swollen",
      "Bruising",
      "Tender to touch",
      "Pins and needles",
      "Feels numb",
      "Hard to move my arm",
      "Feels stiff"
    ],
    "source": "https://www.nhs.uk/symptoms/elbow-and-arm-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/elbow-and-arm-pain/"
    ]
  },
  "wrist": {
    "labels": [
      "Pain",
      "Feels stiff",
      "Looks swollen",
      "Bruising",
      "Pins and needles",
      "Feels numb",
      "Hard to grip",
      "Thumb feels weak",
      "Lump at wrist"
    ],
    "source": "https://www.nhs.uk/symptoms/hand-pain/wrist-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/hand-pain/wrist-pain/"
    ]
  },
  "hand": {
    "labels": [
      "Pain",
      "Pins and needles",
      "Feels numb",
      "Hard to grip",
      "Looks swollen",
      "Feels stiff",
      "Feels warm",
      "Bruising",
      "Tender to touch"
    ],
    "source": "https://www.nhs.uk/symptoms/hand-pain/pain-in-the-palm-of-the-hand/",
    "sources": [
      "https://www.nhs.uk/symptoms/hand-pain/pain-in-the-palm-of-the-hand/",
      "https://www.nhs.uk/symptoms/hand-pain/wrist-pain/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "chest": {
    "labels": [
      "Pain",
      "Pressure in chest",
      "Burning in chest",
      "Pain when breathing in",
      "Cough",
      "Coughing up mucus",
      "Blisters on skin"
    ],
    "source": "https://www.nhs.uk/symptoms/chest-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/chest-pain/"
    ]
  },
  "upper-back": {
    "labels": [
      "Pain",
      "Feels stiff",
      "Muscle cramps",
      "Muscles tighten on their own",
      "Looks swollen",
      "Lump on my back",
      "Bruising",
      "Tender to touch"
    ],
    "source": "https://www.nhs.uk/conditions/back-pain/",
    "sources": [
      "https://www.nhs.uk/conditions/back-pain/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "lower-back": {
    "labels": [
      "Pain",
      "Feels stiff",
      "Muscle cramps",
      "Muscles tighten on their own",
      "Looks swollen",
      "Lump on my back",
      "Bruising",
      "Tender to touch"
    ],
    "source": "https://www.nhs.uk/conditions/back-pain/",
    "sources": [
      "https://www.nhs.uk/conditions/back-pain/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "abdomen": {
    "labels": [
      "Pain",
      "Feels bloated",
      "Cramps",
      "Hard to pass stool",
      "Loose or watery stools",
      "Vomiting",
      "Feels full after eating",
      "Burning after eating"
    ],
    "source": "https://www.nhs.uk/symptoms/stomach-ache/",
    "sources": [
      "https://www.nhs.uk/symptoms/stomach-ache/"
    ]
  },
  "pelvis": {
    "labels": [
      "Pain",
      "Cramps",
      "Pressure in pelvis",
      "Heavy ache",
      "Pain when peeing",
      "Need to pee more often",
      "Hard to pee",
      "Hard to pass stool",
      "Pain during sex",
      "Unusual discharge",
      "Unexpected vaginal bleeding"
    ],
    "source": "https://www.nhs.uk/symptoms/pelvic-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/pelvic-pain/"
    ]
  },
  "buttocks": {
    "labels": [
      "Pain",
      "Pins and needles",
      "Feels numb",
      "Feels weak",
      "Bruising",
      "Tender to touch",
      "Muscle cramps"
    ],
    "source": "https://www.nhs.uk/conditions/sciatica/",
    "sources": [
      "https://www.nhs.uk/conditions/sciatica/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "thigh": {
    "labels": [
      "Pain",
      "Muscle cramps",
      "Looks swollen",
      "Feels numb",
      "Pins and needles",
      "Feels weak",
      "Bruising",
      "Tender to touch",
      "Muscles tighten on their own"
    ],
    "source": "https://www.nhs.uk/conditions/leg-cramps/",
    "sources": [
      "https://www.nhs.uk/conditions/leg-cramps/",
      "https://www.nhs.uk/conditions/sciatica/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "lower-leg": {
    "labels": [
      "Pain",
      "Muscle cramps",
      "Looks swollen",
      "Feels numb",
      "Pins and needles",
      "Feels weak",
      "Bruising",
      "Tender to touch",
      "Muscles tighten on their own"
    ],
    "source": "https://www.nhs.uk/conditions/leg-cramps/",
    "sources": [
      "https://www.nhs.uk/conditions/leg-cramps/",
      "https://www.nhs.uk/conditions/sciatica/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "knee": {
    "labels": [
      "Pain",
      "Feels stiff",
      "Looks swollen",
      "Feels warm",
      "Gets stuck when bending",
      "Gives way",
      "Hard to straighten my knee",
      "Painful clicking",
      "Hard to put weight on leg",
      "Bruising",
      "Tender to touch"
    ],
    "source": "https://www.nhs.uk/symptoms/knee-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/knee-pain/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "ankle": {
    "labels": [
      "Pain",
      "Looks swollen",
      "Bruising",
      "Hard to walk",
      "Skin looks red",
      "Pins and needles",
      "Feels numb",
      "Tender to touch"
    ],
    "source": "https://www.nhs.uk/symptoms/foot-pain/ankle-pain/",
    "sources": [
      "https://www.nhs.uk/symptoms/foot-pain/ankle-pain/",
      "https://www.nhs.uk/conditions/sprains-and-strains/"
    ]
  },
  "foot": {
    "labels": [
      "Pain",
      "Looks swollen",
      "Feels stiff",
      "Bruising",
      "Pins and needles",
      "Feels numb",
      "Feels warm",
      "Hard to move my foot",
      "Hard to walk",
      "Tender to touch",
      "Muscle cramps",
      "Grating feeling when moving"
    ],
    "source": "https://www.nhs.uk/symptoms/foot-pain/pain-in-the-top-of-the-foot/",
    "sources": [
      "https://www.nhs.uk/symptoms/foot-pain/pain-in-the-top-of-the-foot/",
      "https://www.nhs.uk/conditions/leg-cramps/",
      "https://www.nhs.uk/symptoms/foot-pain/ankle-pain/"
    ]
  }
} as const;
export const skinSuggestions = {
  labels: ["Itchy skin", "Skin rash", "Dry or cracked skin", "Lump under the skin"],
  source: "https://www.nhs.uk/symptoms/itchy-skin/",
} as const;
export function catalogueFor(location: Location | null) {
  if (!location) return null;
  const region = (location.surface3d?.regionId ?? location.region.toLowerCase().replaceAll(" ", "-")).replace(/^(left|right)-/, "");
  const key = region === "arm" ? "upper-arm" : region === "pelvic-region" ? "pelvis" : region;
  return Object.hasOwn(regionalSuggestions,key) ? regionalSuggestions[key as keyof typeof regionalSuggestions] : null;
}
export function suggestionsFor(location: Location | null): readonly string[] {
  if (!location) return [];
  let labels: readonly string[] = catalogueFor(location)?.labels ?? ["Pain"];
  const details=location.detail?detailSuggestions(location.detail):[];
  if(parentRegion(location)==="head" && details.length) labels=details.flatMap(g=>g.labels);
  else labels=[...labels,...details.flatMap(g=>g.labels)];

  return [...new Set([...labels, ...skinSuggestions.labels, ...detailedSymptoms.skin.labels])];
}
const aliases: Record<string, string> = {
  "Pins and needles": "tingling prickling",
  "Feels numb": "numbness sensation",
  "Looks swollen": "swelling puffiness",
  "Feels stiff": "stiffness",
  "Muscles tighten on their own": "spasm twitch tight",
  "Hard to pass stool": "constipation bowel poo poop",
  "Loose or watery stools": "diarrhea diarrhoea bowel poo poop",
  "Ringing or buzzing in ear": "tinnitus noise hearing",
  "Pain when peeing": "urination urine burning",
};
export function searchSuggestions(labels: readonly string[], query: string): readonly string[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return labels.filter(label => words.every(word => `${label} ${aliases[label] ?? ""}`.toLowerCase().includes(word)));
}
