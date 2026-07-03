# JavaScript Maps

## The Map Object

A **JavaScript Map** is an object that can store collections of key-value pairs, similar to a **dictionary** in other programming languages.

Maps differ from standard objects in that **keys can be of any data type**.

## Map Characteristics

*   **Key Types**  
    Map keys can be any type (strings, numbers, objects, etc).
    
*   **Insertion Order**  
    The Map remembers the original insertion order of the keys.
    
*   **Size**  
    The number of items in a Map is easily retrieved using the size property.
    
*   **Performance**  
    Maps are optimized for frequent additions and removals of key-value pairs.
    
*   **Iteration**  
    Maps are iterable, allowing for direct use of for...of loops or methods like forEach().
    
*   **Iteration Order**  
    The original order is preserved during iteration.
    

* * *

Maps are similar to both Objects (unique key/value collection) and Arrays (ordered values collection).

But if you look close, Maps are most similar to Objects.

* * *

## How to Create a Map

You create a JavaScript Map by:

*   Create a new Map and add elements with `Map.set()`
*   Passing an existing Array to the `new Map()` constructor

```javascript
// Create an empty Mapconst fruits = new Map();// Set Map Valuesfruits.set("apples", 500);fruits.set("bananas", 300);fruits.set("oranges", 200);
```

* * *

## Adding Map Values

You can add elements to a Map with the `set()` method:

```javascript
fruits.set("mangos", 100);
```

* * *

## Changing Map Values

The `set()` method can also be used to change existing Map values:

```javascript
fruits.set("apples", 200);
```

* * *

## The get() Method

The `get()` method gets the value of a key in a Map:

```javascript
fruits.get("apples");    // Returns 500
```

* * *

* * *

## Maps are Objects

```javascript
// Returns object:typeof fruits;
```

`instanceof` Map returns true:

```javascript
// Returns true:fruits instanceof Map;
```

* * *

## JavaScript Objects vs Maps

#### Differences between JavaScript Objects and Maps:

Object

Map

Not directly iterable

Directly iterable

Do not have a size property

Have a size property

Keys must be Strings (or Symbols)

Keys can be any datatype

Keys are not well ordered

Keys are ordered by insertion

Have default keys

Do not have default keys

* * *

## Learn More:

[JavaScript Map Methods](js_map_methods.asp.html)

[JavaScript Weak Maps](js_maps_weak.asp.html)

[JavaScript Map Reference](js_map_reference.asp.html)

[JavaScript Sets](js_sets.asp.html)

* * *

## Browser Support

`Map` is an [ES6 feature](js_es6.asp.html).

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