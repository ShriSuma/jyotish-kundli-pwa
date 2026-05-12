/**
 * Traditional Yoni / Gana / Nadi labels by moon nakshatra index (0 = Ashwini … 26 = Revati).
 * Used for print-style patrike; many regional variants exist.
 */

export type PatrikaNakMeta = {
  yoniKn: string;
  yoniEn: string;
  ganaKn: string;
  ganaEn: string;
  nadiKn: string;
  nadiEn: string;
};

/** One row per nakshatra index 0–26 */
export const PATRIKA_NAKSHATRA_META: PatrikaNakMeta[] = [
  { yoniKn: "ಕುದುರೆ", yoniEn: "Horse", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಆನೆ", yoniEn: "Elephant", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹುಲಿ", yoniEn: "Sheep", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಹಸು", yoniEn: "Serpent", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹುಲಿ", yoniEn: "Serpent", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ನಾಯಿ", yoniEn: "Dog", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಬೆಕ್ಕು", yoniEn: "Cat", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹಸು", yoniEn: "Sheep", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹಾವು", yoniEn: "Cat", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಹುಲಿ", yoniEn: "Rat", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹುಲಿ", yoniEn: "Rat", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹುಲಿ", yoniEn: "Cow", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಹಸು", yoniEn: "Buffalo", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹುಲಿ", yoniEn: "Tiger", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹರಿಣ", yoniEn: "Buffalo", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಹರಿಣ", yoniEn: "Tiger", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹರಿಣ", yoniEn: "Deer", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹರಿಣ", yoniEn: "Deer", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ನಾಯಿ", yoniEn: "Dog", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹಾವು", yoniEn: "Monkey", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ನಾಯಿ", yoniEn: "Mongoose", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಹಾವು", yoniEn: "Monkey", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹಸು", yoniEn: "Lion", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹಸು", yoniEn: "Horse", ganaKn: "ರಾಕ್ಷಸ", ganaEn: "Rakshasa", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" },
  { yoniKn: "ಹಸು", yoniEn: "Lion", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಆದಿ", nadiEn: "Adi" },
  { yoniKn: "ಹಸು", yoniEn: "Cow", ganaKn: "ಮಾನವ", ganaEn: "Manushya", nadiKn: "ಮಧ್ಯ", nadiEn: "Madhya" },
  { yoniKn: "ಹಸು", yoniEn: "Elephant", ganaKn: "ದೇವ", ganaEn: "Deva", nadiKn: "ಅಂತ್ಯ", nadiEn: "Antya" }
];

export const patrikaMetaForNakshatraIndex = (index: number): PatrikaNakMeta => {
  const i = ((index % 27) + 27) % 27;
  return PATRIKA_NAKSHATRA_META[i]!;
};
