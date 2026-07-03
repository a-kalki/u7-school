# How TO - Next and Previous Buttons

* * *

Learn how to create "next" and "previous" buttons with CSS.

* * *

## Next and Previous Buttons

« Previous Next »

  

‹ › ‹ ›

* * *

## How To Create Next and Previous Buttons

##### Step 1) Add HTML:

```javascript
<a href="#" class="previous">&laquo; Previous</a><a href="#" class="next">Next &raquo;</a><a href="#" class="previous round">&#8249;</a><a href="#" class="next round">&#8250;</a>
```

* * *

##### Step 2) Add CSS:

```javascript
a {  text-decoration: none;  display: inline-block;  padding: 8px 16px;}a:hover {  background-color: #ddd;  color: black;}.previous {  background-color: #f1f1f1;  color: black;}.next {  background-color: #04AA6D;  color: white;}.round {  border-radius: 50%;}
```

* * *

* * *