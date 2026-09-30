/**
 * PDF WRITER
 * ============================================================================
 * Writes genuine PDF 1.4 files in the browser with no dependencies.
 *
 * WHY NOT jsPDF?
 * --------------
 * jsPDF is ~350 kB for what this panel needs: Helvetica text, rules, tables
 * and page breaks. PDF's text-drawing model is small enough to implement
 * directly, and the Standard 14 fonts (Helvetica, Helvetica-Bold) are built
 * into every reader, so nothing has to be embedded.
 *
 * The output is a real `.pdf` — a true file download, not a print dialog.
 *
 * FILE STRUCTURE
 * --------------
 *   %PDF-1.4
 *   objects…          catalog, page tree, pages, fonts, content streams
 *   xref              byte offset of every object
 *   trailer           points at the catalog
 *
 * The xref table is why this is written in two passes: object bodies are
 * built first, then serialised while byte offsets are recorded.
 */

/* ==========================================================================
 * TEXT ENCODING
 * PDF string literals are WinAnsi here. Characters outside it are folded to
 * close ASCII equivalents so a smart quote or an em dash never corrupts the
 * stream.
 * ========================================================================== */

const CHAR_FOLD = {
  "\u2018": "'", "\u2019": "'", "\u201A": ",", "\u201B": "'",
  "\u201C": '"', "\u201D": '"', "\u201E": '"',
  "\u2013": "-", "\u2014": "--", "\u2212": "-",
  "\u2026": "...", "\u00B7": "-", "\u2022": "-",
  "\u00A0": " ", "\u2009": " ", "\u202F": " ",
  "\u00D7": "x", "\u2713": "v", "\u2192": "->",
};

function fold(text) {
  let out = "";
  for (const ch of String(text ?? "")) {
    if (CHAR_FOLD[ch] !== undefined) out += CHAR_FOLD[ch];
    else if (ch.charCodeAt(0) < 256) out += ch;
    else out += "?";
  }
  return out;
}

/** Escapes the three characters that are special inside a PDF string. */
function escapeText(text) {
  return fold(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/* ==========================================================================
 * TEXT MEASUREMENT
 * Helvetica glyph widths grouped by class. Close enough to the real AFM
 * metrics that wrapping lands within a few points, and deliberately biased
 * slightly wide so a line never overruns the right margin.
 * ========================================================================== */

const NARROW = new Set("ijltfIr.,:;|!'()[]{}/\\-` ".split(""));
const WIDE = new Set("mMWw@%".split(""));

function charWidth(ch) {
  if (NARROW.has(ch)) return 0.3;
  if (WIDE.has(ch)) return 0.88;
  if (ch >= "A" && ch <= "Z") return 0.7;
  if (ch >= "0" && ch <= "9") return 0.56;
  return 0.55;
}

/** Width of `text` in points at `size`, for the given weight. */
export function textWidth(text, size, bold = false) {
  const folded = fold(text);
  let units = 0;
  for (const ch of folded) units += charWidth(ch);
  return units * size * (bold ? 1.05 : 1);
}

/** Greedy word wrap. Returns an array of lines that each fit `maxWidth`. */
export function wrapText(text, maxWidth, size, bold = false) {
  const words = fold(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, size, bold) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);

    // A single word longer than the column — break it mid-word rather than
    // let it run off the page.
    if (textWidth(word, size, bold) > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        if (textWidth(chunk + ch, size, bold) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    } else {
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ==========================================================================
 * DOCUMENT
 * ========================================================================== */

const A4 = { width: 595.28, height: 841.89 };

const COLORS = {
  ink: [0.13, 0.13, 0.14],
  muted: [0.42, 0.43, 0.45],
  rule: [0.85, 0.86, 0.87],
  accent: [0.11, 0.24, 0.35],
  band: [0.96, 0.965, 0.97],
};

export class PdfDocument {
  constructor({ title = "Document", margin = 48 } = {}) {
    this.title = title;
    this.margin = margin;
    this.pages = [];
    this.ops = [];
    this.y = 0;
    this.pageNumber = 0;
    this.headerFn = null;
    this.footerFn = null;
    this.addPage();
  }

  get contentWidth() {
    return A4.width - this.margin * 2;
  }

  /* ---------------- page lifecycle ---------------- */

  addPage() {
    if (this.ops.length) this.pages.push(this.ops.join("\n"));
    this.ops = [];
    this.pageNumber += 1;
    this.y = A4.height - this.margin;
    if (this.headerFn) this.headerFn(this);
    return this;
  }

  /** Starts a new page if `needed` points will not fit below the cursor. */
  ensure(needed) {
    if (this.y - needed < this.margin + 34) this.addPage();
    return this;
  }

  /* ---------------- primitives ---------------- */

  setFill([r, g, b]) {
    this.ops.push(`${r} ${g} ${b} rg`);
    return this;
  }

  setStroke([r, g, b]) {
    this.ops.push(`${r} ${g} ${b} RG`);
    return this;
  }

  /** Draws one line of text at an absolute position. No cursor movement. */
  drawText(text, x, y, { size = 10, bold = false, color = COLORS.ink } = {}) {
    this.setFill(color);
    this.ops.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapeText(text)}) Tj ET`
    );
    return this;
  }

  rect(x, y, w, h, color = COLORS.band) {
    this.setFill(color);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    return this;
  }

  line(x1, y1, x2, y2, color = COLORS.rule, width = 0.7) {
    this.setStroke(color);
    this.ops.push(
      `${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
    return this;
  }

  /* ---------------- flow layout ---------------- */

  space(points = 10) {
    this.y -= points;
    return this;
  }

  rule(gapBefore = 8, gapAfter = 10) {
    this.y -= gapBefore;
    this.ensure(4);
    this.line(this.margin, this.y, A4.width - this.margin, this.y);
    this.y -= gapAfter;
    return this;
  }

  /** Wrapped paragraph. Advances the cursor and paginates automatically. */
  text(content, { size = 10, bold = false, color = COLORS.ink, leading = 1.45, indent = 0 } = {}) {
    const width = this.contentWidth - indent;
    const lines = wrapText(content, width, size, bold);
    const step = size * leading;

    for (const lineText of lines) {
      this.ensure(step);
      this.y -= step;
      this.drawText(lineText, this.margin + indent, this.y, { size, bold, color });
    }
    return this;
  }

  heading(content, { size = 14, color = COLORS.accent } = {}) {
    this.ensure(size * 2);
    this.space(6);
    this.text(content, { size, bold: true, color, leading: 1.25 });
    this.space(4);
    return this;
  }

  /** Label/value row — the workhorse for record detail pages. */
  field(label, value, { labelWidth = 120, size = 10 } = {}) {
    const valueWidth = this.contentWidth - labelWidth;
    const lines = wrapText(value == null || value === "" ? "—" : String(value), valueWidth, size);
    const step = size * 1.45;
    const blockHeight = step * lines.length;

    this.ensure(blockHeight + 4);
    const top = this.y;

    this.drawText(label, this.margin, top - step, {
      size,
      bold: true,
      color: COLORS.muted,
    });

    lines.forEach((lineText, index) => {
      this.drawText(lineText, this.margin + labelWidth, top - step * (index + 1), { size });
    });

    this.y = top - blockHeight - 3;
    return this;
  }

  /**
   * Table with a shaded header row and zebra striping.
   * `columns` is [{ header, key, width }] where width is a fraction of the
   * content width. Cells are truncated, not wrapped, to keep rows uniform.
   */
  table(columns, rows, { size = 8.5, rowHeight = 17 } = {}) {
    const widths = columns.map((column) => column.width * this.contentWidth);

    const drawHeader = () => {
      this.ensure(rowHeight * 2);
      this.y -= rowHeight;
      this.rect(this.margin, this.y - 4, this.contentWidth, rowHeight, COLORS.accent);
      let x = this.margin + 5;
      columns.forEach((column, index) => {
        this.drawText(column.header, x, this.y + 1, {
          size,
          bold: true,
          color: [1, 1, 1],
        });
        x += widths[index];
      });
      this.y -= 4;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      if (this.y - rowHeight < this.margin + 34) {
        this.addPage();
        drawHeader();
      }
      this.y -= rowHeight;

      if (rowIndex % 2 === 1) {
        this.rect(this.margin, this.y - 4, this.contentWidth, rowHeight, COLORS.band);
      }

      let x = this.margin + 5;
      columns.forEach((column, index) => {
        const raw = row[column.key];
        const value = raw == null || raw === "" ? "—" : String(raw);
        const available = widths[index] - 10;

        let shown = value;
        if (textWidth(shown, size) > available) {
          while (shown.length > 1 && textWidth(`${shown}...`, size) > available) {
            shown = shown.slice(0, -1);
          }
          shown = `${shown}...`;
        }
        this.drawText(shown, x, this.y + 1, { size });
        x += widths[index];
      });
    });

    this.y -= 6;
    return this;
  }

  /* ---------------- chrome ---------------- */

  setHeader(fn) {
    this.headerFn = fn;
    if (this.pageNumber === 1 && !this.ops.length) fn(this);
    return this;
  }

  setFooter(fn) {
    this.footerFn = fn;
    return this;
  }

  /* ---------------- serialisation ---------------- */

  build() {
    this.pages.push(this.ops.join("\n"));
    this.ops = [];

    const total = this.pages.length;
    const streams = this.pages.map((content, index) => {
      if (!this.footerFn) return content;
      // Footers are appended at build time because they need the final page
      // count, which is only known once every page exists.
      const footerOps = [];
      const shim = {
        ops: footerOps,
        margin: this.margin,
        pageNumber: index + 1,
        pageCount: total,
        drawText: PdfDocument.prototype.drawText,
        setFill: PdfDocument.prototype.setFill,
        setStroke: PdfDocument.prototype.setStroke,
        line: PdfDocument.prototype.line,
        rect: PdfDocument.prototype.rect,
      };
      this.footerFn(shim);
      return `${content}\n${footerOps.join("\n")}`;
    });

    const objects = [];
    const push = (body) => {
      objects.push(body);
      return objects.length; // 1-based object number
    };

    const catalogNum = push(null); // reserved, filled below
    const pagesNum = push(null);
    const fontRegular = push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
    );
    const fontBold = push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    );

    const pageNums = [];
    streams.forEach((stream) => {
      const contentNum = push(
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
      );
      const pageNum = push(
        `<< /Type /Page /Parent ${pagesNum} 0 R ` +
          `/MediaBox [0 0 ${A4.width} ${A4.height}] ` +
          `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> ` +
          `/Contents ${contentNum} 0 R >>`
      );
      pageNums.push(pageNum);
    });

    objects[catalogNum - 1] = `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`;
    objects[pagesNum - 1] =
      `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(" ")}] ` +
      `/Count ${pageNums.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [];
    objects.forEach((body, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf +=
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R ` +
      `/Info << /Title (${escapeText(this.title)}) /Producer (Siraj Builders Admin) >> >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    return pdf;
  }

  /** Builds the file and triggers a browser download. */
  save(filename) {
    const pdf = this.build();
    // Latin-1 bytes: the content is already folded to single-byte characters,
    // so a naive charCodeAt mapping is exact and avoids TextEncoder's UTF-8.
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;

    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }
}

export { COLORS, A4 };
