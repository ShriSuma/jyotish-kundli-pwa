/**
 * South Indian whole-sign chart: fixed rāśi grid, bhāvas counted clockwise from Lagna.
 * House themes from classical Parāśara / BPHS teaching (Tanu → Vyaya).
 */
export type SouthIndianHouseMeta = {
  house: number;
  sanskritName: string;
  englishName: string;
  /** i18n key reading.houseThemes.hN */
  themeKey: string;
  /** i18n key reading.houseNames.hN */
  nameKey: string;
  bodyPartsKey: string;
  /** fire | earth | air | water — natural sign element for reference */
  naturalElement: "fire" | "earth" | "air" | "water";
};

export const SIGN_ELEMENTS: Array<"fire" | "earth" | "air" | "water"> = [
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water"
];

export const SOUTH_INDIAN_HOUSES: SouthIndianHouseMeta[] = [
  {
    house: 1,
    sanskritName: "Tanu Bhava",
    englishName: "House of Self",
    nameKey: "reading.houseNames.h1",
    themeKey: "reading.houseThemes.h1",
    bodyPartsKey: "reading.houseBody.h1",
    naturalElement: "fire"
  },
  {
    house: 2,
    sanskritName: "Dhana Bhava",
    englishName: "Wealth & Family",
    nameKey: "reading.houseNames.h2",
    themeKey: "reading.houseThemes.h2",
    bodyPartsKey: "reading.houseBody.h2",
    naturalElement: "earth"
  },
  {
    house: 3,
    sanskritName: "Sahaja Bhava",
    englishName: "Courage & Effort",
    nameKey: "reading.houseNames.h3",
    themeKey: "reading.houseThemes.h3",
    bodyPartsKey: "reading.houseBody.h3",
    naturalElement: "air"
  },
  {
    house: 4,
    sanskritName: "Matru & Sukha Bhava",
    englishName: "Mother & Happiness",
    nameKey: "reading.houseNames.h4",
    themeKey: "reading.houseThemes.h4",
    bodyPartsKey: "reading.houseBody.h4",
    naturalElement: "water"
  },
  {
    house: 5,
    sanskritName: "Putra Bhava",
    englishName: "Creativity & Children",
    nameKey: "reading.houseNames.h5",
    themeKey: "reading.houseThemes.h5",
    bodyPartsKey: "reading.houseBody.h5",
    naturalElement: "fire"
  },
  {
    house: 6,
    sanskritName: "Ari Bhava",
    englishName: "Obstacles & Service",
    nameKey: "reading.houseNames.h6",
    themeKey: "reading.houseThemes.h6",
    bodyPartsKey: "reading.houseBody.h6",
    naturalElement: "earth"
  },
  {
    house: 7,
    sanskritName: "Yuvati Bhava",
    englishName: "Partnerships & Marriage",
    nameKey: "reading.houseNames.h7",
    themeKey: "reading.houseThemes.h7",
    bodyPartsKey: "reading.houseBody.h7",
    naturalElement: "air"
  },
  {
    house: 8,
    sanskritName: "Randhra Bhava",
    englishName: "Transformation & Longevity",
    nameKey: "reading.houseNames.h8",
    themeKey: "reading.houseThemes.h8",
    bodyPartsKey: "reading.houseBody.h8",
    naturalElement: "water"
  },
  {
    house: 9,
    sanskritName: "Dharma Bhava",
    englishName: "Fortune & Higher Knowledge",
    nameKey: "reading.houseNames.h9",
    themeKey: "reading.houseThemes.h9",
    bodyPartsKey: "reading.houseBody.h9",
    naturalElement: "fire"
  },
  {
    house: 10,
    sanskritName: "Karma Bhava",
    englishName: "Career & Public Action",
    nameKey: "reading.houseNames.h10",
    themeKey: "reading.houseThemes.h10",
    bodyPartsKey: "reading.houseBody.h10",
    naturalElement: "earth"
  },
  {
    house: 11,
    sanskritName: "Labha Bhava",
    englishName: "Gains & Desires",
    nameKey: "reading.houseNames.h11",
    themeKey: "reading.houseThemes.h11",
    bodyPartsKey: "reading.houseBody.h11",
    naturalElement: "air"
  },
  {
    house: 12,
    sanskritName: "Vyaya Bhava",
    englishName: "Losses & Liberation",
    nameKey: "reading.houseNames.h12",
    themeKey: "reading.houseThemes.h12",
    bodyPartsKey: "reading.houseBody.h12",
    naturalElement: "water"
  }
];

export const houseMeta = (house: number): SouthIndianHouseMeta =>
  SOUTH_INDIAN_HOUSES.find((h) => h.house === house) ?? SOUTH_INDIAN_HOUSES[0]!;
