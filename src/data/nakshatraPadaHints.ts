/** Very short starting-syllable hints (many traditions exist; for inspiration only). */
const HINTS: Partial<Record<string, Record<number, string>>> = {
  Ashwini: { 1: "chu, che, cho, la", 2: "li, lu, le, lo", 3: "a, e, u, ea", 4: "ee, oo, ae, o" },
  Bharani: { 1: "li, lu, le, lo", 2: "a, e, u, ea", 3: "ee, oo, ae, o", 4: "va, vi, vu, ve" },
  Krittika: { 1: "a, e, u, ea", 2: "ee, oo, ae, o", 3: "ka, ki, ku, ke", 4: "kha, khi, khu, khe" },
  Rohini: { 1: "o, va, vi, vu", 2: "ve, vo, ba, bi", 3: "bu, be, bo, da", 4: "di, du, de, do" },
  Mrigashira: { 1: "ve, vo, ka, ki", 2: "ku, ke, ko, ha", 3: "hi, hu, he, ho", 4: "da, di, du, de" },
  Ardra: { 1: "ka, ki, ku, ke", 2: "ko, ha, hi, hu", 3: "he, ho, da, di", 4: "du, de, do, cha" },
  Punarvasu: { 1: "ke, ko, ha, hi", 2: "hu, he, ho, da", 3: "di, du, de, do", 4: "ma, mi, mu, me" },
  Pushya: { 1: "hu, he, ho, da", 2: "di, du, de, do", 3: "ma, mi, mu, me", 4: "mo, ta, ti, tu" },
  Ashlesha: { 1: "di, du, de, do", 2: "ma, mi, mu, me", 3: "mo, ta, ti, tu", 4: "te, to, pa, pi" },
  Magha: { 1: "ma, mi, mu, me", 2: "mo, ta, ti, tu", 3: "te, to, pa, pi", 4: "pu, pe, po, ra" },
  PurvaPhalguni: { 1: "mo, ta, ti, tu", 2: "te, to, pa, pi", 3: "pu, pe, po, ra", 4: "ri, ru, re, ro" },
  UttaraPhalguni: { 1: "te, to, pa, pi", 2: "pu, pe, po, ra", 3: "ri, ru, re, ro", 4: "ta, ti, tu, te" },
  Hasta: { 1: "pu, pe, po, ra", 2: "ri, ru, re, ro", 3: "ta, ti, tu, te", 4: "to, pa, pi, pu" },
  Chitra: { 1: "ri, ru, re, ro", 2: "ta, ti, tu, te", 3: "to, pa, pi, pu", 4: "pe, po, ra, ri" },
  Swati: { 1: "ta, ti, tu, te", 2: "to, pa, pi, pu", 3: "pe, po, ra, ri", 4: "ru, re, ro, ta" },
  Vishakha: { 1: "to, pa, pi, pu", 2: "pe, po, ra, ri", 3: "ru, re, ro, ta", 4: "ti, tu, te, to" },
  Anuradha: { 1: "pe, po, ra, ri", 2: "ru, re, ro, ta", 3: "ti, tu, te, to", 4: "na, ni, nu, ne" },
  Jyeshtha: { 1: "ru, re, ro, ta", 2: "ti, tu, te, to", 3: "na, ni, nu, ne", 4: "no, ya, yi, yu" },
  Mula: { 1: "ti, tu, te, to", 2: "na, ni, nu, ne", 3: "no, ya, yi, yu", 4: "ye, yo, bha, bhi" },
  PurvaAshadha: { 1: "na, ni, nu, ne", 2: "no, ya, yi, yu", 3: "ye, yo, bha, bhi", 4: "bhu, dha, faa, dhi" },
  UttaraAshadha: { 1: "no, ya, yi, yu", 2: "ye, yo, bha, bhi", 3: "bhu, dha, faa, dhi", 4: "bhe, bho, ja, ji" },
  Shravana: { 1: "ye, yo, bha, bhi", 2: "bhu, dha, faa, dhi", 3: "bhe, bho, ja, ji", 4: "ju, je, jo, gha" },
  Dhanishtha: { 1: "bhu, dha, faa, dhi", 2: "bhe, bho, ja, ji", 3: "ju, je, jo, gha", 4: "ga, gi, gu, ge" },
  Shatabhisha: { 1: "bhe, bho, ja, ji", 2: "ju, je, jo, gha", 3: "ga, gi, gu, ge", 4: "go, sa, si, su" },
  PurvaBhadrapada: { 1: "ju, je, jo, gha", 2: "ga, gi, gu, ge", 3: "go, sa, si, su", 4: "se, so, da, di" },
  UttaraBhadrapada: { 1: "ga, gi, gu, ge", 2: "go, sa, si, su", 3: "se, so, da, di", 4: "du, tha, jha, tra" },
  Revati: { 1: "go, sa, si, su", 2: "se, so, da, di", 3: "du, tha, jha, tra", 4: "de, do, cha, chi" }
};

export const getNakshatraPadaHint = (nakshatraEnglish: string, pada: 1 | 2 | 3 | 4): string | undefined => {
  const key = nakshatraEnglish.replace(/\s+/g, "");
  const row = HINTS[key as keyof typeof HINTS];
  if (!row) return undefined;
  return row[pada];
};
