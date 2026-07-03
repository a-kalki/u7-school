# How TO - Remove a Property from an Object

* * *

Learn how to remove a property from a JavaScript object.

* * *

## Remove Property from an Object

The **delete** operator deletes a property from an object:

```javascript
var person = {  firstName: "John",  lastName: "Doe",  age: 50,  eyeColor: "blue"};delete person.age;  // or delete person["age"];// Before deletion: person.age = 50, after deletion, person.age = undefined
```

The delete operator deletes both the value of the property and the property itself.

After deletion, the property cannot be used before it is added back again.

The delete operator is designed to be used on object properties. It has no effect on variables or functions.

**Note:** The delete operator should not be used on predefined JavaScript object properties. It can crash your application.

Read more about JavaScript Objects in our [JavaScript Object Tutorial](https://www.w3schools.com/js/js_object_definition.asp).

* * *

* * *