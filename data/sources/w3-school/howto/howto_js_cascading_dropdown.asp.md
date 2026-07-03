# How TO - Cascading Dropdown List

* * *

Learn how to create a cascading dropdown list with JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_cascading_dropdown)

* * *

## Create Three Dropdown Lists

Create three dropdown lists, inside an HTML form.

The second and third dropdown list will display different options, depending on the value selected in the parent dropdown list.

##### Step 1) Add HTML:

```javascript
<form name="form1" id="form1" action="/action_page.php">  Subjects: <select name="subject" id="subject">    <option value="" selected="selected">Select subject</option>  </select>  <br><br>  Topics: <select name="topic" id="topic">    <option value="" selected="selected">Please select subject first</option>  </select>  <br><br>  Chapters: <select name="chapter" id="chapter">    <option value="" selected="selected">Please select topic first</option>  </select>  <br><br>  <input type="submit" value="Submit"></form>
```

* * *

* * *

##### Step 2) Add JavaScript:

```javascript
var subjectObject = {  "Front-end": {    "HTML": ["Links", "Images", "Tables", "Lists"],    "CSS": ["Borders", "Margins", "Backgrounds", "Float"],    "JavaScript": ["Variables", "Operators", "Functions", "Conditions"]  },  "Back-end": {    "PHP": ["Variables", "Strings", "Arrays"],    "SQL": ["SELECT", "UPDATE", "DELETE"]  }}window.onload = function() {  var subjectSel = document.getElementById("subject");  var topicSel = document.getElementById("topic");  var chapterSel = document.getElementById("chapter");  for (var x in subjectObject) {    subjectSel.options[subjectSel.options.length] = new Option(x, x);  }  subjectSel.onchange = function() {    //empty Chapters- and Topics- dropdowns    chapterSel.length = 1;    topicSel.length = 1;    //display correct values    for (var y in subjectObject[this.value]) {      topicSel.options[topicSel.options.length] = new Option(y, y);    }  }  topicSel.onchange = function() {    //empty Chapters dropdown    chapterSel.length = 1;    //display correct values    var z = subjectObject[subjectSel.value][this.value];    for (var i = 0; i < z.length; i++) {      chapterSel.options[chapterSel.options.length] = new Option(z[i], z[i]);    }  }}
```

* * *

**Tip:** Go to our [CSS Dropdowns Tutorial](https://www.w3schools.com/css/css_dropdowns.asp) to learn more about dropdowns.

**Tip:** Go to our [Hoverable Dropdowns](howto_css_dropdown.asp.html) to learn more about hoverable dropdowns.