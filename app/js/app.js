// app: wiring between the capture forms, storage, and the log view

function init() {
  setMode('quick');
  renderThoughts(getThoughts());

  document.getElementById('mode-quick').addEventListener('click', () => setMode('quick'));
  document.getElementById('mode-structured').addEventListener('click', () => setMode('structured'));

  document.getElementById('quick-form').addEventListener('submit', handleQuickSubmit);
  document.getElementById('structured-form').addEventListener('submit', handleStructuredSubmit);
}

function handleQuickSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const topic = form.topic.value.trim();
  const thought = form.thought.value.trim();
  if (!thought) return;

  saveThought({ type: 'quick', topic: topic || null, thought });

  form.reset();
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

  form.reset();
  renderThoughts(getThoughts());
  showConfirmation('Saved.');
  document.getElementById('structured-observation').focus();
}

document.addEventListener('DOMContentLoaded', init);
