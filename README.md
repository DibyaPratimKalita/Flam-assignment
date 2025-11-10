# Real-Time Collaborative Drawing Canvas

Vanilla JS + HTML5 Canvas client with a Node.js + Socket.IO backend for real-time multi-user drawing, cursors, and global undo/redo.

## Setup

Prerequisites: Node.js 18+

```bash
npm install
npm start
```

Open `http://localhost:3000` in multiple browser tabs. Join the same room (e.g., `default`) using different names to test collaboration.

## Features

- Brush and eraser tools
- Color picker and stroke width
- Real-time streaming of in-progress strokes (client-side prediction)
- Global undo/redo managed by the server
- User list with assigned colors



## Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html
│   ├── style.css
│   ├── canvas.js
│   ├── websocket.js
│   └── main.js
├── server/
│   ├── server.js
│   ├── rooms.js
│   └── drawing-state.js
├── package.json
├── README.md
└── ARCHITECTURE.md
```




