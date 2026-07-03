# HTML Audio

* * *

The HTML `<audio>` element is used to play an audio file on a web page.

* * *

## The HTML <audio> Element

To play an audio file in HTML, use the `<audio>` element:

```javascript
<audio controls>  <source src="horse.ogg" type="audio/ogg">  <source src="horse.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>
```

* * *

## HTML Audio - How It Works

The `controls` attribute adds audio controls, like play, pause, and volume.

The `<source>` element allows you to specify alternative audio files which the browser may choose from. The browser will use the first recognized format.

The text between the `<audio>` and `</audio>` tags will only be displayed in browsers that do not support the `<audio>` element.

* * *

## HTML <audio> Autoplay

To start an audio file automatically, use the `autoplay` attribute:

```javascript
<audio controls autoplay>  <source src="horse.ogg" type="audio/ogg">  <source src="horse.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>
```

**Note:** Chromium browsers do not allow autoplay in most cases. However, muted autoplay is always allowed.

Add `muted` after `autoplay` to let your audio file start playing automatically (but muted):

```javascript
<audio controls autoplay muted>  <source src="horse.ogg" type="audio/ogg">  <source src="horse.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>
```

* * *

## Browser Support

The numbers in the table specify the first browser version that fully supports the `<audio>` element.

Element

<audio>

4.0

9.0

3.5

4.0

10.5

* * *

* * *

## HTML Audio Formats

There are three supported audio formats: MP3, WAV, and OGG. The browser support for the different formats is: 

Browser

MP3

WAV

OGG

Edge/IE

YES

YES\*

YES\*

Chrome

YES

YES

YES

Firefox

YES

YES

YES

Safari

YES

YES

NO

Opera

YES

YES

YES

\*From Edge 79

* * *

## HTML Audio - Media Types

File Format

Media Type

MP3

audio/mpeg

OGG

audio/ogg

WAV

audio/wav

* * *

## HTML Audio - Methods, Properties, and Events

The HTML DOM defines methods, properties, and events for the `<audio>` element.

This allows you to load, play, and pause audios, as well as set duration and volume.

There are also DOM events that can notify you when an audio begins to play, is paused, etc.

For a full DOM reference, go to our [HTML Audio/Video DOM Reference](https://www.w3schools.com/tags/ref_av_dom.asp).

* * *

## HTML Audio Tags

Tag

Description

[<audio>](https://www.w3schools.com/tags/tag_audio.asp)

Defines sound content

[<source>](https://www.w3schools.com/tags/tag_source.asp)

Defines multiple media resources for media elements, such as <video> and <audio>