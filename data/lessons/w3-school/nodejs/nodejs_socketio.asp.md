# Node.js Socket.IO

* * *

## What is Socket.IO?

Socket.IO is a powerful JavaScript library that enables real-time, bidirectional, and event-based communication between web clients and servers. It's designed to work on every platform, browser, or device, focusing equally on reliability and speed.

### Key Features

*   **Real-time bidirectional communication** - Enables instant data transfer between clients and servers
*   **Automatic reconnection** - Handles disconnections and reconnections automatically
*   **Room support** - Easily create channels for group communication
*   **Binary support** - Send and receive binary data (ArrayBuffer, Blob, File, etc.)
*   **Multiplexing** - Handle multiple sockets with namespaces
*   **Fallback options** - Automatically falls back to HTTP long-polling if WebSockets aren't available

### Use Cases

*   Real-time chat applications
*   Live notifications
*   Collaborative tools
*   Online gaming

*   Live analytics
*   Document collaboration
*   Real-time dashboards
*   IoT applications

Socket.IO consists of two parts:

*   A client-side library that runs in the browser
*   A server-side library for Node.js

* * *

## Installing Socket.IO

### Server-Side Installation

Install Socket.IO in your Node.js project using npm or yarn:

```javascript
# Using npmnpm install socket.io# Or using Yarnyarn add socket.io
```

### Client-Side Setup

Choose one of the following methods to include the client library:

```javascript
<script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
```
```javascript
# Install the client librarynpm install socket.io-client# Or using Yarnyarn add socket.io-client
```
```javascript
import { io } from 'socket.io-client';
```

### Version Compatibility

Socket.IO Version

Node.js Version

Browser Support

v4.x

v12.22.0+

Chrome 49+, Firefox 53+, Safari 10+

v3.x

v10.0.0+

Chrome 49+, Firefox 53+, Safari 10+

v2.x

v6.0.0+

Chrome 5+, Firefox 6+, Safari 5.1+

**Note:** For production, it's recommended to use the same version on both client and server.

* * *

* * *

## Simple Chat Application with Socket.IO

Let's build a simple real-time chat application using Node.js and Socket.IO.

This example doesn't require any login and demonstrates the basic functionality.

### Create the Server (app.js)

Create a new file named `app.js` with the following content:

```javascript
const express = require('express');const http = require('http');const { Server } = require('socket.io');const path = require('path');const app = express();const server = http.createServer(app);const io = new Server(server);// Serve static filesapp.use(express.static(path.join(__dirname, 'public')));// Simple routeapp.get('/', (req, res) => {;  res.sendFile(path.join(__dirname, 'public', 'index.html'));});// Socket.IO connection handlerio.on('connection', (socket) => {  console.log('A user connected');  // Handle new messages  socket.on('chat message', (msg) => {    console.log('Message received:', msg);    // Broadcast the message to all connected clients      io.emit('chat message', msg);    });  // Handle disconnection  socket.on('disconnect', () => {    console.log('A user disconnected');  });});const PORT = process.env.PORT || 3000;server.listen(PORT, () => {  console.log(`Server running on port ${PORT}`);});
```

### Create the Client (public/index.html)

Create a `public` directory and add an `index.html` file with this content:

```javascript
<!DOCTYPE html><html><head>  <title>Simple Chat</title>  <style>  body {    margin: 0;    padding: 20px;    font-family: Arial, sans-serif;  }  #messages {    list-style-type: none;    margin: 0;    padding: 0;    margin-bottom: 20px;    border: 1px solid #ddd;    padding: 10px;    height: 400px;    overflow-y: auto;    }    #messages li {      padding: 8px 16px;      border-bottom: 1px solid #eee;    }    #messages li:last-child {      border-bottom: none;    }    #form {      display: flex;      margin-top: 10px;    }    #input {      flex-grow: 1;      padding: 10px;      font-size: 16px;    }    button {      padding: 10px 20px;      background: #4CAF50;      color: white;      border: none;      cursor: pointer;      margin-left: 10px;      }    button:hover {      background: #45a049;    }  </style></head><body>  <h1>Simple Chat</h1>  <ul id="messages"></ul>  <form id="form" action="#">    <input id="input" autocomplete="off" placeholder="Type your message..." />   <button>Send</button>   </form>  <script src="/socket.io/socket.io.js"></script>  <script>    const socket = io();    const form = document.getElementById('form');    const input = document.getElementById('input');    const messages = document.getElementById('messages');    // Handle form submission    form.addEventListener('submit', (e) => {        e.preventDefault();        const message = input.value.trim();        if (message) {            // Emit the message to the server            socket.emit('chat message', message);                // Clear the input                input.value = '';            }        });        // Listen for incoming messages        socket.on('chat message', (msg) => {            const item = document.createElement('li');            item.textContent = msg;            messages.appendChild(item);            // Scroll to the bottom            messages.scrollTop = messages.scrollHeight;        });    </script></body></html>
```

### Run the Application

1.  Start the server:
    
    node app.js
    
2.  Open your browser and navigate to `http://localhost:3000`
3.  Open multiple browser windows to see the real-time updates

### How It Works

1.  The server uses Express to serve the static files and handle the Socket.IO connection
2.  When a client connects, they can send messages that get broadcast to all connected clients
3.  The client-side JavaScript handles sending and receiving messages in real-time

### Next Steps

Once you have this basic version working, you might want to add:

*   Usernames for each message
*   User join/leave notifications
*   Different chat rooms
*   Message persistence
*   User authentication

**Note:** This is a basic example for demonstration purposes. In a production environment, you would want to add proper error handling, input validation, and security measures.

* * *

## Adding Usernames

Let's enhance our chat by adding usernames to messages. First, modify the server to handle usernames:

```javascript
// In app.js, modify the connection handlerio.on('connection', (socket) => {  console.log('A user connected');  // Store username with socket  socket.username = 'Anonymous';  // Handle new messages with username  socket.on('chat message', (msg) => {    io.emit('chat message', {      username: socket.username,      message: msg,      timestamp: new Date().toISOString()    });  });  // Handle username change  socket.on('set username', (username) => {    const oldUsername = socket.username;    socket.username = username || 'Anonymous';    io.emit('user joined', {      oldUsername: oldUsername,      newUsername: socket.username    });  });  // Handle disconnection  socket.on('disconnect', () => {    console.log('A user disconnected');    io.emit('user left', { username: socket.username });  });});
```

Now, update the client to handle usernames:

```javascript
<!-- Add username input at the top of the chat --><div id="username-container">    <input type="text" id="username-input" placeholder="Enter your username" />    <button id="set-username">Set Username</button></div><script>    // Add username handling    const usernameInput = document.getElementById('username-input');    const setUsernameBtn = document.getElementById('set-username');    let currentUsername = 'Anonymous';    setUsernameBtn.addEventListener('click', () => {        const newUsername = usernameInput.value.trim();        if (newUsername) {            socket.emit('set username', newUsername);            currentUsername = newUsername;            usernameInput.value = '';        }    });    // Update message display to show usernames    socket.on('chat message', (data) => {        const item = document.createElement('li');        item.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;        messages.appendChild(item);        messages.scrollTop = messages.scrollHeight;    });    // Handle user join notifications    socket.on('user joined', (data) => {        const item = document.createElement('li');        item.className = 'system-message';        if (data.oldUsername === 'Anonymous') {            item.textContent = `${data.newUsername} has joined the chat`;        } else {            item.textContent = `${data.oldUsername} is now known as ${data.newUsername}`;        }        messages.appendChild(item);        messages.scrollTop = messages.scrollHeight;    });    // Handle user leave notifications    socket.on('user left', (data) => {        const item = document.createElement('li');        item.className = 'system-message';        item.textContent = `${data.username} has left the chat`;        messages.appendChild(item);        messages.scrollTop = messages.scrollHeight;    });</script><style>.system-message {    color: #666;    font-style: italic;    font-size: 0.9em;}</style>
```

* * *

## Adding Chat Rooms

Let's add the ability to create and join different chat rooms. First, update the server:

```javascript
// In app.js, add room handlingconst rooms = new Set(['general', 'random']);io.on('connection', (socket) => {  // ... existing code ...  // Join a room  socket.on('join room', (room) => {    // Leave all rooms except the default one    socket.rooms.forEach(r => {      if (r !== socket.id) {        socket.leave(r);        socket.emit('left room', r);      }    });    // Join the new room    socket.join(room);    socket.emit('joined room', room);    // Notify others in the room    socket.to(room).emit('room message', {      username: 'System',      message: `${socket.username} has joined the room`,      timestamp: new Date().toISOString()    });  });  // Handle room creation  socket.on('create room', (roomName) => {    if (!rooms.has(roomName)) {      rooms.add(roomName);      io.emit('room created', roomName);    }  });  // Modify message handler to send to room  socket.on('chat message', (data) => {    const room = Array.from(socket.rooms).find(r => r !== socket.id) || 'general';    io.to(room).emit('chat message', {      username: socket.username,      message: data.message,      timestamp: new Date().toISOString(),      room: room    });  });});
```

Update the client to handle rooms:

```javascript
<div id="chat-container">    <div id="sidebar">        <h3>Rooms</h3>        <ul id="room-list">            <li class="room active" data-room="general">General</li>            <li class="room" data-room="random">Random</li>        </ul>        <div id="create-room">            <input type="text" id="new-room" placeholder="New room name" />            <button id="create-room-btn">Create Room</button>        </div>    </div>    <div id="chat-area">        <div id="messages"></div>        <form id="form">            <input id="input" autocomplete="off" />            <button>Send</button>        </form>    </div></div><script>    // Room handling    const roomList = document.getElementById('room-list');    const newRoomInput = document.getElementById('new-room');    const createRoomBtn = document.getElementById('create-room-btn');    let currentRoom = 'general';    // Join room when clicking on room in the list    roomList.addEventListener('click', (e) => {        if (e.target.classList.contains('room')) {            const room = e.target.dataset.room;            socket.emit('join room', room);            currentRoom = room;            document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));            e.target.classList.add('active');        }    });    // Create new room    createRoomBtn.addEventListener('click', () => {        const roomName = newRoomInput.value.trim();        if (roomName && !document.querySelector(`[data-room="${roomName}"]`)) {            socket.emit('create room', roomName);            newRoomInput.value = '';        }    });    // Handle new room creation    socket.on('room created', (roomName) => {        const roomItem = document.createElement('li');        roomItem.className = 'room';        roomItem.dataset.room = roomName;        roomItem.textContent = roomName;        roomList.appendChild(roomItem);    });    // Handle room join confirmation    socket.on('joined room', (room) => {        const item = document.createElement('li');        item.className = 'system-message';        item.textContent = `You joined ${room}`;        messages.appendChild(item);        currentRoom = room;        messages.scrollTop = messages.scrollHeight;    });    // Handle room messages    socket.on('room message', (data) => {        const item = document.createElement('li');        item.className = 'system-message';        item.textContent = data.message;        messages.appendChild(item);        messages.scrollTop = messages.scrollHeight;    });</script><style>#chat-container {    display: flex;    max-width: 1200px;    margin: 0 auto;}#sidebar {    width: 250px;    padding: 20px;    background-color: #f5f5f5;    border-right: 1px solid #ddd;}#chat-area {    flex: 1;    padding: 20px;}.room {    padding: 8px;    cursor: pointer;    border-radius: 4px;    margin: 4px 0;}.room:hover {    background-color: #e9e9e9;}.room.active {    background-color: #4CAF50;    color: white;}#create-room {    margin-top: 20px;}#new-room {    width: 100%;    padding: 8px;    margin-bottom: 8px;}#create-room-btn {    width: 100%;    padding: 8px;    background-color: #4CAF50;    color: white;    border: none;    border-radius: 4px;    cursor: pointer;}#create-room-btn:hover {    background-color: #45a049;}</style>
```

* * *

## Adding User List and Typing Indicators

Let's enhance our chat with a user list and typing indicators. First, update the server to track users and typing status:

```javascript
// In app.js, track users and typing statusconst usersInRooms = new Map();const typingUsers = new Map();io.on('connection', (socket) => {   // ... existing code ...   // Initialize user data   socket.on('join room', (room) => {     // ... existing join room code ...     // Initialize user data for the room     if (!usersInRooms.has(room)) {         usersInRooms.set(room, new Map());         typingUsers.set(room, new Set());     }     // Add user to room     usersInRooms.get(room).set(socket.id, {         username: socket.username,         id: socket.id     });         // Send updated user list to room     updateUserList(room);   });   // Handle typing status   socket.on('typing', (isTyping) => {     const room = Array.from(socket.rooms).find(r => r !== socket.id);     if (!room) return;         if (isTyping) {         typingUsers.get(room).add(socket.username);     } else {         typingUsers.get(room).delete(socket.username);     }         // Notify room about typing users     io.to(room).emit('typing users', Array.from(typingUsers.get(room)));   });   // Handle disconnection   socket.on('disconnect', () => {     // Remove from all rooms     Array.from(usersInRooms.entries()).forEach(([room, users]) => {         if (users.has(socket.id)) {            users.delete(socket.id);            typingUsers.get(room)?.delete(socket.username);            updateUserList(room);         }     }   });   });   // Helper function to update user list for a room   function updateUserList(room) {     const users = Array.from(usersInRooms.get(room)?.values() || []);     io.to(room).emit('user list', {         room: room,         users: users.map(u => ({            username: u.username,            isTyping: typingUsers.get(room)?.has(u.username) || false         }))     });   }   });});
```

Update the client to show the user list and handle typing indicators:

```javascript
<div id="chat-container">  <div id="sidebar">    <h3>Rooms</h3>    <ul id="room-list">     <!-- Room list will be populated here -->    </ul>    <div id="create-room">     <input type="text" id="new-room" placeholder="New room name" />     <button id="create-room-btn">Create Room</button>    </div>    <h3>Users in Room</h3>    <ul id="user-list">     <!-- User list will be populated here -->    </ul>  </div>  <div id="chat-area">    <div id="typing-indicator"></div>    <div id="messages"></div>    <form id="form">     <input id="input" autocomplete="off" placeholder="Type a message..." />     <button>Send</button>    </form>  </div></div><script>   // ... existing code ...   const userList = document.getElementById('user-list');   const typingIndicator = document.getElementById('typing-indicator');   const messageInput = document.getElementById('input');   let typingTimeout;   // Handle typing events   messageInput.addEventListener('input', () => {     // User is typing     if (!typingTimeout) {         socket.emit('typing', true);     }         // Clear previous timeout     clearTimeout(typingTimeout);         // Set a timeout to indicate user stopped typing     typingTimeout = setTimeout(() => {         socket.emit('typing', false);         typingTimeout = null;     }, 1000);   });   // Handle form submission   form.addEventListener('submit', (e) => {     e.preventDefault();     if (messageInput.value.trim()) {         socket.emit('chat message', {            message: messageInput.value,            room: currentRoom         });         messageInput.value = '';                 // Clear typing status         if (typingTimeout) {            clearTimeout(typingTimeout);            typingTimeout = null;            socket.emit('typing', false);         }     }   });   // Update user list   socket.on('user list', (data) => {     if (data.room === currentRoom) {         userList.innerHTML = '';         data.users.forEach(user => {            const userItem = document.createElement('li');            userItem.textContent = user.username;            if (user.isTyping) {               userItem.innerHTML += ' <span class="typing">typing...</span>';            }            userList.appendChild(userItem);         });     }   });   // Update typing indicator   socket.on('typing users', (usernames) => {     const typingUsers = usernames.filter(u => u !== currentUsername);     if (typingUsers.length > 0) {         typingIndicator.textContent = `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;         typingIndicator.style.display = 'block';     } else {         typingIndicator.style.display = 'none';     }   });</script><style>   /* Add to existing styles */   #typing-indicator {         color: #666;         font-style: italic;         font-size: 0.9em;         padding: 5px 10px;         display: none;   }   .typing {         color: #666;         font-size: 0.8em;         font-style: italic;   }   #user-list {         list-style: none;         padding: 0;         margin: 10px 0;   }   #user-list li {         padding: 5px 10px;         border-radius: 3px;         margin: 2px 0;   }   #user-list li:hover {         background-color: #f0f0f0;   }</style>
```

* * *

## Client-Side API Overview

The client-side Socket.IO API provides methods for:

*   `io()` - Connects to the server
*   `socket.emit()` - Sends an event to the server
*   `socket.on()` - Listens for events from the server
*   `socket.disconnect()` - Disconnects from the server

* * *

## Socket.IO Events

Socket.IO uses an event-based architecture for communication. Here are some key events:

### Built-in Events

*   `connect` - Fired upon connection
*   `disconnect` - Fired upon disconnection
*   `error` - Fired upon an error
*   `reconnect` - Fired upon successful reconnection
*   `reconnect_attempt` - Fired upon reconnection attempt

* * *

## Socket.IO Middleware

Socket.IO allows you to define middleware functions for authentication and other purposes:

```javascript
const io = new Server(server);// Middleware for authenticationio.use((socket, next) => {  const token = socket.handshake.auth.token;    if (!token) {    return next(new Error('Authentication error: Token missing'));  }    // Verify token (example with JWT)  try {    const user = jwt.verify(token, 'your-secret-key');    socket.user = user;    next();  } catch (error) {    next(new Error('Authentication error: Invalid token'));  }});io.on('connection', (socket) => {  console.log(`Authenticated user connected: ${socket.user.username}`);});
```

* * *

## Socket.IO vs Native WebSockets

                                                                                                                                                                       

Feature

Socket.IO

Native WebSockets

Fallback Mechanisms

Yes (HTTP long-polling, etc.)

No

Automatic Reconnection

Yes

No (must implement)

Broadcasting

Built-in

Manual implementation

Rooms/Namespaces

Built-in

Manual implementation

Browser Support

All browsers

Modern browsers only

Packet Size

Larger (protocol overhead)

Smaller

Binary Data

Supported

Supported

Socket.IO is preferred when you need reliability, compatibility, and higher-level features, while native WebSockets are more lightweight and have less overhead.

* * *

* * *