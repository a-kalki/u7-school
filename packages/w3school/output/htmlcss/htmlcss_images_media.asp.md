# HTML and CSS Images & Media

* * *

## HTML & CSS: Images & Media

Add images, audio, and video to enrich your pages.

Combine semantic HTML with CSS to make media responsive and accessible.

* * *

## Images

Use `<img>` with `src` and `alt`.

The alt text describes the image for screen readers and shows if the image fails to load.

**Note:** Add `width` and `height` to reserve space. This prevents layout shift (CLS) while the image loads.

**Note:** `src` tells the browser where the file lives, and `alt` is short for "alternative text".

```javascript
<img src="images/team.jpg" alt="The design team collaborating" width="600">
```

This tag uses `src` for the file path and `alt` to describe the image for assistive tech and fallback scenarios.

If you want to read more or get an in-depth understanding, see [HTML Images](https://www.w3schools.com/html/html_images.asp) and [Picture Element](https://www.w3schools.com/html/html_images_picture.asp) in the HTML tutorial.

* * *

## Responsive images

Set `max-width: 100%` to let images shrink within their containers.

**Note:** This keeps pictures from overflowing on small screens while keeping their shape.

For very important (LCP) images, consider `decoding="async"` for non-blocking decode and `fetchpriority="high"` on the hero image.

```javascript
<img class="responsive" src="images/workspace.jpg" alt="Workspace">
```

The CSS sets `max-width: 100%` and `height: auto` so images scale down with their container while keeping aspect ratio.

If you want to read more about Responsive Images or get an in-depth understanding, go to [CSS Images](https://www.w3schools.com/css/css3_images.asp) in the CSS tutorial.

* * *

* * *

## Picture element

Serve different images per device or resolution.

**Note:** The `media` attribute works like a CSS media query and picks the right image for each screen size.

**Rule of thumb:** Use `<picture>` for art direction (different crops/types by screen) and plain `<img>` when one source works everywhere.

```javascript
<picture>
  <source media="(min-width: 768px)" srcset="images/hero-large.jpg">
  <img src="images/hero-small.jpg" alt="Mountain sunrise">
</picture>
```

The `<source>` with `media` selects the large image for wide screens; otherwise the `<img>` fallback is used.

If you want to read more about HTML Picture or get an in-depth understanding, go to [HTML Picture](https://www.w3schools.com/html/html_images_picture.asp) in the HTML tutorial.

* * *

## Background images

Use CSS `background-image` when images are decorative or repeated.

**Note:** Background images are not read by screen readers, so keep important content in regular `<img>` tags.

```javascript
.hero {
  background:url("images/gradient.jpg") center/cover no-repeat;
  padding:120px 24px;
  color:#fff;
}
```

The shorthand `background:url(...) center/cover no-repeat` sets the image, centers it, scales to cover, and prevents tiling.

If you want to read more about CSS Backgrounds or get an in-depth understanding, go to [CSS Backgrounds](https://www.w3schools.com/css/css_background.asp) in the CSS tutorial.

* * *

## Audio and video

HTML5 provides native players with `<audio>` and `<video>`.

**Note:** Native players are built into the browser, so users do not need extra plugins.

```javascript
<video controls width="640" poster="images/preview.png">
  <source src="media/intro.mp4" type="video/mp4">
  <source src="media/intro.webm" type="video/webm">
  Sorry, your browser doesn't support embedded video.
</video>
```

Multiple `<source>` formats improve compatibility.

The `poster` attribute shows a preview before playback.

More: [HTML Video](https://www.w3schools.com/html/html5_video.asp), [HTML Audio](https://www.w3schools.com/html/html5_audio.asp).

* * *

## Responsive video embeds

Wrap embedded videos (YouTube, Vimeo) in a container to preserve aspect ratio.

**Note:** Aspect ratio is the width-to-height relationship (for example 16:9).

Keeping it consistent prevents squished video.

```javascript
.video-wrapper {
  position:relative; 
  padding-bottom:56.25%; 
  height:0; 
  overflow:hidden;
}
.video-wrapper iframe {
  position:absolute; 
  top:0; 
  left:0; 
  width:100%; 
  height:100%; 
  border:0;
}
```

The container maintains a 16:9 ratio using `padding-bottom: 56.25%`.

The iframe is absolutely positioned to fill it.

If you want to read more about HTML YouTube or get an in-depth understanding, go to [HTML5 Video](https://www.w3schools.com/html/html5_video.asp) in the HTML tutorial.

* * *

## Lazy loading

Add `loading="lazy"` on images and iframes to defer loading offscreen media.

**Note:** Lazy loading waits to download media until the user scrolls near it, which speeds up the first page view.

* * *

## Accessibility

*   Provide descriptive `alt` text or `aria-label`.
*   Use `<figure>` + `<figcaption>` for complex visuals.
*   Add captions/subtitles (`track` elements) for video.

If you want to read more about HTML Accessibility or get an in-depth understanding, go to [HTML Accessibility](https://www.w3schools.com/html/html_accessibility.asp) in the HTML tutorial.

* * *

## Figure with caption demo

This demo shows an image wrapped in `<figure>` with a descriptive `<figcaption>`.

It also uses native `loading="lazy"`.

Syntax highlights: semantic grouping for image + caption, and a card-style wrapper via CSS.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <main>
    <figure>
      <img src="https://www.w3schools.com/html/img_chania.jpg" alt="The city of Chania" loading="lazy">
      <figcaption>Sunset in Chania, Greece.</figcaption>
    </figure>
  </main>
</body>
</html>
```

The CSS creates a card with padding and shadow, ensures the image scales to the container, and places the caption beneath the image.

* * *

* * *