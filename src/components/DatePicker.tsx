import ReactDatePicker from "react-datepicker";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { enGB, hi, kn, ta, te } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

type LocaleCode = "en" | "hi" | "kn" | "te" | "ta";

const localeMap = {
  en: enGB,
  hi,
  kn,
  te,
  ta
} as const;

export const getDateFnsLocale = (language: string) => {
  const code = language.split("-")[0] as LocaleCode;
  return localeMap[code] ?? enGB;
};

type Props = {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  id?: string;
};

export default function DatePicker({ selected, onChange, placeholderText, id }: Props): JSX.Element {
  const { i18n } = useTranslation();
  const locale = useMemo(() => getDateFnsLocale(i18n.language), [i18n.language]);

  return (
    <ReactDatePicker
      id={id}
      selected={selected}
      onChange={(date: Date | null) => onChange(date)}
      locale={locale}
      minDate={new Date("1900-01-01")}
      maxDate={new Date()}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholderText ?? "DD/MM/YYYY"}
      className="jk-touch-input min-h-[3rem] w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-3 text-base font-medium text-indigo-950 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
      popperClassName="z-50 jk-datepicker-popper"
      calendarClassName="jk-datepicker-calendar rounded-lg border border-amber-200 text-base"
      showPopperArrow={false}
      withPortal
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={120}
    />
  );
}

