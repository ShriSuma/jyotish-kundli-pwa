import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import KundliChart from "../components/kundli/KundliChart";
import { calculateKundli } from "../core/KundliEngine";
import i18n from "../i18n";

const kundli = calculateKundli({
  name: "Chart",
  birthDate: "1990-01-01",
  birthTime: "10:10",
  latitude: 19.076,
  longitude: 72.8777
});

const renderI18n = (ui: ReactElement) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe("Kundli charts", () => {
  afterEach(() => cleanup());

  it("renders chart without crash", () => {
    renderI18n(<KundliChart kundli={kundli} chartStyle="north" />);
    expect(screen.getByTestId("north-chart")).toBeInTheDocument();
  });

  it("all planets are present", () => {
    renderI18n(<KundliChart kundli={kundli} chartStyle="south" personName="Chart" />);
    expect(kundli.planets.length).toBe(9);
  });

  it("style toggle works", () => {
    const { rerender } = renderI18n(<KundliChart kundli={kundli} chartStyle="north" />);
    expect(screen.getAllByTestId("north-chart").length).toBeGreaterThan(0);
    rerender(
      <I18nextProvider i18n={i18n}>
        <KundliChart kundli={kundli} chartStyle="south" personName="Chart" />
      </I18nextProvider>
    );
    expect(screen.getByTestId("south-chart")).toBeInTheDocument();
  });

  it("south chart has 12 house regions and places Sun in its rashi cell", () => {
    const { container } = renderI18n(<KundliChart kundli={kundli} chartStyle="south" personName="Chart" />);
    const withHouse = container.querySelectorAll("rect[data-house]");
    expect(withHouse.length).toBe(12);
    const sun = kundli.planets.find((p) => p.name === "Sun");
    expect(sun).toBeTruthy();
    const cellId = `south-house-${sun!.rashi.index}`;
    expect(screen.getByTestId(cellId)).toBeInTheDocument();
  });
});
