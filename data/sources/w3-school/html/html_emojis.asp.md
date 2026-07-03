# Using Emojis in HTML

* * *

## What are Emojis?

Emojis look like images, but they are not.

Emojis are letters (characters) from the UTF-8 (Unicode) character set:

😄 😍 💗

UTF-8 covers almost all of the characters and symbols in the world.

Emoji

Value

🗻

&#128507;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128507)

🗼

&#128508;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128508)

🗽

&#128509;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128509)

🗾

&#128510;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128510)

🗿

&#128511;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128511)

😀

&#128512;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128512)

😁

&#128513;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128513)

😂

&#128514;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128514)

😃

&#128515;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128515)

😄

&#128516;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128516)

😅

&#128517;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_emoji_128517)

## HTML Emojis Examples

[Smileys](https://www.w3schools.com/charsets/ref_emoji_smileys.asp)

😀 😂 😊 😎 😜

[Hands](https://www.w3schools.com/charsets/ref_emoji_hands.asp)

✌ ✊ ☝ ✋ 👌

[People](https://www.w3schools.com/charsets/ref_emoji_body.asp)

👮 🧕 👦 💏 🤴

[Office](https://www.w3schools.com/charsets/ref_emoji_office.asp)

📈 💻 📌 📆 📒

[Places](https://www.w3schools.com/charsets/ref_emoji_places.asp)

⛺ 🌋 🗽 🗿 🏢

[Transport](https://www.w3schools.com/charsets/ref_emoji_transport.asp)

🚈 🚗 🚢 🚌 🚀

[Animals](https://www.w3schools.com/charsets/ref_emoji_animals.asp)

🐴 🐕 🐘 🐻 🐞

[Food](https://www.w3schools.com/charsets/ref_emoji_food.asp)

☕ 🌭 🍞 🍩 🍣

[Plants](https://www.w3schools.com/charsets/ref_emoji_plants.asp)

🌴 🌳 🌼 🍁 🥑

  

[Fruits](https://www.w3schools.com/charsets/ref_emoji_plants.asp)

🍇 🍊 🍏 🥝 🥥

[Sports](https://www.w3schools.com/charsets/ref_emoji_sports.asp)

⚽ 🏆 🤿 🏋 ⛳

[Earth & Sky](https://www.w3schools.com/charsets/ref_emoji_sky.asp)

🌐 🌍 🌖 🌟 🌞

[Weather](https://www.w3schools.com/charsets/ref_emoji_weather.asp)

⛅ ☔ 🌈 🌂 ⛄

[Clothing](https://www.w3schools.com/charsets/ref_emoji_clothing.asp)

👚 👕 🎩 👜 👠

[Audio/Video](https://www.w3schools.com/charsets/ref_emoji_av.asp)

🎥 🎵 🎹 🔊 📺

[Celebration](https://www.w3schools.com/charsets/ref_emoji_celebration.asp)

🎁 🎃 🎈 🎓 🎂

[Entertainment](https://www.w3schools.com/charsets/ref_emoji_entertainment.asp)

🎨 🎪 🎭 🎡 🎢

[Symbols](https://www.w3schools.com/charsets/ref_emoji_symbols.asp)

💡 💰 🔐 🔞 🔔

  

## Learn More:

[Full HTML Emoji Reference](https://www.w3schools.com/charsets/ref_emoji_smileys.asp)

* * *

## The HTML charset Attribute

To display an HTML page correctly, a web browser must know the character set used in the page.

This is specified in the `<meta>` tag:

```javascript
<meta charset="UTF-8">
```

If not specified, UTF-8 is the default character set in HTML.

* * *

## UTF-8 Characters

Many UTF-8 characters cannot be typed on a keyboard, but they can always be displayed using numbers (called entity numbers):

*   A is 65
*   B is 66
*   C is 67

```javascript
<!DOCTYPE html><html><meta charset="UTF-8"><body><p>I will display A B C</p><p>I will display &#65; &#66; &#67;</p></body></html>
```

### Example Explained

The `<meta charset="UTF-8">` element defines the character set.

The characters A, B, and C, are displayed by the numbers 65, 66, and 67.

To let the browser understand that you are displaying a character, you must start the entity number with &# and end it with ; (semicolon).

* * *

* * *

## Emoji Characters

Emojis are also characters from the UTF-8 alphabet:

*   😄 is 128516
*   😍 is 128525
*   💗 is 128151

```javascript
<!DOCTYPE html><html><meta charset="UTF-8"><body><h1>My First Emoji</h1><p>&#128512;</p></body></html>
```

Since Emojis are characters, they can be copied, displayed, and sized just like any other character in HTML.

```javascript
<!DOCTYPE html><html><meta charset="UTF-8"><body><h1>Sized Emojis</h1><p style="font-size:48px">&#128512; &#128516; &#128525; &#128151;</p></body></html>
```

* * *