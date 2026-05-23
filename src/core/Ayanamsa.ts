import type { AyanamsaModel } from "./AstroTypes";
import { lahiriAyanamsaDegrees } from "./LahiriAyanamsa";
import { trueChitrapakshaAyanamsaDegrees } from "./DrikGanitaAyanamsa";

const jdUt = (d: Date): number => d.getTime() / 86400000 + 2440587.5;

export const ayanamsaForModel = (date: Date, model: AyanamsaModel): number =>
  model === "lahiri" ? lahiriAyanamsaDegrees(jdUt(date)) : trueChitrapakshaAyanamsaDegrees(date);
