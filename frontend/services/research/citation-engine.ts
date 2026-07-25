import type { CitationFormatType, Source } from "./types";

export class CitationEngine {
  formatCitation(source: Source, format: CitationFormatType): string {
    switch (format) {
      case "APA":
        return this.toAPA(source);
      case "MLA":
        return this.toMLA(source);
      case "IEEE":
        return this.toIEEE(source);
      case "Markdown":
        return this.toMarkdown(source);
      case "PlainText":
      default:
        return this.toPlainText(source);
    }
  }

  private toAPA(source: Source): string {
    const author = source.author ? `${source.author}.` : "Unknown Author.";
    const year = source.publishedDate ? `(${new Date(source.publishedDate).getFullYear()}).` : "(n.d.).";
    const title = `${source.title}.`;
    const url = source.url ? `Retrieved from ${source.url}` : "";
    return `${author} ${year} ${title} ${url}`.trim();
  }

  private toMLA(source: Source): string {
    const author = source.author ? `${source.author}.` : "Unknown Author.";
    const title = `"${source.title}."`;
    const date = source.publishedDate ? new Date(source.publishedDate).toLocaleDateString() : "";
    const url = source.url ? source.url : "";
    return `${author} ${title} ${date}. ${url}`.trim();
  }

  private toIEEE(source: Source): string {
    const author = source.author ? `${source.author}, ` : "";
    const title = `"${source.title},"`;
    const date = source.publishedDate ? new Date(source.publishedDate).toLocaleDateString() : "";
    const url = source.url ? `Available: ${source.url}` : "";
    return `[1] ${author}${title} ${date}. ${url}`.trim();
  }

  private toMarkdown(source: Source): string {
    if (source.url) {
      return `[${source.title}](${source.url})`;
    }
    return `*${source.title}*${source.author ? ` by ${source.author}` : ""}`;
  }

  private toPlainText(source: Source): string {
    return `${source.title}${source.url ? ` - ${source.url}` : ""}`;
  }
}
