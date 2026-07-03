# Node.js Raspberry Pi GPIO - Blinking LED

* * *

## Using the GPIO for Output

In this chapter we will use a Raspberry Pi and its GPIO to make a LED blink.

We use Node.js with the onoff module to control the GPIO.

To get a LED light to turn on, we use a GPIO pin as "Output", and create a script to turn it on and off (blinking).

* * *

## What do we need?

In this chapter we will create a simple example where we control a LED light.

For this you need:

*   A Raspberry Pi with Raspian, internet, SSH, with Node.js installed
*   The [onoff module](nodejs_raspberrypi_components.asp.html#onoff) for Node.js
*   1 x [Breadboard](nodejs_raspberrypi_components.asp.html#breadboard)
*   1 x [68 Ohm resistor](nodejs_raspberrypi_components.asp.html#resistor68ohm)
*   1 x [Through Hole LED](nodejs_raspberrypi_components.asp.html#throughHoleLED)
*   2 x [Female to male jumper wires](nodejs_raspberrypi_components.asp.html#jumperWireFemaletoMale)

Click the links in the list above for descriptions of the different components.

**Note:** The resistor you need can be different from what we use depending on the type of LED you use. Most small LEDs only need a small resistor, around 200-500 ohms. It is generally not critical what exact value you use, but the smaller the value of the resistor, the brighter the LED will shine.

* * *

## Building the Circuit

Now it is time to build the circuit on our Breadboard.

If you are new to electronics, we recommend you turn off the power for the Raspberry Pi. And use an anti-static mat or a grounding strap to avoid damaging it.

Shut down the Raspberry Pi properly with the command:

pi@w3demopi:~ $ sudo shutdown -h now

After the LEDs stop blinking on the Raspberry Pi, then pull out the power plug from the Raspberry Pi (or turn off the power strip it is connected to).

Just pulling the plug without shutting down properly may cause corruption of the memory card.

![Raspberry Pi 3 with Breadboard. Simple LED circuit](img_raspberrypi3_led_simple.png)

Look at the above illustration of the circuit.

1.  On the Raspberry Pi, connect the female leg of the first jumper wire to Ground. You can use any GND pin. In this example we used Physical Pin 9 (GND, row 5, left column)
2.  On the Breadboard, connect the male leg of the first jumper wire to the Ground Bus column on the right. That entire column of your breadboard is connected, so it doesn't matter which row. In this example we have attached it to row 1
3.  On the Raspberry Pi, connect the female leg of the second jumper cable to a GPIO pin. In this example we used Physical Pin 7 (GPIO 4, row 4, left column)
4.  On the Breadboard, connect the male leg of the second jumper wire to the Tie-Point row of your choice. In this example we connected it to row 5, column A
5.  On the Breadboard, connect one leg of the resistor to the Ground Bus column on the right side. That entire column of your breadboard is connected, so it doesn't matter which row. In this example we have attached it to row 5
6.  On the Breadboard, connect the other leg of the resistor to the right side Tie-Point row of your choice. In this example we have used row 5, column J
7.  On the Breadboard, connect the cathode leg (the shortest leg) of the LED to the same Tie-Point row that you connected the resistor from GND to. In this example we used row 5, column F
8.  On the Breadboard, connect the anode leg (the longest leg) of the LED to the same Tie-Point row that you connected the jumper from the GPIO pin to. In this example we used row 5, column E

Your circuit should now be complete, and your connections should look pretty similar to the illustration above.

Now it is time to boot up the Raspberry Pi, and write the Node.js script to interact with it.

* * *

* * *

## Raspberry Pi and Node.js Blinking LED Script

Now that we have everything set up, we can write a script to turn the LED on and off.

Start by making a directory where we can keep our Node.js scripts:

pi@w3demopi:~ $ mkdir nodetest

Go to our new directory:

pi@w3demopi:~ $ cd nodetest

Now we will create a new file called "`blink.js`" using the Nano Editor:

pi@w3demopi:~ $ nano blink.js

The file is now open and can be edited with the built in Nano Editor.

Write, or paste the following code:

```javascript
let Gpio = require('onoff').Gpio; //include onoff to interact with the GPIOlet LED = new Gpio(4, 'out'); //use GPIO pin 4, and specify that it is outputlet blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250msfunction blinkLED() { //function to start blinking  if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)    LED.writeSync(1); //set pin state to 1 (turn LED on)  } else {    LED.writeSync(0); //set pin state to 0 (turn LED off)  }}function endBlink() { //function to stop blinking  clearInterval(blinkInterval); // Stop blink intervals  LED.writeSync(0); // Turn LED off  LED.unexport(); // Unexport GPIO to free resources}setTimeout(endBlink, 5000); //stop blinking after 5 seconds
```

Press "`Ctrl+x`" to save the code. Confirm with "`y`", and confirm the name with "`Enter`".

Run the code:

pi@w3demopi:~ $ node blink.js

Now the LED should blink for 5 seconds (10 times) before turning off again!

* * *