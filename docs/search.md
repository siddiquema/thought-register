# Search

Search exists to help someone find a thought they remember writing. It is a retrieval feature, not a second experience — Capture is still the primary purpose of Thought Register (see [MANIFESTO.md](../MANIFESTO.md)).

## Behavior

- Results update as you type — no search button, no submit step.
- Matching is a plain, case-insensitive substring check. No fuzzy matching, no ranking, no AI.
- Clearing the search box (including the native input's clear button) immediately returns to the full timeline.
- If nothing matches, the log shows "No matching thoughts found." — a calm message, not a warning.

## Scope

Search checks every text field on a thought except its `id` and `createdAt`:

- Topic
- Thought
- Observation
- Interpretation
- Type (`quick` / `structured`)

Any future text field added to the data model is automatically searchable without code changes — search reads whatever string-valued fields exist on a thought, rather than a hardcoded list. `id` and `createdAt` are deliberately excluded so a query can't accidentally match a raw identifier or timestamp string.

## Limitations

- **Substring only.** Typos, synonyms, and word stemming aren't handled — "capture" won't match "captured" unless the substring itself appears.
- **No indexing.** Every search re-filters the full set of captured thoughts in memory. This is intentional: local-first data at this scale doesn't need an index, and adding one would be complexity the project doesn't need yet.
- **Read-only.** Search never writes to storage, and never affects what Markdown or CSV export produce — exporting always includes everything captured, regardless of the current search text.
