import type { ResearchReport } from "./types";

export interface ReportExporter {
  export(report: ResearchReport): Promise<Blob | string>;
}

export class MarkdownExporter implements ReportExporter {
  async export(report: ResearchReport): Promise<string> {
    let md = `# ${report.title}\n\n`;
    md += `## Executive Summary\n${report.executiveSummary}\n\n`;
    
    for (const section of report.sections) {
      md += `## ${section.title}\n${section.content}\n\n`;
    }
    
    md += `## Sources\n`;
    report.citations.forEach(cit => md += `- ${cit}\n`);
    
    return md;
  }
}

export class HTMLExporter implements ReportExporter {
  async export(report: ResearchReport): Promise<string> {
    let html = `<h1>${report.title}</h1>\n`;
    html += `<h2>Executive Summary</h2>\n<p>${report.executiveSummary}</p>\n`;
    
    for (const section of report.sections) {
      html += `<h2>${section.title}</h2>\n<p>${section.content.replace(/\n/g, '<br/>')}</p>\n`;
    }
    
    html += `<h2>Sources</h2>\n<ul>\n`;
    report.citations.forEach(cit => html += `<li>${cit}</li>\n`);
    html += `</ul>`;
    
    return html;
  }
}

export class JSONExporter implements ReportExporter {
  async export(report: ResearchReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }
}

export class ExportEngine {
  async exportReport(report: ResearchReport, format: "Markdown" | "HTML" | "JSON" | "PDF" | "DOCX" | "PPTX"): Promise<Blob | string> {
    let exporter: ReportExporter;

    switch (format) {
      case "Markdown":
        exporter = new MarkdownExporter();
        break;
      case "HTML":
        exporter = new HTMLExporter();
        break;
      case "JSON":
        exporter = new JSONExporter();
        break;
      case "PDF":
      case "DOCX":
      case "PPTX":
        // Future extensions without coupling to the generator
        throw new Error(`Export format ${format} requires additional plugins to be installed.`);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return exporter.export(report);
  }
}
