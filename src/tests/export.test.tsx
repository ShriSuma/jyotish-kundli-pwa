import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import InstallPrompt from "../components/InstallPrompt";
import { exportSvgAsDataUrl } from "../core/ExportUtils";
import i18n from "../i18n";

describe("Export and install", () => {
  it("SVG export returns data URL", async () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = "<circle cx='10' cy='10' r='5'></circle>";
    const dataUrl = await exportSvgAsDataUrl(svg);
    expect(dataUrl.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  it("Install prompt shows", async () => {
    localStorage.removeItem("installDismissed");
    render(
      <I18nextProvider i18n={i18n}>
        <InstallPrompt />
      </I18nextProvider>
    );
    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "dismissed" })
    });
    window.dispatchEvent(event);
    expect(await screen.findByTestId("install-prompt")).toBeInTheDocument();
  });
});

