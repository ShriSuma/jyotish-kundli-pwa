import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPickerDateLocalYmd } from "../core/birthTime";

const MIN_YEAR = 1900;

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
};

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

const monthLabels = (lang: string): string[] => {
  const code = lang.split("-")[0];
  try {
    return Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(code, { month: "long" }).format(new Date(2000, i, 15))
    );
  } catch {
    return Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2000, i, 15))
    );
  }
};

type ComboProps = {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder: string;
  onSelect: (value: string) => void;
};

function SearchableCombo({ id, label, value, options, disabled, placeholder, onSelect }: ComboProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const display = useMemo(() => {
    if (!value) return "";
    const hit = options.find((o) => o.value === value);
    return hit?.label ?? value;
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.includes(q)).slice(0, 80);
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open, value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : display}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="jk-touch-input min-h-[3rem] w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-3 text-base font-medium text-indigo-950 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
      {open && !disabled && filtered.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-amber-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className="w-full px-3 py-2 text-left text-sm text-indigo-950 hover:bg-amber-50 aria-selected:bg-amber-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function BirthDateCascadePicker({ value, onChange }: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const maxYear = new Date().getFullYear();
  const months = useMemo(() => monthLabels(i18n.language), [i18n.language]);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    if (!value) {
      setYear("");
      setMonth("");
      setDay("");
      return;
    }
    setYear(String(value.getFullYear()));
    setMonth(String(value.getMonth() + 1));
    setDay(String(value.getDate()));
  }, [value]);

  const yearOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let y = maxYear; y >= MIN_YEAR; y--) {
      out.push({ value: String(y), label: String(y) });
    }
    return out;
  }, [maxYear]);

  const monthOptions = useMemo(
    () => months.map((label, i) => ({ value: String(i + 1), label })),
    [months]
  );

  const dayOptions = useMemo(() => {
    const y = Number(year);
    const m = Number(month);
    if (!y || !m) return [];
    const max = daysInMonth(y, m);
    return Array.from({ length: max }, (_, i) => {
      const d = i + 1;
      return { value: String(d), label: String(d) };
    });
  }, [year, month]);

  const emit = (y: string, mo: string, d: string) => {
    const yi = Number(y);
    const mi = Number(mo);
    const di = Number(d);
    if (!yi || !mi || !di) {
      onChange(null);
      return;
    }
    const max = daysInMonth(yi, mi);
    const safeDay = Math.min(di, max);
    onChange(new Date(yi, mi - 1, safeDay, 12, 0, 0, 0));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">{t("kundli.birthDateCascadeHint")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SearchableCombo
          id="birth-year"
          label={t("kundli.birthYear")}
          value={year}
          options={yearOptions}
          placeholder={t("kundli.birthYear")}
          onSelect={(v) => {
            setYear(v);
            setMonth("");
            setDay("");
            emit(v, "", "");
          }}
        />
        <SearchableCombo
          id="birth-month"
          label={t("kundli.birthMonth")}
          value={month}
          options={monthOptions}
          disabled={!year}
          placeholder={t("kundli.birthMonth")}
          onSelect={(v) => {
            setMonth(v);
            setDay("");
            emit(year, v, "");
          }}
        />
        <SearchableCombo
          id="birth-day"
          label={t("kundli.birthDay")}
          value={day}
          options={dayOptions}
          disabled={!year || !month}
          placeholder={t("kundli.birthDay")}
          onSelect={(v) => {
            setDay(v);
            emit(year, month, v);
          }}
        />
      </div>
      {value ? (
        <p className="text-xs font-medium text-indigo-800" data-testid="birth-date-ymd">
          {formatPickerDateLocalYmd(value)}
        </p>
      ) : null}
    </div>
  );
}
