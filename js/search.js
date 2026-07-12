// search: read-only substring filtering over captured thoughts

// Metadata, not content — never searched, so a query can't accidentally
// match a raw ID or timestamp string.
const SEARCH_EXCLUDED_FIELDS = ['id', 'createdAt'];

function thoughtMatchesQuery(thought, normalizedQuery) {
  return Object.entries(thought).some(([key, value]) => {
    if (SEARCH_EXCLUDED_FIELDS.includes(key)) return false;
    return typeof value === 'string' && value.toLowerCase().includes(normalizedQuery);
  });
}

function searchThoughts(thoughts, query) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) return thoughts;
  return thoughts.filter((thought) => thoughtMatchesQuery(thought, normalizedQuery));
}
