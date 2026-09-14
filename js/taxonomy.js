// taxonomy: fixed vocabularies for thinking category and lifecycle status.
// Both are optional at capture time (see docs/capture-standard.md) and are
// only ever set from the thought detail view, never on the capture screen.

const CATEGORIES = [
  'Observation',
  'Idea',
  'Question',
  'Hypothesis',
  'Decision',
  'Lesson Learned',
  'Reflection',
  'Experiment',
  'Opportunity',
  'Problem',
  'Other',
];

// A thought starts life as "Captured" automatically; every later state is a
// deliberate move the person makes from the detail view.
const LIFECYCLE_STATES = [
  'Captured',
  'Reviewing',
  'Researching',
  'Planning',
  'In Progress',
  'Completed',
  'Dropped',
  'Archived',
];

const IMPORTANCE_LEVELS = [1, 2, 3, 4, 5];
const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5];
