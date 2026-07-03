# HTML and CSS Accessibility

* * *

## HTML & CSS: Accessibility

Accessibility ensures everyone-including people with disabilities-can perceive, understand, navigate, and interact with your product.

Build inclusive experiences from the first line of HTML and CSS.

* * *

## Semantic structure

*   Use meaningful elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`).
*   Provide unique page titles, headings in order (h1 → h2 → h3).
*   Group related content with `<fieldset>` and `<legend>` for forms.

**Note:** Semantic tags tell assistive technology what each section means, so all users can navigate with ease.

If you want to read more about Semantic HTML or get an in-depth understanding, go to [HTML Semantic Elements](https://www.w3schools.com/html/html5_semantic_elements.asp) in our HTML tutorial.

* * *

## Text alternatives

*   Add descriptive `alt` text to images; leave decorative images empty (`alt=""`).
*   Caption videos, provide transcripts for audio.
*   Use `<figcaption>` for diagrams requiring long descriptions.

**Note:** Alt text should explain the purpose of the image, not just what it looks like.

* * *

* * *

## Keyboard support

*   Ensure all interactive elements are reachable with Tab/Shift+Tab.
*   Use native controls (`<button>`, `<a>`, `<input>`) or manage focus and ARIA for custom widgets.
*   Visible focus styles are essential-never remove them.

**Note:** Focus outlines show keyboard users where they are on the page; hiding them makes navigation impossible.

* * *

## Color & contrast

*   Maintain at least 4.5:1 contrast for body text, 3:1 for large text.
*   Do not rely on color alone to convey state; add icons, text, or patterns.
*   Test with contrast checkers and simulate color blindness when possible.

If you want to read more about CSS Accessibility or get an in-depth understanding, go to [CSS Accessibility](https://www.w3schools.com/css/css_accessibility.asp) in our CSS tutorial.

* * *

## ARIA and labeling

*   Use ARIA roles sparingly-only when native elements can't express behavior.
*   \`aria-label\` or \`aria-labelledby\` provides accessible names.
*   Keep ARIA state attributes in sync with UI changes.

**Note:** ARIA supplements HTML; if you use it without keeping states updated, screen readers announce the wrong information.

* * *

## Testing & auditing

*   Run automated checks (Lighthouse, axe) to catch common issues.
*   Navigate with keyboard only and screen readers (NVDA, VoiceOver).
*   Invite real users with disabilities to test workflows.

* * *

* * *