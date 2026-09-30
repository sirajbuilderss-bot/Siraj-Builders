/**
 * EXPORT SERVICE — PDF AND CSV
 * ============================================================================
 * Submissions leave the admin panel through here.
 *
 *   exportSubmissionPdf    one record, full detail
 *   exportSubmissionsPdf   a list — everything, or whatever the filters left
 *   exportSubmissionsCsv   the same rows for spreadsheet work
 *
 * The PDF path writes a real `.pdf` file via src/lib/pdf.js — a true
 * download, not a print dialog the user has to steer. See that file for why
 * there is no PDF dependency.
 */

import { PdfDocument, COLORS, A4 } from "../lib/pdf";

const BRAND = "Siraj Builders";

/* --------------------------------------------------------------------------
 * Formatting
 * ------------------------------------------------------------------------ */

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCase(value) {
  if (!value) return "—";
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function slugify(value, fallback = "export") {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

/* --------------------------------------------------------------------------
 * Page chrome — shared by every export so the files look like one family
 * ------------------------------------------------------------------------ */

function applyChrome(doc, subtitle) {
  doc.setHeader((d) => {
    d.rect(0, A4.height - 64, A4.width, 64, COLORS.accent);
    d.drawText(BRAND, d.margin, A4.height - 34, {
      size: 15,
      bold: true,
      color: [1, 1, 1],
    });
    d.drawText(subtitle, d.margin, A4.height - 50, {
      size: 8.5,
      color: [0.78, 0.83, 0.87],
    });
    d.y = A4.height - 64 - 28;
  });

  doc.setFooter((d) => {
    const y = 30;
    d.line(d.margin, y + 13, A4.width - d.margin, y + 13, COLORS.rule, 0.6);
    d.drawText(
      `${BRAND} — generated ${formatDateShort(new Date())}`,
      d.margin,
      y,
      { size: 8, color: COLORS.muted }
    );
    d.drawText(
      `Page ${d.pageNumber} of ${d.pageCount}`,
      A4.width - d.margin - 72,
      y,
      { size: 8, color: COLORS.muted }
    );
  });
}

/** The detail block used by both the single-record and detailed-list exports. */
function writeRecordBody(doc, row) {
  doc.heading("Contact", { size: 12 });
  doc.field("Full name", row.name);
  doc.field("Phone", row.phone);
  doc.field("Email", row.email);

  doc.space(6);
  doc.heading("Project", { size: 12 });
  doc.field("Project type", titleCase(row.project_type));
  if (row.service) doc.field("Service", row.service);
  if (row.location) doc.field("Location", row.location);
  if (row.size) doc.field("Size", row.size);
  if (row.budget) doc.field("Budget", row.budget);
  if (row.start_date) doc.field("Expected start", row.start_date);

  doc.space(6);
  doc.heading("Description", { size: 12 });
  doc.text(row.description || "—", { size: 10 });
}

/* --------------------------------------------------------------------------
 * ONE RECORD
 * ------------------------------------------------------------------------ */

export function exportSubmissionPdf(row) {
  const doc = new PdfDocument({ title: `Enquiry — ${row.name || "record"}` });
  applyChrome(doc, "Enquiry record");

  doc.heading(row.name || "Enquiry", { size: 17 });
  doc.text(
    `${titleCase(row.form_type)} enquiry received ${formatDate(row.created_at)}`,
    { size: 9.5, color: COLORS.muted }
  );
  doc.rule(10, 14);

  writeRecordBody(doc, row);

  doc.space(8);
  doc.rule(4, 12);
  doc.heading("Internal", { size: 12 });
  doc.field("Status", titleCase(row.status));
  doc.field("Read", row.is_read ? "Yes" : "No");
  doc.field("Source page", row.source_page);
  doc.field("Reference", row.id);

  if (row.admin_notes) {
    doc.space(4);
    doc.text("Notes", { size: 9.5, bold: true, color: COLORS.muted });
    doc.text(row.admin_notes, { size: 10 });
  }

  doc.save(`enquiry-${slugify(row.name, "record")}-${String(row.id || "").slice(0, 8)}`);
}

/* --------------------------------------------------------------------------
 * MANY RECORDS
 * ------------------------------------------------------------------------ */

export function exportSubmissionsPdf(
  rows,
  { title = "Enquiry submissions", subtitle = "", detailed = false } = {}
) {
  const doc = new PdfDocument({ title: `${BRAND} — ${title}` });
  applyChrome(doc, title);

  doc.heading(title, { size: 17 });
  doc.text(
    `${subtitle || `${rows.length} record${rows.length === 1 ? "" : "s"}`} · exported ${formatDate(new Date())}`,
    { size: 9.5, color: COLORS.muted }
  );

  if (!rows.length) {
    doc.rule(10, 12);
    doc.text("No submissions matched the current filters.", {
      size: 10,
      color: COLORS.muted,
    });
    doc.save(`siraj-submissions-${slugify(title)}`);
    return;
  }

  // A short breakdown before the table, so the reader knows the shape of the
  // export without counting rows.
  const tally = (key) =>
    Object.entries(
      rows.reduce((acc, row) => {
        const value = row[key] || "—";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([value, count]) => `${titleCase(value)} ${count}`)
      .join("   ");

  doc.space(4);
  doc.text(`By form:   ${tally("form_type")}`, { size: 9, color: COLORS.muted });
  doc.text(`By status: ${tally("status")}`, { size: 9, color: COLORS.muted });
  doc.rule(10, 6);

  doc.table(
    [
      { header: "Received", key: "received", width: 0.17 },
      { header: "Name", key: "name", width: 0.19 },
      { header: "Phone", key: "phone", width: 0.17 },
      { header: "Email", key: "email", width: 0.22 },
      { header: "Type", key: "type", width: 0.13 },
      { header: "Status", key: "status", width: 0.12 },
    ],
    rows.map((row) => ({
      received: formatDateShort(row.created_at),
      name: row.name,
      phone: row.phone,
      email: row.email,
      type: titleCase(row.form_type),
      status: titleCase(row.status),
    }))
  );

  if (detailed) {
    rows.forEach((row, index) => {
      doc.addPage();
      doc.heading(`${index + 1}. ${row.name || "Enquiry"}`, { size: 15 });
      doc.text(
        `${titleCase(row.form_type)} · ${formatDate(row.created_at)} · ${titleCase(row.status)}`,
        { size: 9, color: COLORS.muted }
      );
      doc.rule(8, 10);
      writeRecordBody(doc, row);
    });
  }

  doc.save(`siraj-submissions-${slugify(title)}`);
}

/* --------------------------------------------------------------------------
 * CSV
 * ------------------------------------------------------------------------ */

const CSV_COLUMNS = [
  ["created_at", "Received"],
  ["form_type", "Form"],
  ["name", "Name"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["project_type", "Project type"],
  ["service", "Service"],
  ["location", "Location"],
  ["size", "Size"],
  ["budget", "Budget"],
  ["start_date", "Expected start"],
  ["description", "Description"],
  ["status", "Status"],
  ["is_read", "Read"],
  ["admin_notes", "Notes"],
  ["source_page", "Source page"],
  ["id", "Reference"],
];

function csvCell(value) {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Prefixing
  // an apostrophe neutralises that without changing what the reader sees.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function download(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export function exportSubmissionsCsv(rows, filename = "submissions.csv") {
  const header = CSV_COLUMNS.map(([, label]) => csvCell(label)).join(",");
  const body = rows
    .map((row) => CSV_COLUMNS.map(([key]) => csvCell(row[key])).join(","))
    .join("\n");

  // BOM first, so Excel reads UTF-8 rather than guessing the local codepage.
  download(
    new Blob([`\ufeff${header}\n${body}`], { type: "text/csv;charset=utf-8;" }),
    filename
  );
}
