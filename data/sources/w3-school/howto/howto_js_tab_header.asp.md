# How TO - Tab Headers

* * *

Learn how to create tab headers with CSS and JavaScript.

* * *

## Tab Headers

Click on the "city" buttons to display the appropriate header:

# London

London is the capital city of England.

# Paris

Paris is the capital of France.

# Tokyo

Tokyo is the capital of Japan.

# Oslo

Oslo is the capital of Norway.

London Paris Tokyo Oslo  
  
  

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_tab_header)

* * *

## Create Togglable Tab Headers

##### Step 1) Add HTML:

```javascript
<div id="London" class="tabcontent">  <h1>London</h1>  <p>London is the capital city of England.</p></div><div id="Paris" class="tabcontent">  <h1>Paris</h1>  <p>Paris is the capital of France.</p></div><div id="Tokyo" class="tabcontent">  <h1>Tokyo</h1>  <p>Tokyo is the capital of Japan.</p></div><div id="Oslo" class="tabcontent">  <h1>Oslo</h1>  <p>Oslo is the capital of Norway.</p></div><button class="tablink" onclick="openCity('London', this, 'red')" id="defaultOpen">London</button><button class="tablink" onclick="openCity('Paris', this, 'green')">Paris</button><button class="tablink" onclick="openCity('Tokyo', this, 'blue')">Tokyo</button><button class="tablink" onclick="openCity('Oslo', this, 'orange')">Oslo</button>
```

Create buttons to open specific tab content. All <div> elements with `class="tabcontent"` are hidden by default (with CSS & JS). When the user clicks on a button - it will open the tab content that "matches" this button.

* * *

##### Step 2) Add CSS:

Style the buttons and the tab content:

```javascript
/* Style the tab buttons */.tablink {  background-color: #555;  color: white;  float: left;  border: none;  outline: none;  cursor: pointer;  padding: 14px 16px;  font-size: 17px;  width: 25%;}/* Change background color of buttons on hover */.tablink:hover {  background-color: #777;}/* Set default styles for tab content */.tabcontent {  color: white;  display: none;  padding: 50px;  text-align: center;}/* Style each tab content individually */#London {background-color:red;}#Paris {background-color:green;}#Tokyo {background-color:blue;}#Oslo {background-color:orange;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
function openCity(cityName, elmnt, color) {  // Hide all elements with class="tabcontent" by default */  var i, tabcontent, tablinks;  tabcontent = document.getElementsByClassName("tabcontent");  for (i = 0; i < tabcontent.length; i++) {    tabcontent[i].style.display = "none";  }  // Remove the background color of all tablinks/buttons  tablinks = document.getElementsByClassName("tablink");  for (i = 0; i < tablinks.length; i++) {    tablinks[i].style.backgroundColor = "";  }  // Show the specific tab content  document.getElementById(cityName).style.display = "block";  // Add the specific color to the button used to open the tab content  elmnt.style.backgroundColor = color;}// Get the element with id="defaultOpen" and click on itdocument.getElementById("defaultOpen").click();
```

**Tip:** Also check out [How To - Tabs](howto_js_tabs.asp.html).