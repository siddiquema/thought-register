# Capture Standard

Defines the minimum fields required to preserve a thought, and the two capture modes v0.1 supports.

## Quick Capture

- `thought` (required) — the freeform text being captured.
- `topic` (optional) — a short label for context.

## Structured Capture

- `observation` (required) — what was observed or noticed.
- `interpretation` (optional) — what it might mean.
- `topic` (optional) — a short label for context.

## Common fields

Added automatically at save time, never entered by the user:

- `id` — unique identifier.
- `type` — `"quick"` or `"structured"`.
- `createdAt` — ISO 8601 timestamp.

## Rule

Only one field is ever required per mode (`thought`, or `observation`). Requiring more than the minimum contradicts the capture-first philosophy — see [MANIFESTO.md](../MANIFESTO.md).

## CSV Export Schema

CSV is a portability format for spreadsheets and analysis tools (Excel, Google Sheets, Python, Power BI, R). It is not storage — the local database remains the source of truth (see [ADR-003](../ARCHITECTURE_DECISIONS.md), updated for the v2.0 IndexedDB migration), and [JSON export](../ARCHITECTURE_DECISIONS.md) is the full-fidelity backup/restore format. [Markdown export](../examples/sample-export.md) remains the preferred human-readable export.

Column order, fixed:

| Column | Source | Notes |
|---|---|---|
| ID | `id` | unique identifier |
| Type | `type` | `Quick` or `Structured` |
| Created At | `createdAt` | ISO 8601 timestamp |
| Topic | `topic` | blank if not set |
| Thought | `thought` | Quick Capture only; blank for Structured entries |
| Observation | `observation` | Structured Capture only; blank for Quick entries |
| Interpretation | `interpretation` | Structured Capture only; blank if not set |
| Tags | `tags` | semicolon-separated; blank if none |
| Category | `category` | blank if uncategorized |
| Lifecycle | `lifecycle` | `Captured` by default |
| Project | `project` | blank if not set |
| Importance | `importance` | `1`–`5`; blank if not set |
| Confidence | `confidence` | `1`–`5`; blank if not set |
| Review Status | `reviewStatus` | `unreviewed` or `reviewed` |
| Last Reviewed At | `lastReviewedAt` | ISO 8601 timestamp; blank if never reviewed |

New fields are always appended after the last column, never inserted earlier — a CSV column position is a stable contract once shipped. `Category` through `Last Reviewed At` were added in v2.0; everything before `Tags` is unchanged since v0.1.

Fields containing a comma, quote, or line break are quoted and internal quotes doubled, per standard CSV escaping. The file is UTF-8 with a leading byte-order mark, since Excel otherwise misreads non-ASCII text in UTF-8 CSVs.
