/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/activecampaign/report-pdf
 * Generates a branded PDF ad performance report for clients.
 *
 * Expects JSON body with: campaigns, aggregate, adLinks, adNames
 */

interface LinkStat {
  url: string;
  name: string;
  clicks: number;
  uniqueClicks: number;
}

interface CampaignData {
  id: string;
  name: string;
  sendDate: string | null;
  sendCount: number;
  totalOpens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  unsubscribes: number;
  links: LinkStat[];
}

interface ReportPayload {
  campaigns: CampaignData[];
  aggregate: {
    sendCount: number;
    totalOpens: number;
    uniqueOpens: number;
    clicks: number;
    uniqueClicks: number;
    unsubscribes: number;
  };
  adLinks: LinkStat[];
  adNames: string[];
}

export async function POST(request: NextRequest) {
  try {
    const payload: ReportPayload = await request.json();
    const { campaigns, aggregate, adLinks, adNames } = payload;

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ error: "No campaigns provided" }, { status: 400 });
    }

    // Dynamic import pdfkit (no built-in types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfkitModule = require("pdfkit");
    // Handle both CJS default export and ESM-style .default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFDocument = (pdfkitModule.default || pdfkitModule) as new (options?: Record<string, unknown>) => any;

    // Build PDF in memory
    const chunks: Buffer[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = new PDFDocument({
      size: "LETTER",
      margins: { top: 60, bottom: 60, left: 55, right: 55 },
      info: {
        Title: "Ad Performance Report — Planet Detroit",
        Author: "Planet Detroit Newsletter Builder",
        Creator: "Planet Detroit",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const PD_BLUE = "#2982C4";
    const PD_DARK = "#1e293b";
    const PD_MUTED = "#64748b";
    const PD_RED = "#ef4444";
    const pageW = 612 - 55 - 55; // usable width

    // ── Page 1: Header + Summary ────────────────────

    // Title
    doc.fontSize(22);
    doc.font("Helvetica-Bold");
    doc.fillColor(PD_DARK);
    doc.text("Ad Performance Report", 55, 60);

    doc.fontSize(11);
    doc.font("Helvetica");
    doc.fillColor(PD_MUTED);
    doc.text(`Planet Detroit Newsletter  •  Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 55, 88);

    // Divider
    doc.strokeColor(PD_BLUE);
    doc.lineWidth(2);
    doc.moveTo(55, 110).lineTo(55 + pageW, 110).stroke();

    // Ad names
    if (adNames.length > 0) {
      doc.fontSize(10);
      doc.font("Helvetica");
      doc.fillColor(PD_MUTED);
      doc.text(`Ad${adNames.length > 1 ? "s" : ""}: ${adNames.join(", ")}`, 55, 120);
    }

    // Campaign date range
    const dates = campaigns
      .filter((c) => c.sendDate)
      .map((c) => new Date(c.sendDate!))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const rangeStr = dates.length === 1 ? fmt(dates[0]) : `${fmt(dates[0])} — ${fmt(dates[dates.length - 1])}`;
      doc.fontSize(10);
      doc.font("Helvetica");
      doc.fillColor(PD_MUTED);
      doc.text(`Period: ${rangeStr}  •  ${campaigns.length} campaign${campaigns.length > 1 ? "s" : ""}`, 55, 135);
    }

    let yPos = 165;

    // ── Summary Metrics Boxes ────────────────────────

    const openRate = aggregate.sendCount > 0 ? ((aggregate.uniqueOpens / aggregate.sendCount) * 100).toFixed(1) : "0";
    const ctr = aggregate.sendCount > 0 ? ((aggregate.uniqueClicks / aggregate.sendCount) * 100).toFixed(2) : "0";

    const metrics = [
      { label: "Total Sent", value: aggregate.sendCount.toLocaleString() },
      { label: "Unique Opens", value: aggregate.uniqueOpens.toLocaleString(), sub: `${openRate}% rate` },
      { label: "Unique Clicks", value: aggregate.uniqueClicks.toLocaleString(), sub: `${ctr}% CTR` },
      { label: "Unsubscribes", value: aggregate.unsubscribes.toLocaleString() },
    ];

    const boxW = (pageW - 15) / 4;
    metrics.forEach((m, i) => {
      const bx = 55 + i * (boxW + 5);

      // Box background
      doc.rect(bx, yPos, boxW, 55).fill();
      doc.fillColor("#f8fafc");
      doc.rect(bx, yPos, boxW, 55).fill();

      // Border
      doc.strokeColor("#e2e8f0");
      doc.lineWidth(1);
      doc.rect(bx, yPos, boxW, 55).stroke();

      // Value
      doc.fontSize(16);
      doc.font("Helvetica-Bold");
      doc.fillColor(PD_BLUE);
      doc.text(m.value, bx, yPos + 10, { width: boxW, align: "center" });

      // Label
      doc.fontSize(7);
      doc.font("Helvetica");
      doc.fillColor(PD_MUTED);
      doc.text(m.label.toUpperCase(), bx, yPos + 30, { width: boxW, align: "center" });

      // Sub
      if (m.sub) {
        doc.fontSize(7);
        doc.text(m.sub, bx, yPos + 40, { width: boxW, align: "center" });
      }
    });

    yPos += 75;

    // ── Per-Campaign Breakdown Table ─────────────────

    doc.fontSize(11);
    doc.font("Helvetica-Bold");
    doc.fillColor(PD_DARK);
    doc.text("Campaign Breakdown", 55, yPos);
    yPos += 20;

    // Table header
    const colWidths = [180, 55, 65, 55, 65, 45, 45];
    const headers = ["Campaign", "Sent", "Opens", "Open%", "Clicks", "CTR", "Unsubs"];

    doc.rect(55, yPos, pageW, 18).fill();
    doc.fillColor("#f1f5f9");
    doc.rect(55, yPos, pageW, 18).fill();

    doc.fontSize(7);
    doc.font("Helvetica-Bold");
    doc.fillColor(PD_MUTED);

    let colX = 55;
    headers.forEach((h, i) => {
      doc.text(h, colX + 4, yPos + 5, { width: colWidths[i] - 8, align: i === 0 ? "left" : "right" });
      colX += colWidths[i];
    });

    yPos += 18;

    // Table rows
    doc.font("Helvetica");
    doc.fontSize(8);

    campaigns.forEach((c) => {
      if (yPos > 680) {
        doc.addPage();
        yPos = 60;
      }

      const or = c.sendCount > 0 ? ((c.uniqueOpens / c.sendCount) * 100).toFixed(1) + "%" : "0%";
      const cr = c.sendCount > 0 ? ((c.uniqueClicks / c.sendCount) * 100).toFixed(2) + "%" : "0%";
      const dateStr = c.sendDate
        ? new Date(c.sendDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "";

      const row = [
        c.name.length > 35 ? c.name.slice(0, 35) + "..." : c.name,
        c.sendCount.toLocaleString(),
        `${c.uniqueOpens.toLocaleString()} / ${c.totalOpens.toLocaleString()}`,
        or,
        `${c.uniqueClicks.toLocaleString()} / ${c.clicks.toLocaleString()}`,
        cr,
        c.unsubscribes.toLocaleString(),
      ];

      // Subtle row background
      doc.fillColor("#ffffff");
      doc.rect(55, yPos, pageW, 22).fill();

      // Row divider
      doc.strokeColor("#e2e8f0");
      doc.lineWidth(0.5);
      doc.moveTo(55, yPos + 22).lineTo(55 + pageW, yPos + 22).stroke();

      colX = 55;
      row.forEach((val, i) => {
        doc.fillColor(i === 0 ? PD_DARK : i === 3 || i === 5 ? PD_BLUE : PD_DARK);
        doc.font(i === 3 || i === 5 ? "Helvetica-Bold" : "Helvetica");
        doc.text(val, colX + 4, yPos + 4, { width: colWidths[i] - 8, align: i === 0 ? "left" : "right" });
        colX += colWidths[i];
      });

      // Date subtitle
      if (dateStr) {
        doc.fontSize(6);
        doc.fillColor(PD_MUTED);
        doc.text(dateStr, 59, yPos + 14);
        doc.fontSize(8);
      }

      yPos += 22;
    });

    yPos += 15;

    // ── Ad Link Performance ──────────────────────────

    if (adLinks.length > 0) {
      if (yPos > 620) {
        doc.addPage();
        yPos = 60;
      }

      doc.fontSize(11);
      doc.font("Helvetica-Bold");
      doc.fillColor(PD_DARK);
      doc.text("Ad Link Performance", 55, yPos);
      yPos += 20;

      // Header
      const linkCols = [280, 65, 65, 65];
      const linkHeaders = ["URL", "Clicks", "Unique", "CTR"];

      doc.rect(55, yPos, pageW, 18).fill();
      doc.fillColor("#fef3f0");
      doc.rect(55, yPos, pageW, 18).fill();

      doc.fontSize(7);
      doc.font("Helvetica-Bold");
      doc.fillColor("#ea5a39");

      colX = 55;
      linkHeaders.forEach((h, i) => {
        doc.text(h, colX + 4, yPos + 5, { width: linkCols[i] - 8, align: i === 0 ? "left" : "right" });
        colX += linkCols[i];
      });
      yPos += 18;

      doc.font("Helvetica");
      doc.fontSize(7.5);

      adLinks.forEach((link) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 60;
        }

        const linkCtr = aggregate.sendCount > 0
          ? ((link.uniqueClicks / aggregate.sendCount) * 100).toFixed(2) + "%"
          : "0%";
        const displayUrl = link.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 55);

        doc.fillColor("#ffffff");
        doc.rect(55, yPos, pageW, 18).fill();
        doc.strokeColor("#fde8e4");
        doc.lineWidth(0.5);
        doc.moveTo(55, yPos + 18).lineTo(55 + pageW, yPos + 18).stroke();

        const rowVals = [displayUrl, link.clicks.toLocaleString(), link.uniqueClicks.toLocaleString(), linkCtr];
        colX = 55;
        rowVals.forEach((val, i) => {
          doc.fillColor(i === 0 ? "#ea5a39" : PD_DARK);
          doc.text(val, colX + 4, yPos + 5, { width: linkCols[i] - 8, align: i === 0 ? "left" : "right" });
          colX += linkCols[i];
        });

        yPos += 18;
      });
    }

    // ── Footer ───────────────────────────────────────

    doc.fontSize(7);
    doc.font("Helvetica");
    doc.fillColor(PD_MUTED);
    doc.text(
      "This report was generated by the Planet Detroit Newsletter Builder. Data sourced from ActiveCampaign.",
      55,
      730,
      { width: pageW, align: "center" }
    );

    doc.end();

    const buffer = await pdfReady;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ad-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
