# HTML and CSS Landing Page Project

* * *

## HTML & CSS: Landing Page Project

Launch a marketing landing page that highlights product value, captures leads, and works across devices.

This project covers layout, component design, and responsive polish.

* * *

## Step 1: Project skeleton

Create the basic HTML file and include your stylesheet.

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Product Landing Page</title>
  <link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <header class="hero"></header>
  <main>
    <section class="features"></section>
    <section class="testimonials"></section>
    <section class="pricing"></section>
    <section class="faq"></section>
  </main>
  <footer class="site-footer"></footer>
</body>
</html>
```

**Why this:** The skeleton sets language, charset, and viewport so text renders correctly and the layout fits phones.

**Tip:** Keep main content inside `<main>` and use semantic sections for clarity.

* * *

## Step 2: Hero section

Add a clear headline, a short subhead, and one primary call to action (CTA).

```javascript
<header class="hero">
  <h1>Grow faster with Acme</h1>
  <p class="subhead">Launch pages in minutes. No code required.</p>
  <a class="btn btn-primary" href="#pricing">Start Free Trial</a>
</header>
```

**Why this:** One clear headline and one main button avoid confusion. A soft background color keeps focus on the text and CTA without being harsh.

* * *

* * *

## Step 3: Features grid

Explain core benefits with a simple responsive grid.

```javascript
<section class="features">
  <article>
    <h2>Easy editing</h2>
    <p>Update pages quickly with reusable blocks.</p>
  </article>
  <article>
    <h2>Fast by default</h2>
    <p>Responsive and accessible out of the box.</p>
  </article>
  <article>
    <h2>SEO friendly</h2>
    <p>Clean HTML and helpful meta tags.</p>
  </article>
</section>
```

**How it works:** `repeat(auto-fit, minmax(220px, 1fr))` fills the row with as many cards as fit. On narrow screens, cards stack; on wide screens, more cards fit per row.

* * *

## Step 4: Social proof

Show logos or a short testimonial to build trust.

```javascript
<section class="testimonials" aria-label="Trusted by">
  <ul class="logos">
    <li><img src="logos/alpha.svg" alt="Alpha"></li>
    <li><img src="logos/bravo.svg" alt="Bravo"></li>
    <li><img src="logos/charlie.svg" alt="Charlie"></li>
  </ul>
</section>
```

**Accessibility:** Logo images need short, descriptive `alt` text. Keep logos modest in size so they do not overpower the content.

* * *

## Step 5: Pricing section

Give clear tiers with one primary CTA.

```javascript
<section id="pricing" class="pricing">
  <article class="plan">
    <h3>Starter</h3>
    <p class="price">$9/mo</p>
    <ul><li>Basic features</li><li>Email support</li></ul>
    <a class="btn btn-primary" href="#">Choose Starter</a>
  </article>
  <article class="plan featured">
    <h3>Pro</h3>
    <p class="price">$29/mo</p>
    <ul><li>All features</li><li>Priority support</li></ul>
    <a class="btn btn-primary" href="#">Start Pro</a>
  </article>
</section>
```

**Tip:** Highlight one plan (the "featured" plan) to make the decision easy. Ensure button labels describe the action (for example, "Start Pro").

* * *

## Step 6: FAQ

Answer common questions using accessible disclosure controls.

```javascript
<section class="faq" aria-label="Frequently asked questions">
  <details>
    <summary>Can I cancel anytime?</summary>
    <p>Yes, you can cancel with one click in settings.</p>
  </details>
  <details>
    <summary>Do you offer student discounts?</summary>
    <p>We offer 30% off for students. Contact support.</p>
  </details>
</section>
```

**Why <details>:** It provides built-in disclosure behavior and keyboard support. Keep the summary short and the content clear.

* * *

## Step 7: Responsive tweaks

Start mobile-first and add breakpoints for larger screens.

```javascript
@media (min-width: 960px) {
  .hero {padding:100px 20px}
  .features, .pricing {gap:32px}
}
```

**Mobile-first:** Write base styles for small screens, then add `@media (min-width: ...)` to enhance the layout on larger screens.

* * *

## Step 8: Polish checklist

*   Run Lighthouse for performance, accessibility, and SEO.
*   Check color contrast for text and buttons.
*   Test keyboard navigation for all interactive elements.

**Note:** CTA means call to action, like "Start free trial". Keep one primary CTA per section.

* * *

* * *