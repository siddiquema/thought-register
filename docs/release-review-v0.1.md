# Release Review — v0.1

Scope: complete repository review ahead of Thought Register's first public release. Covers TR-001 through TR-006 (approved) plus this review pass (RR-001). No new features were added. A small number of defects discovered during the review were fixed directly, since they were corrections to already-approved behavior, not new scope — each is called out explicitly below.

## Repository

**Structure**: clean and purposeful. Governance docs live at root (`README`, `MANIFESTO`, `VISION`, `ROADMAP`, `NON_GOALS`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `ARCHITECTURE_DECISIONS`, `CHANGELOG`), the application lives in `app/`, supplementary docs in `docs/`, sample data in `examples/`, capture templates in `templates/`, brand assets in `media/`. No unexplained top-level clutter.

**Documentation completeness**: uneven. The governance docs and the docs added alongside each shipped feature (`capture-standard.md`, `design-principles.md`, `search.md`) are complete and accurate. Three files are not: `docs/philosophy.md`, `docs/roadmap-v1.md`, and `docs/user-guide.md` are one-line stubs left over from the original scaffold, never filled in, and not linked from `README.md`'s documentation index. `docs/philosophy.md` and `docs/roadmap-v1.md` duplicate ground already covered by root `MANIFESTO.md`/`ROADMAP.md`. `docs/user-guide.md`, on the other hand, is a real gap — there is no user-facing "how to use this" document anywhere, only developer-facing docs. Logged under Technical Debt.

**Naming consistency**: consistent within each layer — root docs are `UPPER_CASE.md`, `docs/` files are `lower-kebab-case.md`, JS identifiers are camelCase, HTML ids are kebab-case. No inconsistencies found.

**Fixed during this review**: `LICENSE` contained only the string `MIT License` with no actual license text — copyright notice or permission grant. An MIT-licensed public repository without the license body is not actually MIT-licensed. Replaced with the complete standard MIT license text.

## Application

**Capture flow**: Quick Capture and Structured Capture both work as specified — minimal fields, Topic tucked behind a progressive-disclosure toggle, `Enter`/`Ctrl+Enter` save behavior matching how deliberate each mode is, silent no-op on empty submit instead of native validation popups. Verified end-to-end in-browser across TR-002/TR-003 and re-verified in this review.

**Search**: live substring filtering across Topic/Thought/Observation/Interpretation/Type, generic over a thought's string fields, read-only. Performance-tested at 5,000 entries in TR-006 (~44ms to filter). No issues found in this review.

**Export**: Markdown and CSV export both produce correct output, correctly omit blank optional fields, and correctly escape special characters. One real defect found and fixed — see Security below.

**Mobile usability**: verified at a 375×812 viewport throughout TR-002/003/004/005/006 — single-column layout, no horizontal scroll, adequate tap target sizing, auto-growing textareas. No new mobile issues found in this review.

**Not implemented**: two features declared in scope (`README.md`, `ROADMAP.md` v0.1 list) do not exist at all:
- **Dark Mode** — no dark theme, no toggle, no `prefers-color-scheme` handling anywhere in `app/css/styles.css`.
- **Installable PWA** — `app/manifest.json` is still `{}`, `app/service-worker.js` is still `// placeholder`, and `index.html` has no `<link rel="manifest">` or service worker registration. There is currently no installable app and no offline caching.

This is the central finding of this review — see Release Recommendation.

## Accessibility

**Keyboard navigation**: fully operable without a mouse. Tab order follows visual order (thought → topic toggle → save). Mode tabs, topic toggles, and export/search controls are all native `<button>`/`<input>` elements, so they're keyboard-operable by default. No keyboard traps found.

**Labels**: every form control has a real `<label>` (visually hidden where a placeholder carries the visible hint), so screen readers get a name that placeholder text alone wouldn't reliably provide.

**Screen readers**: the mode toggle used `role="tablist"`/`role="tab"`/`aria-selected` but was missing the other half of the ARIA tabs pattern — the panels weren't marked `role="tabpanel"` and there was no `aria-controls`/`aria-labelledby` relationship between tabs and panels. **Fixed during this review**: added `aria-controls` on both tab buttons and `role="tabpanel"` + `aria-labelledby` on both forms. Also added `aria-live="polite"` to the results list and both empty-state messages, matching the pattern already used for the save confirmation, so a screen reader user gets told when search results change instead of only sighted users seeing it.

**Not verified**: none of this was tested with a real screen reader (VoiceOver/NVDA/JAWS) — verification in every ticket so far has been DOM-state inspection via browser automation, which confirms the accessibility *tree* is correct but not the lived experience. Logged under Technical Debt.

## Performance

**Startup**: five small script files plus one stylesheet, no build step, no bundling — total payload is a few KB. Fine for a page loaded fresh, but without a service worker there's no caching benefit on repeat visits (see PWA gap above).

**Storage**: `localStorage`, synchronous, tested to 5,000 entries with no perceptible lag. **Not handled**: `saveThought()` in `app/js/storage.js` has no error handling around `localStorage.setItem()`. If the browser's storage quota is exceeded (or storage is unavailable, e.g. some private-browsing modes), `setItem` throws, the exception is uncaught, and the capture silently fails — the form doesn't clear, no confirmation shows, and the user gets no indication their thought wasn't saved. This is a real reliability gap. Not fixed in this review because a proper fix needs a new user-facing error state, which is out of scope for a review pass — flagged as a follow-up ticket.

**Search**: linear scan, ~44ms at 5,000 entries (measured in TR-006). Comfortably instant at the scale a personal capture tool will actually reach.

**Export**: both formats build the full output string synchronously in memory before triggering a download. Not tested past 5,000 entries, but the underlying operation (string concatenation + `Blob`) is the same order of work as rendering the list, which is already known-fast at that scale.

## Security

**LocalStorage usage**: plaintext, per-origin, never transmitted anywhere — consistent with the project's offline-first, no-backend architecture (ADR-002, ADR-003). No credentials or sensitive-by-definition data are stored. Only realistic exposure is anyone with access to the same browser profile/device, which is an accepted trade-off of local-only storage, not a defect.

**Injection risks**: no use of `innerHTML` (or any other raw-HTML sink) with thought content anywhere in `app/js/ui.js` — all rendering goes through `textContent`/`createTextNode`. No XSS vector from captured content. `getThoughts()` wraps `JSON.parse` in try/catch, so corrupted `localStorage` content degrades to an empty list rather than crashing the app.

**Export safety — fixed during this review**: CSV export had no protection against **CSV/formula injection** (CWE-1236). A thought whose Topic, Thought, Observation, or Interpretation began with `=`, `+`, `-`, or `@` would be interpreted as a formula by Excel, Google Sheets, or LibreOffice when the exported file was opened — a well-known, real vulnerability class for any CSV-export feature. Fixed by prefixing such values with a single quote before quoting/escaping (`neutralizeFormulaInjection` in `app/js/export.js`), the standard mitigation, which neutralizes formula interpretation without changing the visible content once opened. Verified with a thought containing `=SUM(A1:A9)` as Topic — confirmed the exported field is now `'=SUM(A1:A9)`.

Markdown export has a related, lower-severity, unfixed edge case: a thought containing a line that looks like a Markdown heading or horizontal rule (e.g. a line starting with `## ` or `---`) will render as such in whatever tool the user later opens the exported `.md` file with. This isn't a Thought Register vulnerability — it doesn't execute code, and Thought Register itself never renders the exported file — but it's worth documenting as an inherent limitation of plain-text Markdown export. Logged under Technical Debt.

## Browser Compatibility

Target is modern evergreen browsers (Chrome, Firefox, Safari, Edge) — consistent with the project's no-polyfill, no-build-step approach. Reviewed the JavaScript for anything that would silently fail on an older but still-in-use browser:

**Fixed during this review**: the Enter-to-save and Ctrl/Cmd+Enter-to-save shortcuts called `form.requestSubmit()`, which doesn't exist on Safari < 16 (still present on iPhones that can't update past iOS 15). On those browsers, pressing Enter would throw an uncaught `TypeError` and silently do nothing — the Save button would still work, but the keyboard shortcut approved in TR-003 would quietly break for a real, still-active class of users. Fixed with a `submitForm()` helper that falls back to dispatching a plain `submit` event when `requestSubmit` isn't available. Verified by simulating its absence in-browser — the fallback path saves correctly.

Everything else in the codebase (template literals, `const`/`let`, arrow functions, object/array spread, `Array.prototype` methods, `Blob`/`URL.createObjectURL`, CSS custom properties, `<input type="search">`) is broadly supported across current Chrome, Firefox, Safari, and Edge, and has no known gaps.

## Technical Debt

Every known limitation, in priority order:

1. **Dark Mode and Installable PWA are unbuilt**, despite being declared v0.1 scope. This is the release-blocking item — see Release Recommendation.
2. **No error handling for storage quota / unavailable storage.** A full quota or disabled storage causes a silent, invisible capture failure. Needs a follow-up ticket with a real (minimal) error-state UI.
3. **`docs/philosophy.md`, `docs/roadmap-v1.md`, `docs/user-guide.md`** are empty stubs; the first two duplicate root docs and should likely be removed, the third is a genuine gap and should be written before a public release, since new users currently have no onboarding document at all.
4. **`media/banner.png` and `media/logo.png` are 0-byte placeholder files**, and `app/assets/logo.svg` is placeholder "TR" text art — none are referenced anywhere yet (no favicon, no manifest icons), so currently harmless, but blocking for PWA installability (icons are a required manifest field) and for any real branding.
5. **`examples/sample-thought.md`, `examples/sample-thoughts.csv`, and all of `templates/*.md`** are still empty field-list stubs, inconsistent with `examples/sample-export.md`/`.csv`, which were filled in with realistic content during TR-004/005.
6. **No real assistive-technology testing.** All accessibility verification so far has been automated DOM/ARIA-tree inspection, not a real screen reader.
7. **Markdown export has no protection against a captured thought's text visually resembling Markdown structure** (a heading or horizontal rule) when rendered by whatever tool opens the exported file. Not a vulnerability, but worth documenting as an inherent limitation.
8. **No automated test suite.** All verification across every ticket has been manual, in-browser, via automation tooling — there's no repeatable regression suite a contributor can run.

## Future Enhancements

Listed for visibility only — none of these are being implemented now, and none should be started without a dedicated ticket:

- A real onboarding/user guide (fills Technical Debt item 3).
- Graceful storage-quota-exceeded handling with a visible (but calm, non-alarming) error state.
- Real logo/icon assets sized correctly for PWA manifest requirements, plus a favicon.
- A lightweight, dependency-free test harness for the pure functions already in `app/js/` (`searchThoughts`, `thoughtsToMarkdown`, `thoughtsToCsv`, `csvEscapeField`) — all are pure and unit-testable without a framework.
- Everything already listed in `ROADMAP.md` under "Beyond v0.1" and "Explicitly not on this roadmap" remains unchanged by this review.

## Release Recommendation

**Not ready.**

Six of the eight features declared in `README.md`'s and `ROADMAP.md`'s v0.1 scope are built, tested, and already approved: Quick Capture, Structured Capture, Local Storage, Markdown Export, CSV Export, and Search. All six held up under this review, with three real defects found and fixed (broken LICENSE, CSV formula injection, a Safari compatibility gap) and no functional regressions introduced by those fixes.

The other two — **Dark Mode** and **Installable PWA** — do not exist in any form. This isn't a matter of polish or minor fixes; it's the majority of two whole features (a theme system, and a valid manifest + working service worker + install flow) that haven't been started. Calling the current state "v0.1.0" would ship a release that doesn't match its own stated scope.

Two paths forward, both legitimate — this is a product decision, not an engineering one:

1. **Build Dark Mode and Installable PWA**, then re-run this review before tagging v0.1.0 as originally scoped.
2. **Re-scope this release** — update `README.md`/`ROADMAP.md` to declare a smaller v0.1.0 (Capture + Search + Export only), move Dark Mode and PWA into a v0.1.1 or v0.2 milestone, and ship what's actually done today.

I'm not recommending a version number to tag right now, since neither path has been chosen yet. Once one is, the six completed features are solid enough that the remaining work is either "finish the last two features" (path 1) or "update two documents" (path 2) — not a rebuild.

## Resolution

Path 2 was chosen. `README.md` and `ROADMAP.md` now define v0.1 as the **Capture Release** (Quick Capture, Structured Capture, Local Storage, Markdown Export, CSV Export, Search) — exactly the six features that were already built, tested, and approved. Installable PWA is now v0.2. Dark Mode moved to the Future Enhancements list, unscheduled. No code changed as part of this re-scoping — only `README.md`, `ROADMAP.md`, and `CHANGELOG.md`. **v0.1.0 is ready to release** under this corrected scope.
