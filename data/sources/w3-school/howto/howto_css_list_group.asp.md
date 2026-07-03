# How TO - List Group

* * *

Learn how to transform a basic list into a "list group" with CSS.

* * *

## List Group

*   Adele
*   Agnes
*   Billy
*   Bob
*   Calvin
*   Christina
*   Cindy

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_list_group)

* * *

## How To Create a List Group

##### Step 1) Add HTML:

```javascript
<ul>  <li>Adele</li>  <li>Agnes</li>  <li>Billy</li>  <li>Bob</li>  <li>Calvin</li>  <li>Christina</li>  <li>Cindy</li></ul>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
ul {  list-style-type: none; /* Remove bullets */  padding: 0; /* Remove padding */  margin: 0; /* Remove margins */}ul li {  border: 1px solid #ddd; /* Add a thin border to each list item */  margin-top: -1px; /* Prevent double borders */  background-color: #f6f6f6; /* Add a grey background color */  padding: 12px; /* Add some padding */}
```

**Tip:** Go to our [CSS List Tutorial](https://www.w3schools.com/css/css_list.asp) to learn more about HTML lists and how to style them.