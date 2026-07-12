// app: wiring between the capture forms, storage, and the log view

function init() {
  setMode('quick');
  renderThoughts(getThoughts());

  document.getElementById('mode-quick').addEventListener('click', () => setMode('quick'));
  document.getElementById('mode-structured').addEventListener('click', () => setMode('structured'));

  document.getElementById('quick-form').addEventListener('submit', handleQuickSubmit);
  document.getElementById('structured-form').addEventListener('submit', handleStructuredSubmit);

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
      document.getElementById('quick-form').requestSubmit();
    }
  });

  // Structured capture is more deliberate: Enter stays a line break,
  // Ctrl/Cmd+Enter saves so multi-line notes aren't cut short by accident.
  ['structured-observation', 'structured-interpretation'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        document.getElementById('structured-form').requestSubmit();
      }
    });
  });
}

function handleQuickSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const topic = form.topic.value.trim();
  const thought = form.thought.value.trim();
  if (!thought) return;

  saveThought({ type: 'quick', topic: topic || null, thought });

  resetCaptureForm(form, 'quick-topic-toggle', 'quick-topic');
  renderThoughts(getThoughts());
  showConfirmation('Saved.');
  document.getElementById('quick-thought').focus();
}

function handleStructuredSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const topic = form.topic.value.trim();
  const observation = form.observation.value.trim();
  const interpretation = form.interpretation.value.trim();
  if (!observation) return;

  saveThought({
    type: 'structured',
    topic: topic || null,
    observation,
    interpretation: interpretation || null,
  });

  resetCaptureForm(form, 'structured-topic-toggle', 'structured-topic');
  renderThoughts(getThoughts());
  showConfirmation('Saved.');
  document.getElementById('structured-observation').focus();
}

function resetCaptureForm(form, topicToggleId, topicInputId) {
  form.reset();
  form.querySelectorAll('.capture-input').forEach((textarea) => autoGrow(textarea));
  collapseTopicToggle(topicToggleId, topicInputId);
}

document.addEventListener('DOMContentLoaded', init);
