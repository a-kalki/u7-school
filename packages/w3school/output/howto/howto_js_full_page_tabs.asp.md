# How TO - Full Page Tabs

* * *

Learn how to create full page tabs, that covers the entire browser window, with CSS and JavaScript.

* * *

## Full Page Tabs

Click on the links to display the "current" page:

Home News Contact About

# Home

Home is where the heart is..

# News

Some news this fine day!

# Contact

Get in touch, or swing by for a cup of coffee.

# About

Who we are and what we do.

  

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_full_page_tabs)

* * *

## Create One Page Tabs

##### Step 1) Add HTML:

```javascript
<button class="tablink" onclick="openPage('Home', this, 'red')">Home</button><button class="tablink" onclick="openPage('News', this, 'green')" id="defaultOpen">News</button><button class="tablink" onclick="openPage('Contact', this, 'blue')">Contact</button><button class="tablink" onclick="openPage('About', this, 'orange')">About</button><div id="Home" class="tabcontent">  <h3>Home</h3>  <p>Home is where the heart is..</p></div><div id="News" class="tabcontent">  <h3>News</h3>  <p>Some news this fine day!</p></div><div id="Contact" class="tabcontent">  <h3>Contact</h3>  <p>Get in touch, or swing by for a cup of coffee.</p></div><div id="About" class="tabcontent">  <h3>About</h3>  <p>Who we are and what we do.</p></div>
```

Create buttons to open specific tab content. All <div> elements with `class="tabcontent"` are hidden by default (with CSS & JS). When the user clicks on a button - it will open the tab content that "matches" this button.

* * *

##### Step 2) Add CSS:

Style the links and the tab content (full page):

```javascript
/* Set height of body and the document to 100% to enable "full page tabs" */body, html {  height: 100%;  margin: 0;  font-family: Arial;}/* Style tab links */.tablink {  background-color: #555;  color: white;  float: left;  border: none;  outline: none;  cursor: pointer;  padding: 14px 16px;  font-size: 17px;  width: 25%;}.tablink:hover {  background-color: #777;}/* Style the tab content (and add height:100% for full page content) */.tabcontent {  color: white;  display: none;  padding: 100px 20px;  height: 100%;}#Home {background-color: red;}#News {background-color: green;}#Contact {background-color: blue;}#About {background-color: orange;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
function openPage(pageName, elmnt, color) {  // Hide all elements with class="tabcontent" by default */  var i, tabcontent, tablinks;  tabcontent = document.getElementsByClassName("tabcontent");  for (i = 0; i < tabcontent.length; i++) {    tabcontent[i].style.display = "none";  }  // Remove the background color of all tablinks/buttons  tablinks = document.getElementsByClassName("tablink");  for (i = 0; i < tablinks.length; i++) {    tablinks[i].style.backgroundColor = "";  }  // Show the specific tab content  document.getElementById(pageName).style.display = "block";  // Add the specific color to the button used to open the tab content  elmnt.style.backgroundColor = color;}// Get the element with id="defaultOpen" and click on itdocument.getElementById("defaultOpen").click();
```

**Tip:** Also check out [How To - Tabs](howto_js_tabs.asp.html).