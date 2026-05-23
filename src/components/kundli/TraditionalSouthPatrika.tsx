import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import html2canvas from "html2canvas";
import type { AyanamsaModel, KundliOutput, PlanetName, PlanetPosition, Rashi } from "../../core/AstroTypes";
import { RASHIS } from "../../core/AstroTypes";
import { calculatePanchang } from "../../core/PanchangEngine";
import { wallClockBirthToUtc } from "../../core/birthTime";
import {
  calendarYmdForPanchangPin,
  civilTimeZoneForPanchangHeader,
  clockLocaleFromUiLang,
  formatClockAtPlace,
  panchangSolarAnchorDate
} from "../../core/placeTime";
import { fetchSunriseSunsetUtc } from "../../core/sunriseSunsetApi";
import { patrikaMetaForNakshatraIndex } from "../../core/nakshatraPatrikaMeta";
import { getCellForRashiIndex } from "./southIndianLayout";
import SunCalc from "suncalc";
import { vimshottariBalanceAtBirth, vimshottariBalanceYmdPatrika } from "../../core/DashaBhuktiEngine";
import { ghatiVighatiSinceSunrise } from "../../core/ghatiVighati";
import { formatChartHouseNumber, formatGhatiVighati, formatPatrikaAmshaOnly, patrikaMaandiBracket } from "../../core/localeNumbers";

type Props = {
  kundli: KundliOutput;
  personName: string;
  gothra?: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  placeLabel: string;
  pincode?: string;
  /** Sidereal anchor for header panchānga line (matches chart). */
  ayanamsaModel?: AyanamsaModel;
};

const rashiTKey = (sanskrit: string): string => `rashis.${sanskrit.replace(/\s+/g, "")}`;
const nakSanTKey = (sanskrit: string): string => `nakshatras.${sanskrit.replace(/\s+/g, "")}`;

export default function TraditionalSouthPatrika({
  kundli,
  personName,
  gothra,
  birthDate,
  birthTime,
  latitude,
  longitude,
  placeLabel,
  pincode,
  ayanamsaModel
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const ayanModel = ayanamsaModel ?? "lahiri";
  const exportRef = useRef<HTMLDivElement>(null);
  const pin = pincode?.trim() ?? "";

  const lagnaIdx = kundli.lagnaRashi.index;
  const dashaBal = useMemo(() => vimshottariBalanceAtBirth(kundli), [kundli]);
  const dashaBalYmd = useMemo(() => vimshottariBalanceYmdPatrika(dashaBal.balanceYears), [dashaBal.balanceYears]);

  const byRashi = useMemo(() => {
    const map = new Map<number, PlanetPosition[]>();
    for (const p of kundli.planets) {
      const arr = map.get(p.rashi.index) ?? [];
      arr.push(p);
      map.set(p.rashi.index, arr);
    }
    return map;
  }, [kundli.planets]);

  const moon = kundli.planets.find((p) => p.name === ("Moon" as PlanetName));

  const { panchang, sunRise, sunSet, headerDate, metaKn } = useMemo(() => {
    const noonUtc = wallClockBirthToUtc(birthDate, "12:00", latitude, longitude);
    const anchor = panchangSolarAnchorDate(noonUtc, latitude, longitude, pin);
    const clockLoc = clockLocaleFromUiLang(i18n.language);
    const p = calculatePanchang(anchor, latitude, longitude, {
      locale: clockLoc,
      pincode: pin,
      ayanamsaModel: ayanModel
    });
    const tz = civilTimeZoneForPanchangHeader(latitude, longitude, pin);
    const hdr = anchor.toLocaleDateString(i18n.language === "kn" ? "kn-IN" : i18n.language, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: tz
    });
    const times = SunCalc.getTimes(anchor, latitude, longitude);
    const sr = formatClockAtPlace(times.sunrise, clockLoc, latitude, longitude, pin);
    const ss = formatClockAtPlace(times.sunset, clockLoc, latitude, longitude, pin);
    return { panchang: p, sunRise: sr, sunSet: ss, headerDate: hdr, metaKn: i18n.language.startsWith("kn") };
  }, [birthDate, latitude, longitude, pin, i18n.language, ayanModel]);

  /** USNO-style times (same as Home) — matches printed panchānga better than SunCalc alone. */
  const [apiSunClock, setApiSunClock] = useState<{ rise: string; set: string } | null>(null);
  useEffect(() => {
    setApiSunClock(null);
    let cancelled = false;
    const noonUtc = wallClockBirthToUtc(birthDate, "12:00", latitude, longitude);
    const ymd = calendarYmdForPanchangPin(noonUtc, latitude, longitude, pin);
    const clockLoc = clockLocaleFromUiLang(i18n.language);
    void fetchSunriseSunsetUtc(latitude, longitude, ymd).then((api) => {
      if (cancelled || !api) return;
      setApiSunClock({
        rise: formatClockAtPlace(api.sunrise, clockLoc, latitude, longitude, pin),
        set: formatClockAtPlace(api.sunset, clockLoc, latitude, longitude, pin)
      });
    });
    return () => {
      cancelled = true;
    };
  }, [birthDate, latitude, longitude, pin, i18n.language]);

  const displaySunrise = kundli.birthSunTimes?.sunrise ?? apiSunClock?.rise ?? sunRise;
  const displaySunset = kundli.birthSunTimes?.sunset ?? apiSunClock?.set ?? sunSet;

  const ghatiSinceSunrise = useMemo(() => {
    const birthUtc = wallClockBirthToUtc(birthDate, birthTime, latitude, longitude);
    let sunriseUtc: Date;
    if (kundli.birthSunTimes?.sunriseUtc) {
      sunriseUtc = new Date(kundli.birthSunTimes.sunriseUtc);
    } else {
      const noonUtc = wallClockBirthToUtc(birthDate, "12:00", latitude, longitude);
      const anchor = panchangSolarAnchorDate(noonUtc, latitude, longitude, pin);
      sunriseUtc = SunCalc.getTimes(anchor, latitude, longitude).sunrise;
    }
    return ghatiVighatiSinceSunrise(birthUtc, sunriseUtc);
  }, [birthDate, birthTime, latitude, longitude, pin, kundli.birthSunTimes?.sunriseUtc]);

  const meta = patrikaMetaForNakshatraIndex(moon?.nakshatra.index ?? 0);
  const yoniVal = metaKn ? meta.yoniKn : meta.yoniEn;
  const ganaVal = metaKn ? meta.ganaKn : meta.ganaEn;
  const nadiVal = metaKn ? meta.nadiKn : meta.nadiEn;

  const onDownloadPng = async () => {
    const el = exportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fbf6e8",
      logging: false
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `patrike-${(personName || "kundli").replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const cellStyle = (rashi: Rashi): CSSProperties => {
    const c = getCellForRashiIndex(rashi.index);
    return {
      gridColumn: c.col + 1,
      gridRow: c.row + 1
    };
  };

  const centerStyle: CSSProperties = { gridColumn: "2 / 4", gridRow: "2 / 4" };

  const labelRow = (labelKey: string, value: string) => (
    <div className="flex gap-1 border-b border-black/10 py-0.5 text-[11px] leading-tight">
      <span className="shrink-0 font-semibold text-black">{t(labelKey as "kundli.patrikaName")} :</span>
      <span className="jk-patrika-ink min-w-0 flex-1 font-medium">{value || "—"}</span>
    </div>
  );

  return (
    <div className="mt-6 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-indigo-950">{t("kundli.patrikaTitle")}</h3>
        <button
          type="button"
          className="jk-btn rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-950"
          onClick={() => void onDownloadPng()}
        >
          {t("kundli.patrikaDownloadPatrike")}
        </button>
      </div>
      <p className="text-xs text-slate-600">{t("kundli.patrikaNote")}</p>

      <div
        ref={exportRef}
        className="jk-patrika-root mx-auto max-w-lg overflow-hidden rounded-sm border-[3px] border-double border-neutral-900 bg-[#fbf6e8] p-3 shadow-sm"
        style={{
          fontFamily: "'Noto Serif Kannada','Noto Sans Kannada',Georgia,serif"
        }}
      >
        <div
          className="border border-neutral-900 p-2"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 5px,
              rgba(0,0,0,0.06) 5px,
              rgba(0,0,0,0.06) 6px
            )`
          }}
        >
          <div className="mb-2 flex items-center justify-center gap-2 border-b border-black/20 pb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black text-[11px]">ॐ</span>
            <p className="text-center text-[12px] font-semibold text-black">{t("kundli.patrikaTitle")}</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black text-[11px]">ॐ</span>
          </div>

          <div className="space-y-1 text-[10px] leading-snug text-black">
            <p>
              <span className="font-semibold">{t("kundli.patrikaBirthLine")}:</span>{" "}
              <span className="jk-patrika-ink">
                {headerDate} · {birthTime}
              </span>
            </p>
            <p>
              <span className="font-semibold">{t("kundli.patrikaPlace")}:</span>{" "}
              <span className="jk-patrika-ink">{placeLabel}</span>
            </p>
            <p>
              {t("panchang.tithi")}: <span className="jk-patrika-ink">{panchang.tithi}</span> · {t("panchang.paksha")}:{" "}
              <span className="jk-patrika-ink">{panchang.paksha}</span> · {t("panchang.nakshatra")}:{" "}
              <span className="jk-patrika-ink">{panchang.nakshatra}</span>
            </p>
            <p>
              {t("panchang.yoga")}: <span className="jk-patrika-ink">{panchang.yoga}</span> · {t("panchang.karana")}:{" "}
              <span className="jk-patrika-ink">{panchang.karana}</span>
            </p>
            <p>
              {t("panchang.sunrise")}: <span className="jk-patrika-ink">{displaySunrise}</span> · {t("panchang.sunset")}:{" "}
              <span className="jk-patrika-ink">{displaySunset}</span>
            </p>
            <p>
              <span className="font-semibold">{t("kundli.patrikaGhatiSinceSunrise")}:</span>{" "}
              <span className="jk-patrika-ink">
                {formatGhatiVighati(ghatiSinceSunrise.ghati, ghatiSinceSunrise.vighati, i18n.language)}{" "}
                {t("kundli.patrikaGhatiUnit")}
              </span>
            </p>
            <p>
              <span className="font-semibold">{t("kundli.patrikaLagna")}:</span>{" "}
              <span className="jk-patrika-ink">{t(rashiTKey(kundli.lagnaRashi.sanskrit) as "rashis.Mesha")}</span>
            </p>
            <p>
              <span className="font-semibold">{t("kundli.dashaBalanceAtBirth")}</span>{" "}
              <span className="jk-patrika-ink">
                {t(`planets.${dashaBal.lord}` as "planets.Sun")}{" "}
                {t("kundli.dashaBalanceYmd", {
                  years: dashaBalYmd.y,
                  months: dashaBalYmd.m,
                  days: dashaBalYmd.d
                })}
              </span>
            </p>
          </div>

          <div className="relative mt-3">
            <div
              className="absolute left-0 top-[8%] z-10 max-w-[1.1rem] text-[8px] font-semibold leading-tight text-black"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {t("kundli.patrikaSunsetSide")}
            </div>
            <div
              className="absolute left-0 bottom-[8%] z-10 max-w-[1.1rem] text-[8px] font-semibold leading-tight text-black"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {t("kundli.patrikaSunriseSide")}
            </div>
            <div
              className="absolute right-0 top-[6%] z-10 max-w-[1rem] text-[8px] font-semibold leading-tight text-black"
              style={{ writingMode: "vertical-rl" }}
            >
              {t("kundli.patrikaSolar")}
            </div>
            <div
              className="absolute right-0 top-[42%] z-10 max-w-[1rem] text-[8px] font-semibold leading-tight text-black"
              style={{ writingMode: "vertical-rl" }}
            >
              {t("kundli.patrikaMonth")}
            </div>
            <div
              className="absolute right-0 bottom-[6%] z-10 max-w-[1rem] text-[8px] font-semibold leading-tight text-black"
              style={{ writingMode: "vertical-rl" }}
            >
              {t("kundli.patrikaBirthDate")}
            </div>

            <div
              className="mx-auto grid aspect-square w-full max-w-[340px] grid-cols-4 grid-rows-4 border border-black bg-[#fbf6e8]"
              style={{ marginLeft: "1.1rem", marginRight: "1rem" }}
            >
              {RASHIS.map((rashi) => {
                const planetsHere = byRashi.get(rashi.index) ?? [];
                const c = getCellForRashiIndex(rashi.index);
                const lang = i18n.language;
                const cells: JSX.Element[] = [];
                if (rashi.index === lagnaIdx) {
                  cells.push(
                    <span key="lagna" className="jk-patrika-ink block">
                      {t("kundli.lagnaPatrika")} {formatPatrikaAmshaOnly(kundli.ascendant, lang)}
                    </span>
                  );
                }
                for (const pl of planetsHere) {
                  cells.push(
                    <span key={pl.name} className="jk-patrika-ink block">
                      {t(`planets.${pl.name}` as "planets.Sun")} {formatPatrikaAmshaOnly(pl.degree, lang)}
                    </span>
                  );
                }
                if (kundli.maandi && kundli.maandi.rashi.index === rashi.index) {
                  cells.push(
                    <span key="maandi" className="jk-patrika-ink block">
                      {t("kundli.maandiShort")}{" "}
                      ({formatChartHouseNumber(patrikaMaandiBracket(kundli.maandi.rashi.index), lang)})
                    </span>
                  );
                }
                return (
                  <div
                    key={rashi.index}
                    data-rashi={rashi.index}
                    className={`flex flex-col border-r border-b border-black p-1 ${c.row === 0 ? "border-t" : ""} ${c.col === 0 ? "border-l" : ""}`}
                    style={cellStyle(rashi)}
                  >
                    <span className="text-[7px] font-semibold uppercase tracking-wide text-neutral-500">
                      {t(rashiTKey(rashi.sanskrit) as "rashis.Mesha")}
                    </span>
                    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 text-center text-[11px] font-semibold leading-tight">
                      {cells}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col border border-black bg-[#fdfaf0] p-2" style={centerStyle}>
                <div className="flex min-h-0 flex-1 flex-col justify-center text-[11px]">
                  {labelRow("kundli.patrikaName", personName)}
                  {labelRow(
                    "kundli.patrikaNakshatra",
                    moon ? t(nakSanTKey(moon.nakshatra.sanskrit) as "nakshatras.Ashwini") : "—"
                  )}
                  {labelRow("kundli.patrikaRashi", t(rashiTKey(kundli.moonSign.sanskrit) as "rashis.Mesha"))}
                  {labelRow("kundli.patrikaGotra", gothra ?? "")}
                  {labelRow("kundli.patrikaPada", String(kundli.moonPada))}
                </div>
              </div>
            </div>

            <div
              className="mx-auto mt-1 grid max-w-[340px] grid-cols-3 gap-1 border-t border-black/30 pt-1 text-center text-[9px] text-black"
              style={{ marginLeft: "1.1rem", marginRight: "1rem" }}
            >
              <div>
                <span className="font-semibold">{t("kundli.patrikaYoni")}</span>
                <div className="jk-patrika-ink font-medium">{yoniVal}</div>
              </div>
              <div>
                <span className="font-semibold">{t("kundli.patrikaGana")}</span>
                <div className="jk-patrika-ink font-medium">{ganaVal}</div>
              </div>
              <div>
                <span className="font-semibold">{t("kundli.patrikaNadi")}</span>
                <div className="jk-patrika-ink font-medium">{nadiVal}</div>
              </div>
            </div>

            <p className="mt-1 text-center text-[8px] text-neutral-600">
              {t("kundli.patrikaSunsetSide")}: {displaySunset} · {t("kundli.patrikaSunriseSide")}: {displaySunrise}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
