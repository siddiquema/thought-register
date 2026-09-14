// storage: thought persistence, backed by IndexedDB (see js/db.js).
//
// v0.1 stored everything as one JSON array under a single localStorage key.
// That can't hold edit history or relations cleanly, so this now lives in
// IndexedDB instead. The old localStorage data is migrated in automatically,
// once, and is never deleted — it stays behind as a safety net.

const LEGACY_STORAGE_KEY = 'thoughts';
const META_MIGRATION_KEY = 'migration';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Fields v0.1 never had. Every one of them defaults silently and stays out
// of the capture screen — they're only ever set from the detail view.
function defaultThoughtFields() {
  return {
    category: null,
    lifecycle: 'Captured',
    tags: [],
    project: null,
    importance: null,
    confidence: null,
    reviewStatus: 'unreviewed',
    lastReviewedAt: null,
  };
}

function readLegacyThoughts() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateFromLocalStorageIfNeeded() {
  const existing = await idbGet(STORE_META, META_MIGRATION_KEY);
  if (existing && existing.complete) return existing;

  const legacyThoughts = readLegacyThoughts();

  for (const legacy of legacyThoughts) {
    const entry = {
      ...defaultThoughtFields(),
      ...legacy,
      updatedAt: legacy.createdAt,
    };
    await idbPut(STORE_THOUGHTS, entry);
    await idbPut(STORE_VERSIONS, {
      thoughtId: entry.id,
      versionNumber: 1,
      snapshot: entry,
      changedAt: entry.createdAt,
      changeNote: 'Migrated from local storage',
    });
  }

  const migration = {
    key: META_MIGRATION_KEY,
    complete: true,
    migratedAt: new Date().toISOString(),
    migratedCount: legacyThoughts.length,
  };
  await idbPut(STORE_META, migration);
  return migration;
}

async function getThoughts() {
  const thoughts = await idbGetAll(STORE_THOUGHTS);
  return thoughts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getThought(id) {
  return idbGet(STORE_THOUGHTS, id);
}

async function saveThought(thought) {
  const now = new Date().toISOString();
  const entry = {
    ...defaultThoughtFields(),
    ...thought,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await idbPut(STORE_THOUGHTS, entry);
  await idbPut(STORE_VERSIONS, {
    thoughtId: entry.id,
    versionNumber: 1,
    snapshot: entry,
    changedAt: now,
    changeNote: 'Captured',
  });
  return entry;
}

async function updateThought(id, changes, changeNote) {
  const existing = await getThought(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...changes,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await idbPut(STORE_THOUGHTS, updated);

  const versions = await idbGetAllByIndex(STORE_VERSIONS, 'thoughtId', id);
  const nextVersionNumber = versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
  await idbPut(STORE_VERSIONS, {
    thoughtId: id,
    versionNumber: nextVersionNumber,
    snapshot: updated,
    changedAt: updated.updatedAt,
    changeNote: changeNote || 'Edited',
  });

  return updated;
}

async function deleteThought(id) {
  await idbDelete(STORE_THOUGHTS, id);
  await idbDeleteAllByIndex(STORE_VERSIONS, 'thoughtId', id);
  // Recorded even for a purely local delete: if this device ever syncs to
  // OneDrive later, the merge needs to know this id was deleted here rather
  // than treating it as "never seen" and pulling it back in from elsewhere.
  await idbPut(STORE_TOMBSTONES, { id, deletedAt: new Date().toISOString() });
}

async function getThoughtVersions(id) {
  const versions = await idbGetAllByIndex(STORE_VERSIONS, 'thoughtId', id);
  return versions.sort((a, b) => a.versionNumber - b.versionNumber);
}

async function getTombstones() {
  return idbGetAll(STORE_TOMBSTONES);
}
