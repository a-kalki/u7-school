# HTML and CSS Debugging & Testing

* * *

## HTML & CSS: Debugging & Testing

Systematic debugging and testing catch visual regressions before they ship.

Combine browser DevTools, automated checks, and visual tests to keep interfaces stable across changes.

* * *

## Inspecting with DevTools

*   Use Elements panel to live-edit HTML/CSS and trace computed styles.
*   Toggle CSS classes, hover states, and pseudo-classes to debug interactions.
*   View layout overlays (box model, flexbox, grid) to diagnose alignment issues.

**Note:** The Elements panel shows exactly what the browser renders, so you can experiment safely before changing real files.

* * *

## Linting & formatting

*   Configure linters (Stylelint, ESLint) to enforce consistent patterns.
*   Use Prettier or editor formatters to maintain readable code.
*   Automate lint checks in CI to catch issues before merge.

**Note:** A linter reviews your code automatically and points out mistakes or style problems.

* * *

* * *

## Automated testing

*   Component/unit tests verify behavior of interactive widgets (e.g., Jest, Testing Library).
*   Integration tests use tools like Cypress or Playwright for end-to-end flows.
*   Visual regression tests (Chromatic, Percy, Happo) detect unintended styling changes.

**Note:** Visual regression tests compare screenshots; if something moves or changes color unexpectedly, they alert you.

* * *

## Manual QA

*   Test across browsers (Chrome, Edge, Firefox, Safari) and devices.
*   Check accessibility with keyboard navigation and screen readers.
*   Document test plans for key features and regression suites.

* * *

* * *