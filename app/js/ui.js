// ui: rendering for the capture forms and the captured log

function renderThoughts(thoughts) {
  const list = document.getElementById('thought-list');
  const emptyState = document.getElementById('empty-state');
  const exportMarkdownBtn = document.getElementById('export-markdown-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  list.innerHTML = '';
  exportMarkdownBtn.disabled = thoughts.length === 0;
  exportCsvBtn.disabled = thoughts.length === 0;

  if (thoughts.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  thoughts.forEach((thought) => {
    list.appendChild(renderThoughtItem(thought));
  });
}

function renderThoughtItem(thought) {
  const item = document.createElement('li');
  item.className = 'thought-item';

  const meta = document.createElement('div');
  meta.className = 'thought-meta';
  meta.textContent = `${thought.type === 'structured' ? 'Structured' : 'Quick'} · ${formatTimestamp(thought.createdAt)}`;
  item.appendChild(meta);

  if (thought.topic) {
    const topic = document.createElement('div');
    topic.className = 'thought-topic';
    topic.textContent = thought.topic;
    item.appendChild(topic);
  }

  if (thought.type === 'structured') {
    item.appendChild(renderField('Observation', thought.observation));
    if (thought.interpretation) {
      item.appendChild(renderField('Interpretation', thought.interpretation));
    }
  } else {
    item.appendChild(renderField(null, thought.thought));
  }

  return item;
}

function renderField(label, value) {
  const wrap = document.createElement('div');
  wrap.className = 'thought-field';
  if (label) {
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    wrap.appendChild(strong);
  }
  wrap.appendChild(document.createTextNode(value));
  return wrap;
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString();
}

function showConfirmation(message) {
  const el = document.getElementById('save-confirmation');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(showConfirmation.timer);
  showConfirmation.timer = setTimeout(() => el.classList.remove('visible'), 1500);
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function setupTopicToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);

  toggle.addEventListener('click', () => {
    toggle.hidden = true;
    input.hidden = false;
    input.focus();
  });

  input.addEventListener('blur', () => {
    if (!input.value.trim()) {
      collapseTopicToggle(toggleId, inputId);
    }
  });
}

function collapseTopicToggle(toggleId, inputId) {
  document.getElementById(toggleId).hidden = false;
  document.getElementById(inputId).hidden = true;
}

function setMode(mode) {
  const isQuick = mode === 'quick';
  const quickForm = document.getElementById('quick-form');
  const structuredForm = document.getElementById('structured-form');
  const quickBtn = document.getElementById('mode-quick');
  const structuredBtn = document.getElementById('mode-structured');

  quickForm.hidden = !isQuick;
  structuredForm.hidden = isQuick;
  quickBtn.classList.toggle('active', isQuick);
  structuredBtn.classList.toggle('active', !isQuick);
  quickBtn.setAttribute('aria-selected', String(isQuick));
  structuredBtn.setAttribute('aria-selected', String(!isQuick));

  const focusTarget = isQuick
    ? document.getElementById('quick-thought')
    : document.getElementById('structured-observation');
  focusTarget.focus();
}
