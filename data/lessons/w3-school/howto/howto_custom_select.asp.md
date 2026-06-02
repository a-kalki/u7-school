# How TO - Custom Select Box

* * *

Learn how to create custom select boxes with CSS and JavaScript.

* * *

## Custom Select Box

**Default:**

Select car: Audi BMW Citroen Ford Honda Jaguar Land Rover Mercedes Mini Nissan Toyota Volvo

**Custom:**

Select car: Audi BMW Citroen Ford Honda Jaguar Land Rover Mercedes Mini Nissan Toyota Volvo

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_custom_select)

* * *

## Create a Custom Select Menu

##### Step 1) Add HTML:

```javascript
<!-- Wrap the select box in a ".custom-select" DIV element.Remember to set the width: --><div class="custom-select" style="width:200px;">  <select>    <option value="0">Select car:</option>    <option value="1">Audi</option>    <option value="2">BMW</option>    <option value="3">Citroen</option>    <option value="4">Ford</option>    <option value="5">Honda</option>    <option value="6">Jaguar</option>    <option value="7">Land Rover</option>    <option value="8">Mercedes</option>    <option value="9">Mini</option>    <option value="10">Nissan</option>    <option value="11">Toyota</option>    <option value="12">Volvo</option>  </select></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* The container must be positioned relative: */.custom-select {  position: relative;  font-family: Arial;}.custom-select select {  display: none; /*hide original SELECT element: */}.select-selected {  background-color: DodgerBlue;}/* Style the arrow inside the select element: */.select-selected:after {  position: absolute;  content: "";  top: 14px;  right: 10px;  width: 0;  height: 0;  border: 6px solid transparent;  border-color: #fff transparent transparent transparent;}/* Point the arrow upwards when the select box is open (active): */.select-selected.select-arrow-active:after {  border-color: transparent transparent #fff transparent;  top: 7px;}/* style the items (options), including the selected item: */.select-items div,.select-selected {  color: #ffffff;  padding: 8px 16px;  border: 1px solid transparent;  border-color: transparent transparent rgba(0, 0, 0, 0.1) transparent;  cursor: pointer;}/* Style items (options): */.select-items {  position: absolute;  background-color: DodgerBlue;  top: 100%;  left: 0;  right: 0;  z-index: 99;}/* Hide the items when the select box is closed: */.select-hide {  display: none;}.select-items div:hover, .same-as-selected {  background-color: rgba(0, 0, 0, 0.1);}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
var x, i, j, l, ll, selElmnt, a, b, c;/* Look for any elements with the class "custom-select": */x = document.getElementsByClassName("custom-select");l = x.length;for (i = 0; i < l; i++) {  selElmnt = x[i].getElementsByTagName("select")[0];  ll = selElmnt.length;  /* For each element, create a new DIV that will act as the selected item: */  a = document.createElement("DIV");  a.setAttribute("class", "select-selected");  a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;  x[i].appendChild(a);  /* For each element, create a new DIV that will contain the option list: */  b = document.createElement("DIV");  b.setAttribute("class", "select-items select-hide");  for (j = 1; j < ll; j++) {    /* For each option in the original select element,    create a new DIV that will act as an option item: */    c = document.createElement("DIV");    c.innerHTML = selElmnt.options[j].innerHTML;    c.addEventListener("click", function(e) {        /* When an item is clicked, update the original select box,        and the selected item: */        var y, i, k, s, h, sl, yl;        s = this.parentNode.parentNode.getElementsByTagName("select")[0];        sl = s.length;        h = this.parentNode.previousSibling;        for (i = 0; i < sl; i++) {          if (s.options[i].innerHTML == this.innerHTML) {            s.selectedIndex = i;            h.innerHTML = this.innerHTML;            y = this.parentNode.getElementsByClassName("same-as-selected");            yl = y.length;            for (k = 0; k < yl; k++) {              y[k].removeAttribute("class");            }            this.setAttribute("class", "same-as-selected");            break;          }        }        h.click();    });    b.appendChild(c);  }  x[i].appendChild(b);  a.addEventListener("click", function(e) {    /* When the select box is clicked, close any other select boxes,    and open/close the current select box: */    e.stopPropagation();    closeAllSelect(this);    this.nextSibling.classList.toggle("select-hide");    this.classList.toggle("select-arrow-active");  });}function closeAllSelect(elmnt) {  /* A function that will close all select boxes in the document,  except the current select box: */  var x, y, i, xl, yl, arrNo = [];  x = document.getElementsByClassName("select-items");  y = document.getElementsByClassName("select-selected");  xl = x.length;  yl = y.length;  for (i = 0; i < yl; i++) {    if (elmnt == y[i]) {      arrNo.push(i)    } else {      y[i].classList.remove("select-arrow-active");    }  }  for (i = 0; i < xl; i++) {    if (arrNo.indexOf(i)) {      x[i].classList.add("select-hide");    }  }}/* If the user clicks anywhere outside the select box,then close all select boxes: */document.addEventListener("click", closeAllSelect);
```