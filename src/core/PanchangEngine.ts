import SunCalc from "suncalc";
import * as Astronomy from "astronomy-engine";
import { degreeToNakshatra, getAyanamsa, normalizeDegree } from "./AstroMath";
import type { AyanamsaModel, PanchangOutput } from "./AstroTypes";
import { panchangClockTimeZone } from "./placeTime";

const TITHIS = [
  "Pratipada",
  "Dvitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
  "Pratipada",
  "Dvitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Amavasya"
];

const YOGAS = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shoola",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti"
];

const KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"];

export type PanchangCalcOptions = {
  /** BCP 47 locale for numeric time formatting */
  locale?: string;
  /** IANA zone for sunrise/sunset labels (overrides auto when set) */
  clockTimeZone?: string;
  /** Indian PIN etc. — drives IST when postal lat/lng are missing */
  pincode?: string;
  /** Sidereal zero-point: default Drik Gaṇita (True Spica 180°). */
  ayanamsaModel?: AyanamsaModel;
};

export const calculatePanchang = (date: Date, lat: number, lng: number, opts?: PanchangCalcOptions): PanchangOutput => {
  const locale = opts?.locale ?? "en-IN";
  const clockTz = opts?.clockTimeZone ?? panchangClockTimeZone(lat, lng, opts?.pincode ?? "");
  const formatTime = (d?: Date): string =>
    d
      ? d.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: clockTz
        })
      : "--:--";

  const times = SunCalc.getTimes(date, lat, lng);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  const ayanamsa = getAyanamsa(date, opts?.ayanamsaModel ?? "lahiri");

  const sunTropical = normalizeDegree(Astronomy.SunPosition(date).elon);
  const moonTropical = normalizeDegree(Astronomy.EclipticGeoMoon(date).lon);
  const sunLong = normalizeDegree(sunTropical - ayanamsa);
  const moonLong = normalizeDegree(moonTropical - ayanamsa);

  const tithiIdx = Math.floor(normalizeDegree(moonLong - sunLong) / 12) % 30;
  const yogaIdx = Math.floor(normalizeDegree(moonLong + sunLong) / (360 / 27)) % 27;
  const karanaIdx = Math.floor((tithiIdx * 2) % KARANAS.length);
  const paksha = tithiIdx < 15 ? "Shukla" : "Krishna";
  const nakshatra = degreeToNakshatra(moonLong);

  return {
    tithi: TITHIS[tithiIdx],
    nakshatra: nakshatra.english,
    yoga: YOGAS[yogaIdx],
    karana: KARANAS[karanaIdx],
    paksha,
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
    moonrise: formatTime(moonTimes.rise ?? undefined)
  };
};
