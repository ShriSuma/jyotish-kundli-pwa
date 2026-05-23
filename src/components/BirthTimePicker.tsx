import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatWallClockHm } from "../core/birthTime";

type Props = {
  /** HH:mm at birthplace (IST for India). */
  value: string;
  onChange: (hm: string) => void;
  id?: string;
  /** Shown above fields, e.g. "Birth time (IST)". */
  zoneHint?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function BirthTimePicker({ value, onChange, id, zoneHint }: Props): JSX.Element {
  const { t } = useTranslation();
  const parsed = useMemo(() => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!m) return { hour: 9, minute: 0 };
    return { hour: Number(m[1]), minute: Number(m[2]) };
  }, [value]);

  const setPart = (hour: number, minute: number) => {
    onChange(formatWallClockHm(hour, minute));
  };

  return (
    <div className="space-y-1">
      {zoneHint ? <p className="text-xs font-medium text-emerald-900/80">{zoneHint}</p> : null}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3" id={id}>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">{t("kundli.birthHour")}</span>
          <select
            className="jk-touch-input min-h-[3rem] w-full rounded-xl border-2 border-emerald-200 bg-white px-3 py-2.5 text-base font-medium text-indigo-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={parsed.hour}
            onChange={(e) => setPart(Number(e.target.value), parsed.minute)}
            aria-label={t("kundli.birthHour")}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">{t("kundli.birthMinute")}</span>
          <select
            className="jk-touch-input min-h-[3rem] w-full rounded-xl border-2 border-emerald-200 bg-white px-3 py-2.5 text-base font-medium text-indigo-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={parsed.minute}
            onChange={(e) => setPart(parsed.hour, Number(e.target.value))}
            aria-label={t("kundli.birthMinute")}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
