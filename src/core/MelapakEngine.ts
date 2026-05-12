/**
 * Marriage compatibility (Melapak / Guna Milan–style): Ashta Kuta up to 36 points
 * plus South-Indian-style Rajju (Saravali) and Vedha checks.
 *
 * Many almanacs use 18/36 as a common minimum; 24+ is often read as strong.
 * Regional rules vary; this is a transparent reference implementation for the app UI.
 */

import { patrikaMetaForNakshatraIndex } from "./nakshatraPatrikaMeta";

export type MelapakKutaId =
  | "varna"
  | "vashya"
  | "tara"
  | "yoni"
  | "grahaMaitri"
  | "gana"
  | "bhakoot"
  | "nadi";

export type MelapakKutaRow = {
  id: MelapakKutaId;
  score: number;
  max: number;
  noteKey: string;
};

export type MelapakResult = {
  total: number;
  maxTotal: 36;
  kutas: MelapakKutaRow[];
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  /** 0 = poor … 3 = excellent (from total + doshas) */
  band: 0 | 1 | 2 | 3;
};

type RajjuMeta = { part: "pada" | "kati" | "nabhi" | "kanta" | "siro"; stream: "aroha" | "siro" | "avaroha" };

/** Saravali-style Rajju lines (nakṣatra index 0 = Aśvinī … 26 = Revatī). */
const RAJJU_META: RajjuMeta[] = [
  { part: "pada", stream: "aroha" },
  { part: "kati", stream: "aroha" },
  { part: "nabhi", stream: "aroha" },
  { part: "kanta", stream: "aroha" },
  { part: "siro", stream: "siro" },
  { part: "kanta", stream: "avaroha" },
  { part: "nabhi", stream: "avaroha" },
  { part: "kati", stream: "avaroha" },
  { part: "pada", stream: "avaroha" },
  { part: "pada", stream: "aroha" },
  { part: "kati", stream: "aroha" },
  { part: "nabhi", stream: "aroha" },
  { part: "kanta", stream: "aroha" },
  { part: "siro", stream: "siro" },
  { part: "kanta", stream: "avaroha" },
  { part: "nabhi", stream: "avaroha" },
  { part: "kati", stream: "avaroha" },
  { part: "pada", stream: "avaroha" },
  { part: "pada", stream: "aroha" },
  { part: "kati", stream: "aroha" },
  { part: "nabhi", stream: "aroha" },
  { part: "kanta", stream: "aroha" },
  { part: "siro", stream: "siro" },
  { part: "kanta", stream: "avaroha" },
  { part: "nabhi", stream: "avaroha" },
  { part: "kati", stream: "avaroha" },
  { part: "pada", stream: "avaroha" }
];

const vedhaKey = (a: number, b: number): string => {
  const x = Math.min(a, b);
  const y = Math.max(a, b);
  return `${x},${y}`;
};

/** Common Vedha pairs (0-based nakṣatra indices). */
const VEDHA_KEYS = new Set(
  [
    [0, 17],
    [1, 16],
    [2, 15],
    [3, 14],
    [4, 21],
    [5, 20],
    [6, 22],
    [7, 23],
    [8, 24],
    [9, 26],
    [10, 25],
    [11, 19]
  ].map(([a, b]) => vedhaKey(a, b))
);

const SIGN_LORD = [
  "Mars",
  "Venus",
  "Mercury",
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Saturn",
  "Jupiter"
] as const;

type Lord = (typeof SIGN_LORD)[number];

const lordPairKey = (a: string, b: string): string => `${a}|${b}`;

/** Parāśara-style mitra / sama / śatru for moon-sign lords (used for Graha Maitri). */
const LORD_REL: Record<Lord, Record<Lord, 2 | 1 | 0>> = {
  Sun: { Sun: 1, Moon: 2, Mars: 2, Mercury: 1, Jupiter: 2, Venus: 0, Saturn: 0 },
  Moon: { Sun: 2, Moon: 1, Mars: 0, Mercury: 2, Jupiter: 1, Venus: 1, Saturn: 1 },
  Mars: { Sun: 2, Moon: 0, Mars: 1, Mercury: 0, Jupiter: 2, Venus: 0, Saturn: 2 },
  Mercury: { Sun: 1, Moon: 2, Mars: 0, Mercury: 1, Jupiter: 0, Venus: 2, Saturn: 2 },
  Jupiter: { Sun: 2, Moon: 1, Mars: 2, Mercury: 0, Jupiter: 1, Venus: 0, Saturn: 0 },
  Venus: { Sun: 0, Moon: 1, Mars: 0, Mercury: 2, Jupiter: 0, Venus: 1, Saturn: 2 },
  Saturn: { Sun: 0, Moon: 1, Mars: 2, Mercury: 2, Jupiter: 0, Venus: 2, Saturn: 1 }
};

const grahaMaitriPoints = (girlSign: number, boySign: number): number => {
  const Lg = SIGN_LORD[((girlSign % 12) + 12) % 12]!;
  const Lb = SIGN_LORD[((boySign % 12) + 12) % 12]!;
  const a = LORD_REL[Lg][Lb];
  const b = LORD_REL[Lb][Lg];
  if (a === 2 && b === 2) return 5;
  if ((a === 2 && b === 1) || (a === 1 && b === 2)) return 4;
  if (a === 1 && b === 1) return 3;
  if (a === 0 || b === 0) return 0;
  return 3;
};

const varnaRank = (signIdx0: number): number => {
  const s = ((signIdx0 % 12) + 12) % 12;
  if ([0, 4, 8].includes(s)) return 4;
  if ([1, 5, 9].includes(s)) return 3;
  if ([2, 6, 10].includes(s)) return 2;
  return 1;
};

/** 1 point if groom’s class is not below bride’s (common North-Indian rule). */
const varnaPoints = (girlMoonSign: number, boyMoonSign: number): number => {
  const g = varnaRank(girlMoonSign);
  const b = varnaRank(boyMoonSign);
  return b >= g ? 1 : 0;
};

/** Vasya: groom’s sign “holds” bride’s sign in classical groups (simplified 12×12). */
const vasyaPoints = (girlMoonSign: number, boyMoonSign: number): number => {
  const g = ((girlMoonSign % 12) + 12) % 12;
  const b = ((boyMoonSign % 12) + 12) % 12;
  const d = (b - g + 12) % 12;
  if (d === 0) return 2;
  if (d === 2 || d === 5 || d === 8) return 2;
  if (d === 3 || d === 6 || d === 9 || d === 11) return 1;
  return 0;
};

const taraPoints = (girlNak: number, boyNak: number): number => {
  const g = ((girlNak % 27) + 27) % 27;
  const b = ((boyNak % 27) + 27) % 27;
  const count = (b - g + 27) % 27;
  const n = count === 0 ? 1 : count + 1;
  const taraIdx = (n - 1) % 9;
  const good = new Set([1, 3, 5, 7, 8]);
  return good.has(taraIdx) ? 3 : 0;
};

const YONI_ENEMIES = new Set([
  lordPairKey("Horse", "Buffalo"),
  lordPairKey("Elephant", "Lion"),
  lordPairKey("Sheep", "Dog"),
  lordPairKey("Serpent", "Mongoose"),
  lordPairKey("Cat", "Rat"),
  lordPairKey("Cow", "Tiger"),
  lordPairKey("Monkey", "Sheep"),
  lordPairKey("Deer", "Dog")
]);

const yoniPoints = (girlNak: number, boyNak: number): number => {
  const yg = patrikaMetaForNakshatraIndex(girlNak).yoniEn;
  const yb = patrikaMetaForNakshatraIndex(boyNak).yoniEn;
  if (yg === yb) return 4;
  const k1 = lordPairKey(yg, yb);
  const k2 = lordPairKey(yb, yg);
  if (YONI_ENEMIES.has(k1) || YONI_ENEMIES.has(k2)) return 0;
  return 3;
};

const ganaPoints = (girlNak: number, boyNak: number): number => {
  const gg = patrikaMetaForNakshatraIndex(girlNak).ganaEn;
  const gb = patrikaMetaForNakshatraIndex(boyNak).ganaEn;
  if (gg === gb) return 6;
  if ((gg === "Deva" && gb === "Manushya") || (gg === "Manushya" && gb === "Deva")) return 5;
  if ((gg === "Manushya" && gb === "Rakshasa") || (gg === "Rakshasa" && gb === "Manushya")) return 3;
  return 0;
};

/**
 * Bhakoot: unfavourable when groom’s Moon is in 2nd, 3rd, 5th, 9th, or 12th rāśi
 * counted from bride’s Moon (whole-sign).
 */
const bhakootPoints = (girlMoonSign: number, boyMoonSign: number): number => {
  const g = ((girlMoonSign % 12) + 12) % 12;
  const b = ((boyMoonSign % 12) + 12) % 12;
  const d = (b - g + 12) % 12;
  if ([1, 2, 4, 8, 11].includes(d)) return 0;
  return 7;
};

const nadiPoints = (girlNak: number, boyNak: number): number => {
  const ng = patrikaMetaForNakshatraIndex(girlNak).nadiEn;
  const nb = patrikaMetaForNakshatraIndex(boyNak).nadiEn;
  return ng === nb ? 0 : 8;
};

export const rajjuDosha = (girlNak: number, boyNak: number): boolean => {
  const a = RAJJU_META[((girlNak % 27) + 27) % 27]!;
  const b = RAJJU_META[((boyNak % 27) + 27) % 27]!;
  return a.part === b.part && a.stream === b.stream;
};

export const vedhaDosha = (girlNak: number, boyNak: number): boolean =>
  VEDHA_KEYS.has(vedhaKey(((girlNak % 27) + 27) % 27, ((boyNak % 27) + 27) % 27));

export const computeMelapak = (
  girlMoonSign: number,
  boyMoonSign: number,
  girlMoonNakshatra: number,
  boyMoonNakshatra: number
): MelapakResult => {
  const kutas: MelapakKutaRow[] = [
    { id: "varna", score: varnaPoints(girlMoonSign, boyMoonSign), max: 1, noteKey: "melapak.kutaNotes.varna" },
    { id: "vashya", score: vasyaPoints(girlMoonSign, boyMoonSign), max: 2, noteKey: "melapak.kutaNotes.vashya" },
    { id: "tara", score: taraPoints(girlMoonNakshatra, boyMoonNakshatra), max: 3, noteKey: "melapak.kutaNotes.tara" },
    { id: "yoni", score: yoniPoints(girlMoonNakshatra, boyMoonNakshatra), max: 4, noteKey: "melapak.kutaNotes.yoni" },
    {
      id: "grahaMaitri",
      score: grahaMaitriPoints(girlMoonSign, boyMoonSign),
      max: 5,
      noteKey: "melapak.kutaNotes.grahaMaitri"
    },
    { id: "gana", score: ganaPoints(girlMoonNakshatra, boyMoonNakshatra), max: 6, noteKey: "melapak.kutaNotes.gana" },
    { id: "bhakoot", score: bhakootPoints(girlMoonSign, boyMoonSign), max: 7, noteKey: "melapak.kutaNotes.bhakoot" },
    { id: "nadi", score: nadiPoints(girlMoonNakshatra, boyMoonNakshatra), max: 8, noteKey: "melapak.kutaNotes.nadi" }
  ];
  const total = kutas.reduce((s, k) => s + k.score, 0);
  const rj = rajjuDosha(girlMoonNakshatra, boyMoonNakshatra);
  const vd = vedhaDosha(girlMoonNakshatra, boyMoonNakshatra);
  let band: 0 | 1 | 2 | 3 = 0;
  if (!rj && !vd && total >= 28) band = 3;
  else if (!rj && !vd && total >= 24) band = 2;
  else if (!rj && !vd && total >= 18) band = 1;
  else if (rj || vd) band = total >= 22 ? 1 : 0;
  else if (total >= 18) band = 1;
  return { total, maxTotal: 36, kutas, rajjuDosha: rj, vedhaDosha: vd, band };
};
