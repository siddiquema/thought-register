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
