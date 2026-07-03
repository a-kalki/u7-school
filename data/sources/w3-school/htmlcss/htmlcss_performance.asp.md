# HTML and CSS Performance

* * *

## HTML & CSS: Performance

Fast experiences delight users and boost conversions.

Optimize HTML structure, CSS delivery, and rendering to ship interfaces that feel instant on every device.

* * *

## Optimize HTML markup

*   Serve semantic, lean markup-remove redundant wrappers and inline styles.
*   Load critical content first and defer non-essential sections.
*   Use modern image formats (`webp`, `avif`) and lazy-load non-critical media.

**Note:** "Critical" means the parts users need immediately, like the header and hero.

Lazy loading delays other media until the user scrolls near it.

* * *

## Efficient CSS delivery

*   Inline above-the-fold critical CSS, defer remaining stylesheets.
*   Minify and bundle CSS to reduce requests.
*   Use `media` attributes to load print or large-screen styles on demand.

**Note:** Above the fold means what users see before scrolling.

Keeping that CSS small makes the page feel faster.

If you want to read more about Responsive Images or get an in-depth understanding, go to [CSS3 Images](https://www.w3schools.com/css/css3_images.asp) in the CSS tutorial.

* * *

* * *

## Rendering performance

*   Prefer transforms and opacity changes for animations-avoid layout thrashing.
*   Reduce heavy filters, shadows, and excessive gradients on large areas.
*   Monitor paint and composite layers in browser DevTools.

**Note:** Layout thrashing happens when the browser recalculates layout many times; transforms avoid that extra work.

* * *

## Tooling & metrics

*   Measure Core Web Vitals (LCP, FID, CLS) with Lighthouse or WebPageTest.
*   Use DevTools Performance panel to profile layout and paint costs.
*   Track real-user metrics (RUM) to validate performance in production.

* * *

* * *