# JavaScript Sets

A JavaScript Set is a collection of unique values.

Each value can only occur once in a Set.

The values can be of any type, primitive values or objects.

* * *

## How to Create a Set

You can create a JavaScript Set by:

*   Passing an array to `new Set()`
*   Create an empty set and use `add()` to add values

* * *

## The new Set() Method

Pass an array to the `new Set()` constructor:

```javascript
// Create a Setconst letters = new Set(["a","b","c"]);
```

Create a Set and add values:

```javascript
// Create a Setconst letters = new Set();// Add Values to the Setletters.add("a");letters.add("b");letters.add("c");
```

Create a Set and add variables:

```javascript
// Create a Setconst letters = new Set();// Create Variablesconst a = "a";const b = "b";const c = "c";// Add Variables to the Setletters.add(a);letters.add(b);letters.add(c);
```

* * *

## The add() Method

```javascript
letters.add("d");letters.add("e");
```

If you add equal elements, only the first will be saved:

```javascript
letters.add("a");letters.add("b");letters.add("c");letters.add("c");letters.add("c");letters.add("c");letters.add("c");letters.add("c");
```

* * *

* * *

## Listing the Elements

You can list all Set elements (values) with a **for..of** loop:

```javascript
// Create a Setconst letters = new Set(["a","b","c"]);// List all Elementslet text = "";for (const x of letters) {  text += x;}
```

* * *

## Sets are Objects

```javascript
typeof letters;      // Returns object
```

* * *

## Learn More:

[JavaScript Set Methods](js_set_methods.asp.html)

[JavaScript Set Logic](js_set_logic.asp.html)

[JavaScript Weak Sets](js_sets_weak.asp.html)

[JavaScript Set Reference](js_set_reference.asp.html)

[JavaScript Maps](js_maps.asp.html)

* * *

## Browser Support

`Set` is an [ES6 feature](js_es6.asp.html).

ES6 is fully supported in all modern browsers since June 2017:

Chrome  
51

Edge  
15

Firefox  
54

Safari  
10

Opera  
38

May 2016

Apr 2017

Jun 2017

Sep 2016

Jun 2016

* * *

* * *