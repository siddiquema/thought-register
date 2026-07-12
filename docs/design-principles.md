# Design Principles

Keep it simple.

## Capture should feel like writing, not filling out a form

The capture screen has no visible labels, no boxed inputs, and no required-field markers. A blank line to write on, a placeholder telling you what goes there, and nothing else competing for attention until you ask for it.

## Optional fields stay out of the way until asked for

Topic is optional in both capture modes. It's hidden behind a small "+ Topic" toggle rather than sitting on the screen by default — an empty optional field is still a field the eye has to process and decide to skip.

## Saving should match how deliberate the capture is

- **Quick Capture** is a passing thought: `Enter` saves it, the way sending a chat message works. `Shift+Enter` inserts a line break for a longer note.
- **Structured Capture** is a deliberate, multi-field entry: `Enter` stays a line break inside Observation/Interpretation so a multi-sentence note isn't cut short by accident. `Ctrl`/`Cmd+Enter` saves.

## No validation errors, ever

Required fields are enforced in JavaScript, not with the browser's native validation UI. An empty save silently does nothing rather than interrupting the user with a popup — nothing about capturing a thought should feel like being corrected.
