import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { analytics } from "./analytics";

export const exportSvgAsDataUrl = async (svgElement: SVGSVGElement): Promise<string> => {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const encoded = window.btoa(unescape(encodeURIComponent(source)));
  return `data:image/svg+xml;base64,${encoded}`;
};

export const exportSvgAsPng = async (svgElement: SVGSVGElement, fileName: string): Promise<void> => {
  try {
    const dataUrl = await exportSvgAsDataUrl(svgElement);
    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unable to load SVG for export"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = (img.width || 300) * 2;
    canvas.height = (img.height || 300) * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngData = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = pngData;
    anchor.download = `${fileName}.png`;
    anchor.click();
  } catch {
    const fallbackRoot = (svgElement.parentElement ?? svgElement) as unknown as HTMLElement;
    const canvas = await html2canvas(fallbackRoot);
    const pngData = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = pngData;
    anchor.download = `${fileName}.png`;
    anchor.click();
  }
  await analytics.track("chart_exported");
};

export const exportSvgAsPdf = async (svgElement: SVGSVGElement, fileName: string): Promise<void> => {
  try {
    const dataUrl = await exportSvgAsDataUrl(svgElement);
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unable to load SVG for export"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = (img.width || 300) * 2;
    canvas.height = (img.height || 300) * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 36;
    const drawW = pageW - margin * 2;
    const drawH = (canvas.height * drawW) / canvas.width;
    pdf.addImage(pngData, "PNG", margin, margin, drawW, drawH);
    pdf.save(`${fileName}.pdf`);
  } catch {
    const fallbackRoot = (svgElement.parentElement ?? svgElement) as unknown as HTMLElement;
    const canvas = await html2canvas(fallbackRoot);
    const pngData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 36;
    const drawW = pageW - margin * 2;
    const drawH = (canvas.height * drawW) / canvas.width;
    pdf.addImage(pngData, "PNG", margin, margin, drawW, drawH);
    pdf.save(`${fileName}.pdf`);
  }
  await analytics.track("chart_exported_pdf");
};

