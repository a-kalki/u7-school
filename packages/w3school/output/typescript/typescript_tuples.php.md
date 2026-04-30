# TypeScript Tuples

* * *

## Typed Arrays

A **tuple** is a typed [array](https://www.w3schools.com/js/js_arrays.asp) with a pre-defined length and types for each index.

Tuples are great because they allow each element in the array to be a known type of value.

To define a tuple, specify the type of each element in the array:

```javascript
// define our tuplelet ourTuple: [number, boolean, string];// initialize correctlyourTuple = [5, false, 'Coding God was here'];
```

As you can see we have a number, boolean and a string.

But what happens if we try to set them in the wrong order:

```javascript
// define our tuplelet ourTuple: [number, boolean, string];// initialized incorrectly which throws an errorourTuple = [false, 'Coding God was mistaken', 5];
```

Even though we have a `boolean`, `string`, and `number` the order matters in our tuple and will throw an error.

* * *

## Readonly Tuple

A good practice is to make your **tuple** `readonly`.

Tuples only have strongly defined types for the initial values:

```javascript
// define our tuplelet ourTuple: [number, boolean, string];// initialize correctlyourTuple = [5, false, 'Coding God was here'];// We have no type safety in our tuple for indexes 3+ourTuple.push('Something new and wrong');console.log(ourTuple);
```

You can see the new value.

Tuples only have strongly defined types for the initial values:

```javascript
// define our readonly tupleconst ourReadonlyTuple: readonly [number, boolean, string] = [5, true, 'The Real Coding God'];// throws error as it is readonly.ourReadonlyTuple.push('Coding God took a day off');
```

To learn more about access modifiers like `readonly` go to our section on them here: [TypeScript Classes](typescript_classes.php.html).

If you have ever used React before you have worked with tuples more than likely.

`useState` returns a tuple of the value and a setter function.

`const [firstName, setFirstName] = useState('Dylan')` is a common example.

Because of the structure we know our first value in our list will be a certain value type in this case a `string` and the second value a `function`.

* * *

* * *

## Named Tuples

**Named tuples** allow us to provide context for our values at each index.

```javascript
const graph: [x: number, y: number] = [55.2, 41.3];
```

**Named tuples** provide more context for what our index values represent.

* * *

## Destructuring Tuples

Since tuples are arrays we can also destructure them.

```javascript
const graph: [number, number] = [55.2, 41.3];const [x, y] = graph;
```

To review destructuring check it out [here](https://www.w3schools.com/js/js_destructuring.asp).

* * *

* * *