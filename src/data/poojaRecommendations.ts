/** Pandit / pooja booking contact shown for all recommended rituals. */
export const POOJA_CONTACT_PHONE = "9972339362";
export const POOJA_CONTACT_TEL = `tel:+91${POOJA_CONTACT_PHONE}`;

export type PoojaId =
  | "kaal_sarpa_trimbakeshwar"
  | "rahu_ketu_kalahasti"
  | "rahu_ketu_shanti"
  | "tripindi_shradh"
  | "narayan_nagbali"
  | "guru_chandal_remedy";

export type PoojaRecommendation = {
  id: PoojaId;
  /** i18n key under insights.poojas.items.* */
  titleKey: string;
  descKey: string;
  locationKey: string;
  costKey: string;
  /** Triggered by which dosha flags */
  forDoshas: Array<
    "kaalsarp_full" | "kaalsarp_partial" | "sarpa" | "pitru_mild" | "pitru_moderate" | "guru_chandal"
  >;
};

export const POOJA_CATALOG: PoojaRecommendation[] = [
  {
    id: "kaal_sarpa_trimbakeshwar",
    titleKey: "kaalSarpaTrimbakeshwar",
    descKey: "kaalSarpaTrimbakeshwarDesc",
    locationKey: "kaalSarpaTrimbakeshwarLoc",
    costKey: "kaalSarpaTrimbakeshwarCost",
    forDoshas: ["kaalsarp_full", "kaalsarp_partial"]
  },
  {
    id: "rahu_ketu_kalahasti",
    titleKey: "rahuKetuKalahasti",
    descKey: "rahuKetuKalahastiDesc",
    locationKey: "rahuKetuKalahastiLoc",
    costKey: "rahuKetuKalahastiCost",
    forDoshas: ["kaalsarp_full", "kaalsarp_partial", "sarpa"]
  },
  {
    id: "rahu_ketu_shanti",
    titleKey: "rahuKetuShanti",
    descKey: "rahuKetuShantiDesc",
    locationKey: "rahuKetuShantiLoc",
    costKey: "rahuKetuShantiCost",
    forDoshas: ["sarpa", "kaalsarp_partial"]
  },
  {
    id: "tripindi_shradh",
    titleKey: "tripindiShradh",
    descKey: "tripindiShradhDesc",
    locationKey: "tripindiShradhLoc",
    costKey: "tripindiShradhCost",
    forDoshas: ["pitru_mild", "pitru_moderate"]
  },
  {
    id: "narayan_nagbali",
    titleKey: "narayanNagbali",
    descKey: "narayanNagbaliDesc",
    locationKey: "narayanNagbaliLoc",
    costKey: "narayanNagbaliCost",
    forDoshas: ["pitru_moderate", "sarpa"]
  },
  {
    id: "guru_chandal_remedy",
    titleKey: "guruChandalRemedy",
    descKey: "guruChandalRemedyDesc",
    locationKey: "guruChandalRemedyLoc",
    costKey: "guruChandalRemedyCost",
    forDoshas: ["guru_chandal"]
  }
];

export const poojasForFlags = (flags: Set<string>): PoojaRecommendation[] =>
  POOJA_CATALOG.filter((p) => p.forDoshas.some((f) => flags.has(f)));
