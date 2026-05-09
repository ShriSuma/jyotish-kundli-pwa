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

type Props = {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  id?: string;
};

export default function TimePicker({ selected, onChange, id }: Props): JSX.Element {
  const { i18n } = useTranslation();
  const locale = useMemo(() => {
    const code = i18n.language.split("-")[0] as LocaleCode;
    return localeMap[code] ?? enGB;
  }, [i18n.language]);

  return (
    <ReactDatePicker
      id={id}
      selected={selected}
      onChange={(date: Date | null) => onChange(date)}
      locale={locale}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="HH:mm"
      placeholderText="HH:mm"
      className="min-h-11 w-full rounded border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      popperClassName="z-50"
      calendarClassName="rounded-md border border-emerald-200"
      showPopperArrow={false}
    />
  );
}

