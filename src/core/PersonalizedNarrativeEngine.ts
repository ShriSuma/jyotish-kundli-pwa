/**
 * Chart-specific bhāva narratives. All prose lives in i18n JSON; this engine
 * only stitches translated fragments together with chart facts (rāśi, lord,
 * occupants, amsha). Keeps file small and easy to extend per language.
 */
import type { TFunction } from "i18next";
import type { KundliOutput, PlanetName } from "./AstroTypes";
import { bhavaFromAscendant } from "./KundliEngine";
import { patrikaNavamshaFromDegree, rashiAmshaFromDegree, formatChartHouseNumber } from "./localeNumbers";
import type { BhavaReading } from "./KundliReadingEngine";
import { rashiIndexInHouse, signLord } from "./KundliInsightsEngine";
import { houseMeta } from "../data/southIndianHouseGuide";
import { netScoreToPercent, percentToStars, scoreTier } from "./HousePredictionEngine";

export type GrahaDetail = {
  planet: PlanetName | "Maandi";
  amshaNav: number;
  amshaD12: number;
};

const planetT = (t: TFunction, p: PlanetName): string => t(`planets.${p}` as "planets.Sun");

const rashiT = (t: TFunction, r: BhavaReading["rashi"]): string =>
  t(`rashis.${r.sanskrit.replace(/\s+/g, "")}` as "rashis.Mesha") || r.english;

const relationT = (t: TFunction, rel: BhavaReading["lordRelation"]): string =>
  t(`reading.relation.${rel}` as "reading.relation.mitra");

const grahaDetailsInHouse = (k: KundliOutput, house: number): GrahaDetail[] => {
  const out: GrahaDetail[] = [];
  for (const p of k.planets) {
    if (p.house !== house) continue;
    out.push({
      planet: p.name,
      amshaNav: patrikaNavamshaFromDegree(p.degree),
      amshaD12: rashiAmshaFromDegree(p.degree)
    });
  }
  if (k.maandi && bhavaFromAscendant(k.ascendant, k.maandi.degree) === house) {
    out.push({
      planet: "Maandi",
      amshaNav: patrikaNavamshaFromDegree(k.maandi.degree),
      amshaD12: rashiAmshaFromDegree(k.maandi.degree)
    });
  }
  return out;
};

const formatGraha = (g: GrahaDetail, t: TFunction, lang: string): string => {
  const name = g.planet === "Maandi" ? t("kundli.maandi") : planetT(t, g.planet);
  const nav = formatChartHouseNumber(g.amshaNav, lang);
  return t("reading.grahaAmshaLine", { planet: name, amsha: nav });
};

const lordContextKey = (lordHouse: number, lordRelation: BhavaReading["lordRelation"]): string => {
  if (lordRelation === "own") return "ownSign";
  if (lordHouse === 6 || lordHouse === 8 || lordHouse === 12) return "dusthana";
  if (lordHouse === 1 || lordHouse === 4 || lordHouse === 7 || lordHouse === 10) return "kendra";
  if (lordHouse === 5 || lordHouse === 9) return "trikona";
  if (lordHouse === 3 || lordHouse === 11) return "upachaya";
  return "general";
};

/** Compose one bhāva's natural-language paragraph from translated fragments. */
export const composeHouseNarrative = (
  k: KundliOutput,
  bhava: BhavaReading,
  t: TFunction,
  lang = "en"
): string => {
  const house = bhava.house;
  const score = netScoreToPercent(bhava.netScore);
  const tier = scoreTier(score);
  const stars = percentToStars(score);
  const grahas = grahaDetailsInHouse(k, house);

  const grahaSentence =
    grahas.length === 0
      ? t("reading.houseLong.noGraha")
      : t("reading.houseLong.grahaPresent", {
          grahas: grahas.map((g) => formatGraha(g, t, lang)).join(", ")
        });

  const lordSentence = t("reading.houseLong.lord", {
    lord: planetT(t, bhava.lord),
    lordHouseLabel: t("reading.houseN", { n: bhava.lordHouse }),
    lordRelation: relationT(t, bhava.lordRelation),
    lordContext: t(
      `reading.lordContext.${lordContextKey(bhava.lordHouse, bhava.lordRelation)}` as "reading.lordContext.kendra"
    )
  });

  return t(`reading.houseLong.tier.${tier}` as "reading.houseLong.tier.good", {
    intro: t(`reading.houseLong.intro.h${house}` as "reading.houseLong.intro.h1"),
    house,
    rashi: rashiT(t, bhava.rashi),
    score,
    stars,
    themes: t(houseMeta(house).themeKey as "reading.houseThemes.h1"),
    lordSentence,
    grahaSentence
  });
};

/** Compact JSON view of the chart for an optional AI polish endpoint. */
export const buildChartFactSheet = (k: KundliOutput, lang: string) => {
  const lagnaIdx = k.lagnaRashi.index;
  return {
    lang,
    lagna: k.lagnaRashi.sanskrit,
    lagnaAmshaNav: patrikaNavamshaFromDegree(k.ascendant),
    houses: Array.from({ length: 12 }, (_, i) => {
      const h = i + 1;
      const signIdx = rashiIndexInHouse(lagnaIdx, h);
      return {
        house: h,
        signIndex: signIdx,
        grahas: [
          ...k.planets
            .filter((p) => p.house === h)
            .map((p) => ({
              name: p.name,
              amshaNav: patrikaNavamshaFromDegree(p.degree),
              amshaD12: rashiAmshaFromDegree(p.degree)
            })),
          ...(k.maandi && bhavaFromAscendant(k.ascendant, k.maandi.degree) === h
            ? [{ name: "Maandi", amshaNav: patrikaNavamshaFromDegree(k.maandi.degree) }]
            : [])
        ],
        lord: signLord(signIdx)
      };
    })
  };
};
