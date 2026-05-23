import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const locales = ["kn", "hi", "te", "ta"];

/** Sanskrit gotra id → localized label (gotra suffix added in locale). */
const KN = {
  Agastya: "ಅಗಸ್ತ್ಯ ಗೋತ್ರ",
  Angirasa: "ಅಂಗಿರಸ ಗೋತ್ರ",
  Atreya: "ಆತ್ರೇಯ ಗೋತ್ರ",
  Atri: "ಅತ್ರಿ ಗೋತ್ರ",
  Aupamanyava: "ಔಪಮನ್ಯವ ಗೋತ್ರ",
  Bharadvaja: "ಭರದ್ವಾಜ ಗೋತ್ರ",
  Bhargava: "ಭಾರ್ಗವ ಗೋತ್ರ",
  Chyavana: "ಚ್ಯವನ ಗೋತ್ರ",
  Dhananjaya: "ಧನಂಜಯ ಗೋತ್ರ",
  Galava: "ಗಾಲವ ಗೋತ್ರ",
  Garga: "ಗಾರ್ಗ್ಯ ಗೋತ್ರ",
  Gautama: "ಗೌತಮ ಗೋತ್ರ",
  Gargya: "ಗಾರ್ಗ್ಯ ಗೋತ್ರ",
  Harita: "ಹಾರಿತ ಗೋತ್ರ",
  Jamadagni: "ಜಮದಗ್ನಿ ಗೋತ್ರ",
  Kanva: "ಕಣ್ವ ಗೋತ್ರ",
  Kapi: "ಕಪಿ ಗೋತ್ರ",
  Kashyapa: "ಕಶ್ಯಪ ಗೋತ್ರ",
  Katyayana: "ಕಾತ್ಯಾಯನ ಗೋತ್ರ",
  Kaushika: "ಕೌಶಿಕ ಗೋತ್ರ",
  Kaundinya: "ಕೌಂಡಿನ್ಯ ಗೋತ್ರ",
  Krishnatreya: "ಕೃಷ್ಣಾತ್ರೇಯ ಗೋತ್ರ",
  Kutsa: "ಕುತ್ಸ ಗೋತ್ರ",
  Lohita: "ಲೋಹಿತ ಗೋತ್ರ",
  Maitreya: "ಮೈತ್ರೇಯ ಗೋತ್ರ",
  Mandavya: "ಮಾಂಡವ್ಯ ಗೋತ್ರ",
  Marichi: "ಮರೀಚಿ ಗೋತ್ರ",
  Maudgalya: "ಮೌದ್ಗಲ್ಯ ಗೋತ್ರ",
  Naidhruva: "ನೈಧ್ರುವ ಗೋತ್ರ",
  Parashara: "ಪರಾಶರ ಗೋತ್ರ",
  Parthiva: "ಪಾರ್ಥಿವ ಗೋತ್ರ",
  Pulaha: "ಪುಲಹ ಗೋತ್ರ",
  Pulastya: "ಪುಲಸ್ತ್ಯ ಗೋತ್ರ",
  Rohita: "ರೋಹಿತ ಗೋತ್ರ",
  Sandilya: "ಸಾಂಡಿಲ್ಯ ಗೋತ್ರ",
  Shandilya: "ಶಾಂಡಿಲ್ಯ ಗೋತ್ರ",
  Shaunaka: "ಶೌನಕ ಗೋತ್ರ",
  Shunaksha: "ಶುನಕ್ಷ ಗೋತ್ರ",
  Upamanyu: "ಉಪಮನ್ಯು ಗೋತ್ರ",
  Vadhula: "ವಧೂಲ ಗೋತ್ರ",
  Vadula: "ವದೂಲ ಗೋತ್ರ",
  Valmiki: "ವಾಲ್ಮೀಕಿ ಗೋತ್ರ",
  Vasishtha: "ವಶಿಷ್ಠ ಗೋತ್ರ",
  Vatsa: "ವತ್ಸ ಗೋತ್ರ",
  Vishnu: "ವಿಷ್ಣು ಗೋತ್ರ",
  Vishnuvriddha: "ವಿಷ್ಣುವೃದ್ಧ ಗೋತ್ರ",
  Vishvamitra: "ವಿಶ್ವಾಮಿತ್ರ ಗೋತ್ರ"
};

const HI = Object.fromEntries(
  Object.entries(KN).map(([k, v]) => [k, v.replace(/ಗೋತ್ರ/g, "गोत्र").replace(/[\u0C80-\u0CFF]/g, (c) => {
    const map = { "ಅ": "अ", "ಆ": "आ", "ಇ": "इ", "ಈ": "ई", "ಉ": "उ", "ಊ": "ऊ", "ಋ": "ऋ", "ಎ": "ए", "ಏ": "ए", "ಐ": "ऐ", "ಒ": "ओ", "ಓ": "ओ", "ಔ": "औ", "ಕ": "क", "ಖ": "ख", "ಗ": "ग", "ಘ": "घ", "ಙ": "ङ", "ಚ": "च", "ಛ": "छ", "ಜ": "ज", "ಝ": "झ", "ಞ": "ञ", "ಟ": "ट", "ಠ": "ठ", "ಡ": "ड", "ಢ": "ढ", "ಣ": "ण", "ತ": "त", "ಥ": "थ", "ದ": "द", "ಧ": "ध", "ನ": "न", "ಪ": "प", "ಫ": "फ", "ಬ": "ब", "ಭ": "भ", "ಮ": "म", "ಯ": "य", "ರ": "र", "ಲ": "ल", "ವ": "व", "ಶ": "श", "ಷ": "ष", "ಸ": "स", "ಹ": "ह", "ಳ": "ळ", "ೞ": "क्ष", "ೠ": "ॠ", "ಂ": "ं", "ಃ": "ः", "್": "" };
    return map[c] ?? c;
  })])
);

// Simpler: use Devanagari transliteration for HI from English keys
const hiLabels = {
  Vasishtha: "वशिष्ठ गोत्र",
  Angirasa: "अंगिरस गोत्र",
  Vishvamitra: "विश्वामित्र गोत्र",
  Kashyapa: "कश्यप गोत्र",
  Bharadvaja: "भरद्वाज गोत्र",
  Gautama: "गौतम गोत्र",
  Atri: "अत्रि गोत्र",
  Jamadagni: "जमदग्नि गोत्र",
  Agastya: "अगस्त्य गोत्र"
};

const en = JSON.parse(readFileSync(`${root}/src/i18n/locales/en.json`, "utf8"));
const gotraKeys = Object.keys(en.gotras ?? {});

for (const loc of locales) {
  const path = `${root}/src/i18n/locales/${loc}.json`;
  const data = JSON.parse(readFileSync(path, "utf8"));
  const out = {};
  for (const key of gotraKeys) {
    if (loc === "kn" && KN[key.replace(/\s+/g, "")]) {
      out[key] = KN[key.replace(/\s+/g, "")];
    } else if (loc === "hi" && hiLabels[key.replace(/\s+/g, "")]) {
      out[key] = hiLabels[key.replace(/\s+/g, "")];
    } else if (loc === "kn") {
      out[key] = KN[key] ?? en.gotras[key];
    } else {
      out[key] = en.gotras[key];
    }
  }
  data.gotras = out;
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Updated ${loc} gotras (${Object.keys(out).length} keys)`);
}
