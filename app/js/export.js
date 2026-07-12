// export: convert captured thoughts into downloadable Markdown and CSV files

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

const CSV_COLUMNS = ['ID', 'Type', 'Created At', 'Topic', 'Thought', 'Observation', 'Interpretation', 'Tags'];

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
    '', // Tags: not yet part of the data model; reserved for a future field.
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

function exportThoughtsAsMarkdown() {
  const thoughts = getThoughts();
  if (thoughts.length === 0) return;

  const markdown = thoughtsToMarkdown(thoughts);
  const filename = `thought-register-export-${new Date().toISOString().slice(0, 10)}.md`;
  downloadFile(filename, markdown, 'text/markdown');
}

function exportThoughtsAsCsv() {
  const thoughts = getThoughts();
  if (thoughts.length === 0) return;

  // Leading BOM so Excel opens the UTF-8 file without mangling non-ASCII text.
  const csv = '﻿' + thoughtsToCsv(thoughts);
  const filename = `thought-register-export-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csv, 'text/csv;charset=utf-8;');
}
