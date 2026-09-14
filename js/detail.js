// detail: the single-thought view — read the full record, edit any field,
// change category/lifecycle, or delete it. This is the only place any of
// that happens; the capture screen never sees these fields.

let currentDetailId = null;

function initDetailSelects() {
  populateSelect(document.getElementById('detail-category'), CATEGORIES, { includeBlank: true, blankLabel: 'Uncategorized' });
  populateSelect(document.getElementById('detail-lifecycle'), LIFECYCLE_STATES);
  populateSelect(document.getElementById('detail-importance'), IMPORTANCE_LEVELS, { includeBlank: true, blankLabel: 'Not set' });
  populateSelect(document.getElementById('detail-confidence'), CONFIDENCE_LEVELS, { includeBlank: true, blankLabel: 'Not set' });
}

async function openDetail(id) {
  const thought = await getThought(id);
  if (!thought) {
    navigateToLog();
    return;
  }
  currentDetailId = id;
  // Show the section before filling it in: autoGrow() reads scrollHeight,
  // which is 0 for anything inside a still-hidden ancestor.
  showDetailView();
  fillDetailForm(thought);
}

function fillDetailForm(thought) {
  document.getElementById('detail-type').textContent = thought.type === 'structured' ? 'Structured' : 'Quick';
  document.getElementById('detail-timestamps').textContent =
    `Captured ${formatTimestamp(thought.createdAt)}` +
    (thought.updatedAt && thought.updatedAt !== thought.createdAt ? ` · Edited ${formatTimestamp(thought.updatedAt)}` : '');

  document.getElementById('detail-topic').value = thought.topic || '';

  const isStructured = thought.type === 'structured';
  document.getElementById('detail-quick-fields').hidden = isStructured;
  document.getElementById('detail-structured-fields').hidden = !isStructured;
  document.getElementById('detail-thought').value = thought.thought || '';
  document.getElementById('detail-observation').value = thought.observation || '';
  document.getElementById('detail-interpretation').value = thought.interpretation || '';

  document.getElementById('detail-category').value = thought.category || '';
  document.getElementById('detail-lifecycle').value = thought.lifecycle || 'Captured';
  document.getElementById('detail-project').value = thought.project || '';
  document.getElementById('detail-tags').value = (thought.tags || []).join(', ');
  document.getElementById('detail-importance').value = thought.importance || '';
  document.getElementById('detail-confidence').value = thought.confidence || '';
  document.getElementById('detail-reviewed').checked = thought.reviewStatus === 'reviewed';

  // Deferred a frame: scrollHeight isn't reliably measurable in the same
  // tick a hidden ancestor becomes visible, so measuring immediately here
  // can read 0 and leave the textarea collapsed.
  requestAnimationFrame(() => {
    document.querySelectorAll('#detail .detail-input').forEach((el) => {
      if (el.tagName === 'TEXTAREA') autoGrow(el);
    });
  });
}

function showDetailView() {
  document.getElementById('capture').hidden = true;
  document.getElementById('log').hidden = true;
  document.getElementById('detail').hidden = false;
}

function showLogView() {
  document.getElementById('capture').hidden = false;
  document.getElementById('log').hidden = false;
  document.getElementById('detail').hidden = true;
}

async function handleDetailSubmit(event) {
  event.preventDefault();
  if (!currentDetailId) return;

  const existing = await getThought(currentDetailId);
  if (!existing) return;

  const reviewed = document.getElementById('detail-reviewed').checked;
  const changes = {
    topic: document.getElementById('detail-topic').value.trim() || null,
    category: document.getElementById('detail-category').value || null,
    lifecycle: document.getElementById('detail-lifecycle').value,
    project: document.getElementById('detail-project').value.trim() || null,
    tags: parseTags(document.getElementById('detail-tags').value),
    importance: document.getElementById('detail-importance').value ? Number(document.getElementById('detail-importance').value) : null,
    confidence: document.getElementById('detail-confidence').value ? Number(document.getElementById('detail-confidence').value) : null,
    reviewStatus: reviewed ? 'reviewed' : 'unreviewed',
    lastReviewedAt: reviewed ? (existing.reviewStatus === 'reviewed' ? existing.lastReviewedAt : new Date().toISOString()) : null,
  };

  if (existing.type === 'structured') {
    const observation = document.getElementById('detail-observation').value.trim();
    if (!observation) return;
    changes.observation = observation;
    changes.interpretation = document.getElementById('detail-interpretation').value.trim() || null;
  } else {
    const thoughtText = document.getElementById('detail-thought').value.trim();
    if (!thoughtText) return;
    changes.thought = thoughtText;
  }

  const updated = await updateThought(currentDetailId, changes);
  fillDetailForm(updated);
  showDetailConfirmation('Saved.');
  await refreshLog();
  scheduleSync();
}

async function handleDetailDelete() {
  if (!currentDetailId) return;
  const confirmed = window.confirm('Delete this thought? This cannot be undone.');
  if (!confirmed) return;

  await deleteThought(currentDetailId);
  currentDetailId = null;
  await refreshLog();
  navigateToLog();
  scheduleSync();
}

function showDetailConfirmation(message) {
  const el = document.getElementById('detail-save-confirmation');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(showDetailConfirmation.timer);
  showDetailConfirmation.timer = setTimeout(() => el.classList.remove('visible'), 1500);
}
