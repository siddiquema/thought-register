// export: convert captured thoughts into downloadable files, and read a
// JSON export back in. JSON is the full-fidelity backup/restore format —
// Markdown and CSV are portability formats for other tools, same as v0.1.

function formatExportTimestamp(iso) {
  return new Date(iso).toISOString().slice(0, 16).replace('T', ' ');
}

function thoughtToMarkdownSection(thought) {
  const kind = thought.type === 'structured' ? 'Structured' : 'Quick';
  const lines = [`## ${kind} — ${formatExportTimestamp(thought.createdAt)}`, ''];

  if (thought.topic) {
    lines.push(`Topic: ${thought.topic}`, '');
  }

  if (thought.type === 'structured') {
    lines.push('Observation:', thought.observation, '');
    if (thought.interpretation) {
      lines.push('Interpretation:', thought.interpretation, '');
    }
  } else {
    lines.push('Thought:', thought.thought, '');
  }

  if (thought.category) lines.push(`Category: ${thought.category}`, '');
  if (thought.lifecycle && thought.lifecycle !== 'Captured') lines.push(`Lifecycle: ${thought.lifecycle}`, '');
  if (thought.project) lines.push(`Project: ${thought.project}`, '');
  if (thought.tags && thought.tags.length) lines.push(`Tags: ${thought.tags.join(', ')}`, '');
  if (thought.importance) lines.push(`Importance: ${thought.importance}`, '');
  if (thought.confidence) lines.push(`Confidence: ${thought.confidence}`, '');
  if (thought.reviewStatus === 'reviewed') lines.push(`Reviewed: ${formatExportTimestamp(thought.lastReviewedAt)}`, '');

  return lines.join('\n').trim();
}

function thoughtsToMarkdown(thoughts) {
  const header = [
    '# Thought Register Export',
    '',
    `_Exported ${formatExportTimestamp(new Date().toISOString())}_`,
  ].join('\n');

  const chronological = [...thoughts].reverse();
  const sections = chronological.map(thoughtToMarkdownSection);

  return [header, ...sections].join('\n\n---\n\n');
}

// Column order, fixed — see docs/capture-standard.md. New fields are always
// appended after Tags, never inserted earlier: a CSV column position is a
// stable contract once shipped.
const CSV_COLUMNS = [
  'ID', 'Type', 'Created At', 'Topic', 'Thought', 'Observation', 'Interpretation', 'Tags',
  'Category', 'Lifecycle', 'Project', 'Importance', 'Confidence', 'Review Status', 'Last Reviewed At',
];

function neutralizeFormulaInjection(str) {
  // A leading =, +, -, or @ makes Excel/Sheets/LibreOffice interpret the cell
  // as a formula. Prefixing with a quote neutralizes it without changing the
  // visible content once opened.
  return /^[=+\-@]/.test(str) ? `'${str}` : str;
}

function csvEscapeField(value) {
  const str = neutralizeFormulaInjection(value == null ? '' : String(value));
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function thoughtToCsvRow(thought) {
  const kind = thought.type === 'structured' ? 'Structured' : 'Quick';
  const fields = [
    thought.id,
    kind,
    thought.createdAt,
    thought.topic || '',
    thought.thought || '',
    thought.observation || '',
    thought.interpretation || '',
    (thought.tags || []).join('; '),
    thought.category || '',
    thought.lifecycle || '',
    thought.project || '',
    thought.importance || '',
    thought.confidence || '',
    thought.reviewStatus || '',
    thought.lastReviewedAt || '',
  ];
  return fields.map(csvEscapeField).join(',');
}

function thoughtsToCsv(thoughts) {
  const chronological = [...thoughts].reverse();
  const rows = [CSV_COLUMNS.join(','), ...chronological.map(thoughtToCsvRow)];
  return rows.join('\r\n');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportThoughtsAsMarkdown() {
  const thoughts = await getThoughts();
  if (thoughts.length === 0) return;

  const markdown = thoughtsToMarkdown(thoughts);
  const filename = `thought-register-export-${new Date().toISOString().slice(0, 10)}.md`;
  downloadFile(filename, markdown, 'text/markdown');
}

async function exportThoughtsAsCsv() {
  const thoughts = await getThoughts();
  if (thoughts.length === 0) return;

  // Leading BOM so Excel opens the UTF-8 file without mangling non-ASCII text.
  const csv = '﻿' + thoughtsToCsv(thoughts);
  const filename = `thought-register-export-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csv, 'text/csv;charset=utf-8;');
}

// Full-fidelity backup: every thought plus its edit history, as one JSON
// file the app can read back in whole. This is the "own your data" format —
// no column contract, no lossy flattening.
async function exportThoughtsAsJson() {
  const thoughts = await getThoughts();
  const thoughtVersions = await idbGetAll(STORE_VERSIONS);
  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    thoughts,
    thoughtVersions,
  };
  const filename = `thought-register-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(filename, JSON.stringify(payload, null, 2), 'application/json');
}

// Upserts by id, so importing the same backup twice is harmless. Only
// touches records present in the file — never clears anything first.
async function importThoughtsFromJson(fileText) {
  let payload;
  try {
    payload = JSON.parse(fileText);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const thoughts = Array.isArray(payload.thoughts) ? payload.thoughts : Array.isArray(payload) ? payload : null;
  if (!thoughts) throw new Error('That file does not look like a Thought Register export.');

  let imported = 0;
  for (const thought of thoughts) {
    if (!thought || !thought.id) continue;
    await idbPut(STORE_THOUGHTS, { ...defaultThoughtFields(), ...thought });
    imported += 1;
  }

  const versions = Array.isArray(payload.thoughtVersions) ? payload.thoughtVersions : [];
  for (const version of versions) {
    await idbPut(STORE_VERSIONS, version);
  }

  return { imported, versionsImported: versions.length };
}
