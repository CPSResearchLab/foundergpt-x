/**
 * Pitch Deck Exporters
 *
 * Markdown  — clean structured text, renderable anywhere
 * HTML      — self-contained styled HTML with print CSS
 * PPTX      — Open XML presentation via JSZip (no external dep)
 * PDF       — HTML with @media print stylesheet (browser-printable)
 */

import type { ExportFormat, PitchDeck } from "./types";
import { SLIDE_LABELS, SLIDE_ORDER } from "./types";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportDeck(
  deck: PitchDeck,
  format: ExportFormat,
): Promise<{ content: string | Buffer; mimeType: string; filename: string }> {
  const slug = deck.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  switch (format) {
    case "markdown":
      return { content: toMarkdown(deck), mimeType: "text/markdown", filename: `${slug}.md` };
    case "html":
      return { content: toHtml(deck), mimeType: "text/html", filename: `${slug}.html` };
    case "pdf":
      return { content: toPdfHtml(deck), mimeType: "text/html", filename: `${slug}-print.html` };
    case "pptx":
      return { content: await toPptx(deck), mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", filename: `${slug}.pptx` };
  }
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

function toMarkdown(deck: PitchDeck): string {
  const lines: string[] = [
    `# ${deck.title}`,
    ``,
    `> ${deck.oneLiner}`,
    ``,
    `**Target Investor:** ${deck.targetInvestor}`,
    `**Generated:** ${new Date(deck.generatedAt).toLocaleDateString()}`,
    ``,
    `---`,
    ``,
  ];

  for (const slideType of SLIDE_ORDER) {
    const slide = deck.slides[slideType];
    const label = SLIDE_LABELS[slideType];

    lines.push(`## ${label}`);
    lines.push(``, `### ${slide.headline}`, ``);
    for (const bullet of slide.body) lines.push(`- ${bullet}`);
    lines.push(``);

    if (slide.speakerNotes) {
      lines.push(`**Speaker Notes:** ${slide.speakerNotes}`, ``);
    }
    if (slide.visualSuggestion) {
      lines.push(`**Visual:** ${slide.visualSuggestion}`, ``);
    }
    if (slide.chartSuggestion) {
      lines.push(`**Chart:** ${slide.chartSuggestion}`, ``);
    }
    if (slide.iconSuggestions.length > 0) {
      lines.push(`**Icons:** ${slide.iconSuggestions.join(", ")}`, ``);
    }
    if (slide.imageSuggestion) {
      lines.push(`**Image:** ${slide.imageSuggestion}`, ``);
    }
    if (slide.proofGaps.length > 0) {
      lines.push(`**⚠️ Proof Gaps:**`);
      for (const gap of slide.proofGaps) lines.push(`- ${gap}`);
      lines.push(``);
    }
    lines.push(`---`, ``);
  }

  return lines.join("\n");
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

function toHtml(deck: PitchDeck): string {
  const slidesHtml = SLIDE_ORDER.map((slideType) => {
    const slide = deck.slides[slideType];
    const label = SLIDE_LABELS[slideType];
    const bullets = slide.body.map((b) => `<li>${esc(b)}</li>`).join("");
    const gaps = slide.proofGaps.length > 0
      ? `<div class="proof-gaps"><strong>⚠️ Proof Gaps:</strong><ul>${slide.proofGaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>`
      : "";

    return `
<section class="slide" id="slide-${slideType}">
  <div class="slide-label">${esc(label)}</div>
  <h2>${esc(slide.headline)}</h2>
  <ul>${bullets}</ul>
  ${gaps}
  <div class="meta">
    ${slide.speakerNotes ? `<p><strong>🎤 Speaker Notes:</strong> ${esc(slide.speakerNotes)}</p>` : ""}
    ${slide.visualSuggestion ? `<p><strong>🖼 Visual:</strong> ${esc(slide.visualSuggestion)}</p>` : ""}
    ${slide.chartSuggestion ? `<p><strong>📊 Chart:</strong> ${esc(slide.chartSuggestion)}</p>` : ""}
    ${slide.iconSuggestions.length > 0 ? `<p><strong>🔷 Icons:</strong> ${slide.iconSuggestions.map(esc).join(", ")}</p>` : ""}
    ${slide.imageSuggestion ? `<p><strong>📷 Image:</strong> ${esc(slide.imageSuggestion)}</p>` : ""}
  </div>
</section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(deck.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #050914; color: #e2e8f0; margin: 0; padding: 2rem; }
  h1 { font-size: 2.5rem; color: #22d3ee; margin-bottom: 0.25rem; }
  .one-liner { font-size: 1.2rem; color: #94a3b8; margin-bottom: 2rem; }
  .slide { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 2rem; margin-bottom: 2rem; }
  .slide-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #22d3ee; margin-bottom: 0.5rem; }
  h2 { font-size: 1.5rem; margin: 0 0 1rem; color: #f1f5f9; }
  ul { padding-left: 1.5rem; line-height: 1.8; }
  .proof-gaps { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; }
  .meta { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.875rem; color: #94a3b8; }
  .meta p { margin: 0.25rem 0; }
</style>
</head>
<body>
<h1>${esc(deck.title)}</h1>
<p class="one-liner">${esc(deck.oneLiner)}</p>
${slidesHtml}
</body>
</html>`;
}

// ─── PDF (print HTML) ─────────────────────────────────────────────────────────

function toPdfHtml(deck: PitchDeck): string {
  const base = toHtml(deck);
  const printCss = `
<style>
  @media print {
    body { background: white; color: black; padding: 0; }
    .slide { break-inside: avoid; page-break-inside: avoid; border: 1px solid #ccc; background: white; }
    h1, h2 { color: black; }
    .slide-label { color: #0891b2; }
    .one-liner { color: #475569; }
    .meta { color: #475569; }
  }
</style>`;
  return base.replace("</head>", `${printCss}</head>`);
}

// ─── PPTX ─────────────────────────────────────────────────────────────────────

async function toPptx(deck: PitchDeck): Promise<Buffer> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // Minimal Open XML PPTX structure
  zip.file("[Content_Types].xml", contentTypesXml(SLIDE_ORDER.length));
  zip.file("_rels/.rels", rootRelsXml());
  zip.file("ppt/presentation.xml", presentationXml(SLIDE_ORDER.length));
  zip.file("ppt/_rels/presentation.xml.rels", presentationRelsXml(SLIDE_ORDER.length));
  zip.file("ppt/slideLayouts/slideLayout1.xml", slideLayoutXml());
  zip.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slideLayoutRelsXml());
  zip.file("ppt/slideMasters/slideMaster1.xml", slideMasterXml());
  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", slideMasterRelsXml());
  zip.file("ppt/theme/theme1.xml", themeXml());

  for (let i = 0; i < SLIDE_ORDER.length; i++) {
    const slideType = SLIDE_ORDER[i];
    const slide = deck.slides[slideType];
    const label = SLIDE_LABELS[slideType];
    const num = i + 1;

    zip.file(`ppt/slides/slide${num}.xml`, slideXml(label, slide));
    zip.file(`ppt/slides/_rels/slide${num}.xml.rels`, slideRelsXml());
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return buffer;
}

// ─── PPTX XML helpers ─────────────────────────────────────────────────────────

function xmlEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slideXml(label: string, slide: { headline: string; body: string[]; speakerNotes: string }): string {
  const bodyText = slide.body.map((b) => `• ${b}`).join("&#xA;");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="label"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${xmlEsc(label + ": " + slide.headline)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="body"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="8229600" cy="4525963"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${xmlEsc(bodyText)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:notes><p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="2" name="notes"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
      <p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${xmlEsc(slide.speakerNotes)}</a:t></a:r></a:p></p:txBody>
    </p:sp>
  </p:spTree></p:cSld></p:notes>
</p:sld>`;
}

function contentTypesXml(slideCount: number): string {
  const overrides = Array.from({ length: slideCount }, (_, i) =>
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${overrides}
</Types>`;
}

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;
}

function presentationXml(slideCount: number): string {
  const sldIds = Array.from({ length: slideCount }, (_, i) =>
    `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId${slideCount + 1}"/></p:sldMasterIdLst>
  <p:sldIdLst>${sldIds}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function presentationRelsXml(slideCount: number): string {
  const rels = Array.from({ length: slideCount }, (_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${rels}
  <Relationship Id="rId${slideCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId${slideCount + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
}

function slideRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
}

function slideLayoutXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" type="blank">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
</p:sldLayout>`;
}

function slideLayoutRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;
}

function slideMasterXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr lang="en-US"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr lang="en-US"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr lang="en-US"/></a:lvl1pPr></p:otherStyle></p:txStyles>
</p:sldMaster>`;
}

function slideMasterRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;
}

function themeXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="FounderGPT">
  <a:themeElements>
    <a:clrScheme name="FounderGPT">
      <a:dk1><a:sysClr lastClr="000000" val="windowText"/></a:dk1>
      <a:lt1><a:sysClr lastClr="ffffff" val="window"/></a:lt1>
      <a:dk2><a:srgbClr val="050914"/></a:dk2>
      <a:lt2><a:srgbClr val="e2e8f0"/></a:lt2>
      <a:accent1><a:srgbClr val="22d3ee"/></a:accent1>
      <a:accent2><a:srgbClr val="6366f1"/></a:accent2>
      <a:accent3><a:srgbClr val="10b981"/></a:accent3>
      <a:accent4><a:srgbClr val="f59e0b"/></a:accent4>
      <a:accent5><a:srgbClr val="ef4444"/></a:accent5>
      <a:accent6><a:srgbClr val="8b5cf6"/></a:accent6>
      <a:hlink><a:srgbClr val="22d3ee"/></a:hlink>
      <a:folHlink><a:srgbClr val="6366f1"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="FounderGPT">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="FounderGPT">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;
}
