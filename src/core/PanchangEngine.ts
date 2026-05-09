import SunCalc from "suncalc";
import { degreeToNakshatra, getAyanamsa, normalizeDegree } from "./AstroMath";
import type { PanchangOutput } from "./AstroTypes";

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

const formatTime = (d?: Date): string => (d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--");

export const calculatePanchang = (date: Date, lat: number, lng: number): PanchangOutput => {
  const times = SunCalc.getTimes(date, lat, lng);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  const ayanamsa = getAyanamsa(date);
  const daysFromEpoch = (date.getTime() - Date.UTC(2000, 0, 1)) / 86400000;

  const sunLong = normalizeDegree(280.46 + 0.9856474 * daysFromEpoch - ayanamsa);
  const moonLong = normalizeDegree(218.316 + 13.176396 * daysFromEpoch - ayanamsa);

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

