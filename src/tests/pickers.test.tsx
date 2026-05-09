import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DatePicker, { getDateFnsLocale } from "../components/DatePicker";
import TimePicker from "../components/TimePicker";
import i18n from "../i18n";
import { enGB, hi, kn, ta, te } from "date-fns/locale";

describe("Date and time pickers", () => {
  it("Date picker renders", () => {
    render(<DatePicker selected={null} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("DD/MM/YYYY")).toBeInTheDocument();
  });

  it("Locale changes update locale mapping", async () => {
    await i18n.changeLanguage("hi");
    expect(getDateFnsLocale(i18n.language)).toBe(hi);
    await i18n.changeLanguage("kn");
    expect(getDateFnsLocale(i18n.language)).toBe(kn);
    await i18n.changeLanguage("te");
    expect(getDateFnsLocale(i18n.language)).toBe(te);
    await i18n.changeLanguage("ta");
    expect(getDateFnsLocale(i18n.language)).toBe(ta);
    await i18n.changeLanguage("en");
    expect(getDateFnsLocale(i18n.language)).toBe(enGB);
  });

  it("Time picker accepts valid input", () => {
    const onChange = vi.fn();
    render(<TimePicker selected={null} onChange={onChange} />);
    const input = screen.getByPlaceholderText("HH:mm");
    fireEvent.change(input, { target: { value: "09:30" } });
    expect(input).toHaveValue("09:30");
  });
});

