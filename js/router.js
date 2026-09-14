// router: minimal hash-based view switching (log <-> thought detail).
// No SPA framework — just enough to deep-link a single thought and support
// the browser's own back button.

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [view, id] = hash.split('/');
  if (view === 'thought' && id) return { view: 'detail', id };
  return { view: 'log' };
}

function navigateToLog() {
  window.location.hash = '';
}

function navigateToThought(id) {
  window.location.hash = `#/thought/${id}`;
}

function onRouteChange(handler) {
  window.addEventListener('hashchange', handler);
}
