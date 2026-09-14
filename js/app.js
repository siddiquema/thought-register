// app: wiring between the capture forms, storage, the log view, the detail
// view, filters, and routing.

async function init() {
  await migrateFromLocalStorageIfNeeded();
  await showMigrationBannerIfNeeded();

  initDetailSelects();
  initFilterSelects();

  setMode('quick');
  await refreshLog();
  await renderRoute();

  document.getElementById('mode-quick').addEventListener('click', () => setMode('quick'));
  document.getElementById('mode-structured').addEventListener('click', () => setMode('structured'));

  document.getElementById('quick-form').addEventListener('submit', handleQuickSubmit);
  document.getElementById('structured-form').addEventListener('submit', handleStructuredSubmit);

  document.getElementById('export-markdown-btn').addEventListener('click', exportThoughtsAsMarkdown);
  document.getElementById('export-csv-btn').addEventListener('click', exportThoughtsAsCsv);
  document.getElementById('export-json-btn').addEventListener('click', exportThoughtsAsJson);
  document.getElementById('import-json-input').addEventListener('change', handleImportJson);

  document.getElementById('search-input').addEventListener('input', refreshLog);

  document.getElementById('filter-toggle').addEventListener('click', toggleFilterPanel);
  document.querySelectorAll('#filter-fields select, #filter-fields input').forEach((el) => {
    el.addEventListener('input', refreshLog);
    el.addEventListener('change', refreshLog);
  });
  document.getElementById('filter-clear').addEventListener('click', clearFilters);

  document.getElementById('detail-back').addEventListener('click', navigateToLog);
  document.getElementById('detail-form').addEventListener('submit', handleDetailSubmit);
  document.getElementById('detail-delete').addEventListener('click', handleDetailDelete);

  onRouteChange(renderRoute);

  setupTopicToggle('quick-topic-toggle', 'quick-topic');
  setupTopicToggle('structured-topic-toggle', 'structured-topic');

  document.querySelectorAll('.capture-input').forEach((textarea) => {
    textarea.addEventListener('input', () => autoGrow(textarea));
  });

  // Quick capture is a fleeting thought: Enter saves it, like sending a message.
  // Shift+Enter still inserts a line break for a longer thought.
  document.getElementById('quick-thought').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitForm(document.getElementById('quick-form'));
    }
  });

  // Structured capture is more deliberate: Enter stays a line break,
  // Ctrl/Cmd+Enter saves so multi-line notes aren't cut short by accident.
  ['structured-observation', 'structured-interpretation'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        submitForm(document.getElementById('structured-form'));
      }
    });
  });
}

function submitForm(form) {
  // requestSubmit() isn't available on Safari < 16; fall back to a plain
  // submit event so Enter-to-save still works there.
  if (typeof form.requestSubmit === 'function') {
    form.requestSubmit();
  } else {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
}

async function handleQuickSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const topic = form.topic.value.trim();
  const thought = form.thought.value.trim();
  if (!thought) return;

  await saveThought({ type: 'quick', topic: topic || null, thought });

  resetCaptureForm(form, 'quick-topic-toggle', 'quick-topic');
  await refreshLog();
  showConfirmation('Saved.');
  document.getElementById('quick-thought').focus();
}

async function handleStructuredSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const topic = form.topic.value.trim();
  const observation = form.observation.value.trim();
  const interpretation = form.interpretation.value.trim();
  if (!observation) return;

  await saveThought({
    type: 'structured',
    topic: topic || null,
    observation,
    interpretation: interpretation || null,
  });

  resetCaptureForm(form, 'structured-topic-toggle', 'structured-topic');
  await refreshLog();
  showConfirmation('Saved.');
  document.getElementById('structured-observation').focus();
}

function resetCaptureForm(form, topicToggleId, topicInputId) {
  form.reset();
  form.querySelectorAll('.capture-input').forEach((textarea) => autoGrow(textarea));
  collapseTopicToggle(topicToggleId, topicInputId);
}

async function refreshLog() {
  const thoughts = await getThoughts();
  renderThoughts(thoughts, collectFilters());
}

function collectFilters() {
  return {
    query: document.getElementById('search-input').value,
    category: document.getElementById('filter-category').value,
    lifecycle: document.getElementById('filter-lifecycle').value,
    type: document.getElementById('filter-type').value,
    reviewStatus: document.getElementById('filter-review-status').value,
    importance: document.getElementById('filter-importance').value,
    confidence: document.getElementById('filter-confidence').value,
    project: document.getElementById('filter-project').value,
    tags: parseTags(document.getElementById('filter-tags').value),
    dateFrom: document.getElementById('filter-date-from').value,
    dateTo: document.getElementById('filter-date-to').value,
  };
}

function initFilterSelects() {
  populateSelect(document.getElementById('filter-category'), CATEGORIES, { includeBlank: true });
  populateSelect(document.getElementById('filter-lifecycle'), LIFECYCLE_STATES, { includeBlank: true });
  populateSelect(document.getElementById('filter-importance'), IMPORTANCE_LEVELS, { includeBlank: true });
  populateSelect(document.getElementById('filter-confidence'), CONFIDENCE_LEVELS, { includeBlank: true });
}

function toggleFilterPanel() {
  const fields = document.getElementById('filter-fields');
  const toggle = document.getElementById('filter-toggle');
  const isHidden = fields.hidden;
  fields.hidden = !isHidden;
  toggle.setAttribute('aria-expanded', String(isHidden));
}

function clearFilters() {
  document.querySelectorAll('#filter-fields select').forEach((el) => { el.value = ''; });
  document.querySelectorAll('#filter-fields input').forEach((el) => { el.value = ''; });
  refreshLog();
}

async function handleImportJson(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const result = await importThoughtsFromJson(text);
    await refreshLog();
    showConfirmation(`Imported ${result.imported} thought${result.imported === 1 ? '' : 's'}.`);
  } catch (error) {
    window.alert(error.message || 'Import failed.');
  } finally {
    input.value = '';
  }
}

async function showMigrationBannerIfNeeded() {
  const migration = await idbGet(STORE_META, META_MIGRATION_KEY);
  if (!migration || migration.migratedCount === 0) return;

  const dismissed = await idbGet(STORE_META, 'migrationBannerDismissed');
  if (dismissed && dismissed.value) return;

  const banner = document.getElementById('migration-banner');
  document.getElementById('migration-banner-text').textContent =
    `Upgraded local storage — ${migration.migratedCount} thought${migration.migratedCount === 1 ? '' : 's'} carried over. Your original data is untouched.`;
  banner.hidden = false;

  document.getElementById('migration-banner-backup').addEventListener('click', async () => {
    await exportThoughtsAsJson();
    await idbPut(STORE_META, { key: 'migrationBannerDismissed', value: true });
    banner.hidden = true;
  });
  document.getElementById('migration-banner-dismiss').addEventListener('click', async () => {
    await idbPut(STORE_META, { key: 'migrationBannerDismissed', value: true });
    banner.hidden = true;
  });
}

async function renderRoute() {
  const route = parseRoute();
  if (route.view === 'detail') {
    await openDetail(route.id);
  } else {
    showLogView();
  }
}

document.addEventListener('DOMContentLoaded', init);
