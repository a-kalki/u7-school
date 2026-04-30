# HTML and CSS Forms & Validation

* * *

## HTML & CSS: Forms & Validation

Forms collect user input.

Combine semantic elements with thoughtful styling and validation for a great user experience.

* * *

## Form structure

Wrap controls in `<form>`.

Include `action` and `method` when sending data to a server.

**Note:** `action` is the URL that receives the form data, and `method` (usually `post` or `get`) tells the browser how to send it.

`GET` puts form data in the URL (good for searches). `POST` sends data in the request body (good for sign-ups).

```javascript
<form action="/action_page.php" method="post" class="signup">
  <label for="name">Name</label>
  <input type="text" id="name" name="name" required>
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required>
  <button type="submit">Join</button>
</form>
```

This basic form uses `label` elements bound via `for` and `id`, `required` attributes for built-in checks, and a POST submission to `/signup`.

Help the browser with `autocomplete` and `name` attributes, for example: `<input type="email" id="email" name="email" autocomplete="email" required>`.

Learn more: [HTML Forms](https://www.w3schools.com/html/html_forms.asp), [Form Elements](https://www.w3schools.com/html/html_form_elements.asp), [Input Types](https://www.w3schools.com/html/html_form_input_types.asp).

* * *

## Labels and accessibility

*   Use `<label for>` to bind text to inputs.
*   Add `aria-describedby` for helper text.
*   Group related controls with `<fieldset>` and `<legend>`.

If you want to read more about Form Attributes or get an in-depth understanding, go to [Form Attributes](https://www.w3schools.com/html/html_forms_attributes.asp) in the HTML tutorial.

* * *

* * *

## Styling forms with CSS

Style labels, inputs, focus states, and buttons to create a cohesive layout.

```javascript
.signup {
  max-width:420px; 
  margin:0 auto; 
  display:grid; 
  gap:16px; 
  background:#fff; 
  padding:32px; 
  border-radius:16px; 
  box-shadow:0 15px 35px rgba(15,23,42,0.12);
} 
.signup label {
  font-weight:600;
}
.signup input {
  padding:12px 14px; 
  border:1px solid #d9e2ec; 
  border-radius:10px; 
  font-size:1rem;
}
.signup input:focus {
  border-color:#2563eb; 
  outline:none; 
  box-shadow:0 0 0 3px rgba(37,99,235,0.2);
} 
.signup button {
  background:#04AA6D; 
  color:#fff; 
  border:none; 
  padding:12px 18px; 
  border-radius:999px; 
  font-weight:600; 
  cursor:pointer;
}
.signup button:hover {
  background:#028a56;
}
```

The CSS grid creates consistent spacing.

Focus styles are applied with `:focus` to improve keyboard accessibility and visibility.

If you want to read more about CSS Forms or get an in-depth understanding, go to [CSS Forms](https://www.w3schools.com/css/css_form.asp) in the CSS tutorial.

* * *

## Input types

Modern HTML provides built-in validation by choosing appropriate types.

*   `type="email"` - ensures valid email format.
*   `type="tel"`, `type="url"`, `type="number"`, `type="date"`, etc.
*   Use `min`, `max`, `step`, `pattern`, and `required` attributes as needed.

If you want to read more about Input Types or get an in-depth understanding, go to [Input Types](https://www.w3schools.com/html/html_form_input_types.asp) in the HTML tutorial.

* * *

## Validation feedback

Leverage HTML5 validation and enhance with CSS pseudo-classes `:valid` / `:invalid`.

**Note:** Pseudo-classes are special selectors that target elements in a certain state, such as when the input passes or fails validation.

```javascript
input:invalid {
  border-color:#dc2626;
}
input:valid {
  border-color:#16a34a;
}
```

**Accessibility tip:** You can mark failed fields with `aria-invalid="true"` and point to helper text using `aria-describedby`.

The browser toggles the `:invalid` and `:valid` states based on the input's value and type, allowing simple, no-JS feedback.

Custom messages: use the `title` attribute or JavaScript `setCustomValidity`.

* * *

## Form layout

Use CSS grid or flexbox to align labels and inputs.

```javascript
.form-grid {
  display:grid; 
  grid-template-columns:1fr 1fr; 
  gap:16px;
}
.form-grid .full {
  grid-column: span 2;
}
```

Using CSS Grid, the `.full` utility spans an input across both columns for labels or wide fields.

If you want to read more or get an in-depth understanding, see [Flexbox](https://www.w3schools.com/css/css3_flexbox.asp) and [CSS Grid](https://www.w3schools.com/css/css_grid.asp) in the CSS tutorial.

* * *

## Security

*   Use HTTPS so data is encrypted while traveling between browser and server.
*   Always validate on the server; client-side checks are not enough.
*   Protect against CSRF (cross-site request forgery) and XSS (cross-site scripting) when handling submissions.

**Note:** These acronyms describe common attacks.

Review the W3Schools security chapters to learn mitigation strategies.

* * *

## Accessible feedback form

This demo shows a styled form with labeled fields, clear focus states, and a large tappable submit button.

Syntax highlights: `:focus` outlines for accessibility, and rounded, padded inputs for readability.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <main>
    <form>
      <h1>Feedback</h1>
      <label for="fullname">Name</label>
      <input id="fullname" name="fullname" required>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required>
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="4" required></textarea>
      <button type="submit">Send Message</button>
    </form>
  </main>
</body>
</html>
```

The layout centers the form, uses generous spacing to group fields, and applies color and shadow to communicate interactivity and hierarchy.

* * *

* * *