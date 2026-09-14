// search: text and faceted filtering over captured thoughts, entirely in
// memory. No indexing — see docs/search.md for why that's a deliberate
// choice, not a gap.

// Metadata, not content — never text-searched, so a query can't accidentally
// match a raw ID or timestamp string.
const SEARCH_EXCLUDED_FIELDS = ['id', 'createdAt', 'updatedAt', 'lastReviewedAt'];

function thoughtMatchesQuery(thought, normalizedQuery) {
  return Object.entries(thought).some(([key, value]) => {
    if (SEARCH_EXCLUDED_FIELDS.includes(key)) return false;
    if (typeof value === 'string') return value.toLowerCase().includes(normalizedQuery);
    if (Array.isArray(value)) {
      return value.some((item) => typeof item === 'string' && item.toLowerCase().includes(normalizedQuery));
    }
    return false;
  });
}

function searchThoughts(thoughts, query) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) return thoughts;
  return thoughts.filter((thought) => thoughtMatchesQuery(thought, normalizedQuery));
}

function thoughtMatchesFilters(thought, filters) {
  if (filters.category && thought.category !== filters.category) return false;
  if (filters.lifecycle && thought.lifecycle !== filters.lifecycle) return false;
  if (filters.type && thought.type !== filters.type) return false;
  if (filters.reviewStatus && thought.reviewStatus !== filters.reviewStatus) return false;
  if (filters.importance && String(thought.importance || '') !== String(filters.importance)) return false;
  if (filters.confidence && String(thought.confidence || '') !== String(filters.confidence)) return false;

  if (filters.project) {
    const project = (thought.project || '').toLowerCase();
    if (!project.includes(filters.project.trim().toLowerCase())) return false;
  }

  if (filters.tags && filters.tags.length > 0) {
    const thoughtTags = (thought.tags || []).map((tag) => tag.toLowerCase());
    const wanted = filters.tags.map((tag) => tag.toLowerCase());
    if (!wanted.some((tag) => thoughtTags.includes(tag))) return false;
  }

  if (filters.dateFrom && new Date(thought.createdAt) < new Date(filters.dateFrom)) return false;
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    if (new Date(thought.createdAt) > to) return false;
  }

  return true;
}

// The single entry point the UI calls: free-text query plus every facet.
// An empty/absent value in any facet means "no constraint" for that facet.
function filterThoughts(thoughts, filters) {
  const byQuery = searchThoughts(thoughts, filters.query);
  return byQuery.filter((thought) => thoughtMatchesFilters(thought, filters));
}
