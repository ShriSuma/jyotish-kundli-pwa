import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const GOTRA_OPTIONS = [
  "Agastya",
  "Angirasa",
  "Atreya",
  "Atri",
  "Aupamanyava",
  "Bharadvaja",
  "Bhargava",
  "Chyavana",
  "Dhananjaya",
  "Galava",
  "Garga",
  "Gautama",
  "Gargya",
  "Harita",
  "Jamadagni",
  "Kanva",
  "Kapi",
  "Kashyapa",
  "Katyayana",
  "Kaushika",
  "Kaundinya",
  "Krishnatreya",
  "Kutsa",
  "Lohita",
  "Maitreya",
  "Mandavya",
  "Marichi",
  "Maudgalya",
  "Naidhruva",
  "Parashara",
  "Parthiva",
  "Pulaha",
  "Pulastya",
  "Rohita",
  "Sandilya",
  "Shandilya",
  "Shaunaka",
  "Shunaksha",
  "Upamanyu",
  "Vadhula",
  "Vadula",
  "Valmiki",
  "Vasishtha",
  "Vatsa",
  "Vishnu",
  "Vishnuvriddha",
  "Vishvamitra"
];

const enPath = fileURLToPath(new URL("../src/i18n/locales/en.json", import.meta.url));
const en = JSON.parse(readFileSync(enPath, "utf8"));
const gotras = {};
for (const id of GOTRA_OPTIONS) {
  gotras[id.replace(/\s+/g, "")] = `${id} gotra`;
}
en.gotras = gotras;
writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, "utf8");
console.log(`Added ${GOTRA_OPTIONS.length} gotras`);
