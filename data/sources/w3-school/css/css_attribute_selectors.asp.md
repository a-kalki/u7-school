# CSS Attribute Selectors

* * *

## CSS Attribute Selectors

CSS attribute selectors are used to select and style HTML elements with a specific attribute or attribute value, or both.

Attribute selectors are enclosed in square brackets `[]`. 

CSS has the following attribute selectors:

*   `[attribute]` - Select elements with the specified attribute
*   `[attribute="value"]` - Select elements with a specific attribute and an exact value
*   `[attribute~="value"]` - Select elements with an attribute value containing a specific word
*   `[attribute|="value"]` - Select elements with the specific attribute, whose value can be exactly the value, or start with the value followed by a hyphen (-)
*   `[attribute^="value"]` - Select elements whose attribute value starts with a specific value
*   `[attribute$="value"]` - Select elements whose attribute value ends with a specific value
*   `[attribute*="value"]` - Select elements whose attribute value contains a specific value

**Tip:** The attribute selectors are case-sensitive by default. To perform a case-insensitive match, add an `i` before the closing bracket. Example: `[attribute="value" i]`.

* * *

## CSS \[attribute\] Selector

The `[[attribute]](https://www.w3schools.com/cssref/sel_attribute.php)` selector is used to select elements with the specified attribute.

The following example selects all <a> elements with a target attribute:

```javascript
a[target] {  background-color: yellow;}
```

* * *

## CSS \[attribute="value"\] Selector

The `[[attribute="value"]](https://www.w3schools.com/cssref/sel_attribute_value.php)` selector is used to select elements with a specific attribute with an exact value.

The following example selects all <a> elements with a target="\_blank" attribute:

```javascript
a[target="_blank"] {  background-color: yellow;}
```

* * *

* * *

## CSS \[attribute~="value"\] Selector

The `[[attribute~="value"]](https://www.w3schools.com/cssref/sel_attribute_value_contains.php)` selector is used to select elements with an attribute value containing a specific word.

The following example selects all elements with a title attribute that contains a space-separated list of words, one of which is "flower":

```javascript
[title~="flower"] {  border: 5px solid yellow;}
```

The example above will match elements with title="flower", title="summer flower", and title="flower new", but not title="my-flower" or title="flowers".

* * *

## CSS \[attribute|="value"\] Selector

The `[[attribute|="value"]](https://www.w3schools.com/cssref/sel_attribute_value_lang.php)` selector is used to select elements with the specific attribute, whose value can be exactly the specific value, or start with the specific value followed by a hyphen (-).

**Note:** The value has to be a whole word, either alone, like class="top", or followed by a hyphen ( - ), like class="top-text".

```javascript
[class|="top"] {  background: yellow;}
```

* * *

* * *