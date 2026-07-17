import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import { registerPdfHelpers } from "./helpers";
import puppeteer from "puppeteer";

@Injectable()
export class PdfService {
  constructor() {
    registerPdfHelpers();
  }

  private loadTemplate(name: string): Handlebars.TemplateDelegate {
    const filePath = path.join(
      process.cwd(),
      "src/pdf/templates",
      `${name}.hbs`
    );

    const templateContent = fs.readFileSync(filePath, "utf8");
    return Handlebars.compile(templateContent);
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();
    return pdf;
  }

  // -----------------------------
  // PROFORMA
  // -----------------------------
  async generateProformaPDF(proforma: any): Promise<Buffer> {
    const template = this.loadTemplate("proforma");

    const html = template({
      proforma,
      client: proforma.client,
      vehicle: proforma.vehicle,
      intervention: proforma.intervention,
    });

    return this.renderPdf(html);
  }

  // -----------------------------
  // FACTURE
  // -----------------------------
  async generateInvoicePDF(invoice: any): Promise<Buffer> {
    const template = this.loadTemplate("invoice");

    const html = template({
      invoice,
      client: invoice.client,
      vehicle: invoice.vehicle,
    });

    return this.renderPdf(html);
  }
}
