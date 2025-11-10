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
- Live user cursors with names
- Global undo/redo managed by the server
- User list with assigned colors

## How to Test with Multiple Users

1. Start the server: `npm start`
2. Open two or more tabs at `http://localhost:3000`
3. Enter the same room id (e.g., `default`) and different names
4. Draw simultaneously and observe real-time sync, cursors, and undo/redo

## Known Limitations

- No persistence: Room state lives in memory (cleared when server restarts)
- No image export/import
- Simple stroke path algorithm (polyline); smoothing can be improved
- Conflict resolution is compositing-based; overlapping strokes visually blend
- Room access is open; no auth

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

## Time Spent

~3–5 hours for initial implementation and documentation.


