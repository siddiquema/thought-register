// export: convert captured thoughts into a downloadable Markdown file

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
