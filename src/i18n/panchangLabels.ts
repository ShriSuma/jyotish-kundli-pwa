import type { TFunction } from "i18next";
import { NAKSHATRAS } from "../core/AstroTypes";

/** Engine / PanchangEngine uses these English spellings. */
const KN_TITHI: Record<string, string> = {
  Pratipada: "ಪ್ರತಿಪದೆ",
  Dvitiya: "ದ್ವಿತೀಯ",
  Tritiya: "ತೃತೀಯ",
  Chaturthi: "ಚತುರ್ಥಿ",
  Panchami: "ಪಂಚಮಿ",
  Shashthi: "ಷಷ್ಠಿ",
  Saptami: "ಸಪ್ತಮಿ",
  Ashtami: "ಅಷ್ಟಮಿ",
  Navami: "ನವಮಿ",
  Dashami: "ದಶಮಿ",
  Ekadashi: "ಏಕಾದಶಿ",
  Dwadashi: "ದ್ವಾದಶಿ",
  Trayodashi: "ತ್ರಯೋದಶಿ",
  Chaturdashi: "ಚತುರ್ದಶಿ",
  Purnima: "ಹುಣ್ಣಿಮೆ",
  Amavasya: "ಅಮಾವಾಸ್ಯೆ"
};

const KN_YOGA: Record<string, string> = {
  Vishkambha: "ವಿಷ್ಕಂಭ",
  Priti: "ಪ್ರೀತಿ",
  Ayushman: "ಆಯುಷ್ಮಾನ್",
  Saubhagya: "ಸೌಭಾಗ್ಯ",
  Shobhana: "ಶೋಭನ",
  Atiganda: "ಅತಿಗಂಡ",
  Sukarma: "ಸುಕರ್ಮ",
  Dhriti: "ಧೃತಿ",
  Shoola: "ಶೂಲ",
  Ganda: "ಗಂಡ",
  Vriddhi: "ವೃದ್ಧಿ",
  Dhruva: "ಧ್ರುವ",
  Vyaghata: "ವ್ಯಾಘಾತ",
  Harshana: "ಹರ್ಷಣ",
  Vajra: "ವಜ್ರ",
  Siddhi: "ಸಿದ್ಧಿ",
  Vyatipata: "ವ್ಯತೀಪಾತ",
  Variyana: "ವರಿಯಾನ",
  Parigha: "ಪರಿಘ",
  Shiva: "ಶಿವ",
  Siddha: "ಸಿದ್ಧ",
  Sadhya: "ಸಾಧ್ಯ",
  Shubha: "ಶುಭ",
  Shukla: "ಶುಕ್ಲ",
  Brahma: "ಬ್ರಹ್ಮ",
  Indra: "ಇಂದ್ರ",
  Vaidhriti: "ವೈಧೃತಿ"
};

const KN_KARANA: Record<string, string> = {
  Bava: "ಬವ",
  Balava: "ಬಾಲವ",
  Kaulava: "ಕೌಲವ",
  Taitila: "ತೈತಿಲ",
  Garaja: "ಗರಜ",
  Vanija: "ವಣಿಜ",
  Vishti: "ವಿಷ್ಟಿ (ಭದ್ರ)"
};

const KN_PAKSHA: Record<string, string> = {
  Shukla: "ಶುಕ್ಲ ಪಕ್ಷ",
  Krishna: "ಕೃಷ್ಣ ಪಕ್ಷ"
};

const nakKeyForEnglish = (english: string): string => {
  const n = NAKSHATRAS.find((x) => x.english === english);
  if (n) return n.sanskrit.replace(/\s+/g, "");
  return english.replace(/\s+/g, "");
};

export const localizePanchangTithi = (lang: string, raw: string): string | null => {
  if (lang.startsWith("kn")) return KN_TITHI[raw] ?? null;
  return null;
};

export const localizePanchangYoga = (lang: string, raw: string): string | null => {
  if (lang.startsWith("kn")) return KN_YOGA[raw] ?? null;
  return null;
};

export const localizePanchangKarana = (lang: string, raw: string): string | null => {
  if (lang.startsWith("kn")) return KN_KARANA[raw] ?? null;
  return null;
};

export const localizePanchangPaksha = (lang: string, raw: string): string | null => {
  if (lang.startsWith("kn")) return KN_PAKSHA[raw] ?? null;
  return null;
};

export const localizePanchangNakshatra = (t: TFunction, rawEnglish: string): string => {
  const key = nakKeyForEnglish(rawEnglish);
  const translated = t(`nakshatras.${key}` as "nakshatras.Ashwini");
  return translated === `nakshatras.${key}` ? rawEnglish : translated;
};

export const displayPanchangValue = (
  kind: "tithi" | "yoga" | "karana" | "paksha" | "nakshatra",
  raw: string,
  lang: string,
  t: TFunction
): string => {
  if (kind === "nakshatra") return localizePanchangNakshatra(t, raw);
  const map =
    kind === "tithi"
      ? localizePanchangTithi(lang, raw)
      : kind === "yoga"
        ? localizePanchangYoga(lang, raw)
        : kind === "karana"
          ? localizePanchangKarana(lang, raw)
          : localizePanchangPaksha(lang, raw);
  return map ?? raw;
};
