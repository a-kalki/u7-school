# Node.js and Raspberry Pi - Webserver with WebSocket

* * *

## What is WebSocket?

WebSocket enables bidirectional communication in real time over the web.

WebSocket can be run together with a normal HTTP server. You can click a button in a web browser, and enable a GPIO on your Raspberry Pi which turns on a light in your house. All in real time, and with communication going both ways!

In this chapter, we will set up a web server with WebSocket. Then create a browser UI to interact with our earlier example of [turning a LED on and off with a button](nodejs_raspberrypi_led_pushbutton.asp.html).

* * *

## What Do I Need?

For this tutorial you need a Raspberry Pi. In our examples we use a a Raspberry Pi 3, but this tutorial should work for most versions.

For this you need:

*   A Raspberry Pi with Raspian, internet, SSH, with Node.js installed
*   The [onoff module](nodejs_raspberrypi_components.asp.html#onoff) for Node.js
*   The [socket.io module](nodejs_raspberrypi_components.asp.html#socket.io) for Node.js
*   1 x [Breadboard](nodejs_raspberrypi_components.asp.html#breadboard)
*   1 x [68 Ohm resistor](nodejs_raspberrypi_components.asp.html#resistor68ohm)
*   1 x [1k Ohm resistor](nodejs_raspberrypi_components.asp.html#resistor1kohm)
*   1 x [Through Hole LED](nodejs_raspberrypi_components.asp.html#throughHoleLED)
*   1 x [Push Button](nodejs_raspberrypi_components.asp.html#switchPushButton)
*   4 x [Female to male jumper wires](nodejs_raspberrypi_components.asp.html#jumperWireFemaletoMale)
*   1 x [Male to Male jumper wires](nodejs_raspberrypi_components.asp.html#jumperWireMaletoMale)

Click the links in the list above for descriptions of the different components.

**Note:** The resistor you need can be different from what we use depending on the type of LED you use. Most small LEDs only need a small resistor, around 200-500 ohms. It is generally not critical what exact value you use, but the smaller the value of the resistor, the brighter the LED will shine.

Compared to our earlier example, the only new thing we need is to set up a web server, and install the socket.io module.

* * *

## Webserver for Raspberry Pi and Node.js

Following the earlier chapters in this Node.js tutorial, lets set up a web server that can serve HTML files.

In our "nodetest" directory create a new directory we can use for static html files:

pi@w3demopi:~/nodetest $ mkdir public

Now lets set up a webserver. Create a Node.js file that opens the requested file and returns the content to the client. If anything goes wrong, throw a 404 error.

pi@w3demopi:~/nodetest $ nano webserver.js

```javascript
let http = require('http').createServer(handler); //require http server, and create server with function handler()let fs = require('fs'); //require filesystem modulehttp.listen(8080); //listen to port 8080function handler (req, res) { //create server  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder    if (err) {      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error      return res.end("404 Not Found");    }    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML    res.write(data); //write data from index.html    return res.end();  });}
```

Go to the folder "public":

pi@w3demopi:~/nodetest $ cd public

And create a HTML file, index.html:

pi@w3demopi:~/nodetest/public $ nano index.html

```javascript
<!DOCTYPE html><html><body><h1>Control LED light</h1><input id="light" type="checkbox">LED</body></html>
```

This file will not have any functionality yet. For now it is just a placeholder. Lets see if the webserver is working:

pi@w3demopi:~/nodetest/public $ cd ..

pi@w3demopi:~/nodetest $ node webserver.js

Open the website in a browser using http://\[RaspberryPi\_IP\]:8080/:

The webserver should now be up and running, and we can move on to the WebSocket part.

* * *

## Install socket.io for Node.js

With the webserver set up, update your Raspberry Pi system packages to their latest versions.

Update your system package list:

pi@w3demopi:~ $ sudo apt-get update

Upgrade all your installed packages to their latest version:

pi@w3demopi:~ $ sudo apt-get dist-upgrade

Doing this regularly will keep your Raspberry Pi installation up to date.

To download and install newest version of socket.io, use the following command:

pi@w3demopi:~ $ npm install socket.io --save

* * *

* * *

## Adding WebSocket to our Webserver

Now we can use WebSocket in our application. Lets update our index.html file:

```javascript
<!DOCTYPE html><html><body><h1>Control LED light</h1><p><input type="checkbox" id="light"></p><script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js"></script> <!-- include socket.io client side script --><script>let socket = io(); //load socket.io-client and connect to the host that serves the pagewindow.addEventListener("load", function(){ //when page loads  let lightbox = document.getElementById("light");  lightbox.addEventListener("change", function() { //add event listener for when checkbox changes    socket.emit("light", Number(this.checked)); //send button status to server (as 1 or 0)  });});socket.on('light', function (data) { //get button status from client  document.getElementById("light").checked = data; //change checkbox according to push button on Raspberry Pi  socket.emit("light", data); //send push button status to back to server});</script></body></html>
```

And our webserver.js file:

```javascript
let http = require('http').createServer(handler); //require http server, and create server with function handler()let fs = require('fs'); //require filesystem modulelet io = require('socket.io')(http) //require socket.io module and pass the http object (server)http.listen(8080); //listen to port 8080function handler (req, res) { //create server  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder    if (err) {      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error      return res.end("404 Not Found");    }    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML    res.write(data); //write data from index.html    return res.end();  });}io.sockets.on('connection', function (socket) {// WebSocket Connection  let lightvalue = 0; //static variable for current status  socket.on('light', function(data) { //get light switch status from client    lightvalue = data;    if (lightvalue) {      console.log(lightvalue); //turn LED on or off, for now we will just show it in console.log    }  });});
```

Lets test the server:

pi@w3demopi:~ $ node webserver.js

Open the website in a browser using http://\[RaspberryPi\_IP\]:8080/:

Now the server should output all the changes to the checkbox to the console on the Raspberry Pi.

The client is sending the changes to the server, and the server is responding.

Lets add the [push button controlled LED](nodejs_raspberrypi_led_pushbutton.asp.html) from a previous chapter.

* * *

## Adding Hardware, and sending a response to the Client

Lets update our webserver.js file again. We will use a lot of the code from the Pushbutton controlled LED chapter.

```javascript
let http = require('http').createServer(handler); //require http server, and create server with function handler()let fs = require('fs'); //require filesystem modulelet io = require('socket.io')(http) //require socket.io module and pass the http object (server)let Gpio = require('onoff').Gpio; //include onoff to interact with the GPIOlet LED = new Gpio(4, 'out'); //use GPIO pin 4 as outputlet pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handledhttp.listen(8080); //listen to port 8080function handler (req, res) { //create server  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder    if (err) {      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error      return res.end("404 Not Found");    }    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML    res.write(data); //write data from index.html    return res.end();  });}io.sockets.on('connection', function (socket) {// WebSocket Connection  let lightvalue = 0; //static variable for current status  pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton    if (err) { //if an error      console.error('There was an error', err); //output error message to console      return;    }    lightvalue = value;    socket.emit('light', lightvalue); //send button status to client  });  socket.on('light', function(data) { //get light switch status from client    lightvalue = data;    if (lightvalue != LED.readSync()) { //only change LED if status has changed      LED.writeSync(lightvalue); //turn LED on or off    }  });});process.on('SIGINT', function () { //on ctrl+c  LED.writeSync(0); // Turn LED off  LED.unexport(); // Unexport LED GPIO to free resources  pushButton.unexport(); // Unexport Button GPIO to free resources  process.exit(); //exit completely});
```

Lets test the server:

pi@w3demopi:~ $ node webserver.js

Open the website in a browser using http://\[RaspberryPi\_IP\]:8080/:

Now the server should output all the changes to the checkbox to the console on the Raspberry Pi.

The client is sending the changes to the server, and the server is responding.

End the program with `Ctrl+c`.

* * *