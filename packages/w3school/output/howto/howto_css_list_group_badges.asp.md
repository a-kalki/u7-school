# How TO - List Group with Badges

* * *

Learn how to create a List Group with Badges, using CSS.

* * *

## List Group with Badges

*   Inbox 2
*   Other 5
*   Saved
*   Stuff
*   Old

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_list_group_badges)

* * *

## How To Create a List Group

##### Step 1) Add HTML:

```javascript
<ul>  <li>Inbox <span class="badge">2</span></li>  <li>Other <span class="badge">5</span></li>  <li>Saved</li>  <li>Stuff</li>  <li>Old</li></ul>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Transform a basic list into a customized list group */ul.list-group {  list-style-type: none;  padding: 0;  margin: 0;}ul.list-group li {  border: 1px solid #ddd;  margin-top: -1px; /* Prevent double borders */  background-color: #f6f6f6;  padding: 12px;}/* Style badges inside the list group */ul.list-group .badge {  background-color: red;  color: #fff;  font-weight: bold;  border-radius: 50%;  padding: 5px 10px;  text-align: center;  margin-left: 5px;}
```

**Tip:** Go to our [CSS List Tutorial](https://www.w3schools.com/css/css_list.asp) to learn more about HTML lists and how to style them.

* * *

* * *