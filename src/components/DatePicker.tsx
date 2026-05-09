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
      className="min-h-11 w-full rounded border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
      popperClassName="z-50"
      calendarClassName="rounded-md border border-amber-200"
      showPopperArrow={false}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={120}
    />
  );
}

