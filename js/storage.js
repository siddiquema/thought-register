// storage: localStorage persistence for captured thoughts

const STORAGE_KEY = 'thoughts';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getThoughts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveThought(thought) {
  const thoughts = getThoughts();
  const entry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...thought,
  };
  thoughts.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  return entry;
}
