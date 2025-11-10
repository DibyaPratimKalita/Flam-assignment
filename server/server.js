const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { RoomsManager } = require('./rooms');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: { origin: '*' }
});

const rooms = new RoomsManager();

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const clientDir = path.join(rootDir, 'client');
const staticDir = fs.existsSync(distDir) ? distDir : clientDir;
app.use(express.static(staticDir));

io.on('connection', (socket) => {
	let currentRoomId = null;
	let user = null;

	socket.on('join', ({ roomId, displayName }) => {
		currentRoomId = roomId || 'default';
		const { userInfo, snapshot } = rooms.addUser(currentRoomId, socket.id, displayName);
		user = userInfo;
		socket.join(currentRoomId);

		socket.emit('room:init', snapshot);
		socket.to(currentRoomId).emit('user:join', userInfo.public);
	});

	socket.on('cursor:update', (cursor) => {
		if (!currentRoomId) return;
		rooms.updateCursor(currentRoomId, socket.id, cursor);
		socket.to(currentRoomId).emit('cursor:update', { userId: socket.id, cursor });
	});

	socket.on('stroke:stream', (payload) => {
		if (!currentRoomId) return;
		socket.to(currentRoomId).emit('stroke:stream', { userId: socket.id, ...payload });
	});

	socket.on('stroke:commit', (stroke) => {
		if (!currentRoomId) return;
		const op = rooms.commitStroke(currentRoomId, socket.id, stroke);
		io.in(currentRoomId).emit('stroke:commit', op);
	});

	socket.on('undo', () => {
		if (!currentRoomId) return;
		const op = rooms.undo(currentRoomId);
		if (op) {
			io.in(currentRoomId).emit('undo:applied', { opId: op.id });
		}
	});

	socket.on('redo', () => {
		if (!currentRoomId) return;
		const op = rooms.redo(currentRoomId);
		if (op) {
			io.in(currentRoomId).emit('redo:applied', op);
		}
	});

	socket.on('disconnect', () => {
		if (!currentRoomId) return;
		const left = rooms.removeUser(currentRoomId, socket.id);
		if (left) {
			socket.to(currentRoomId).emit('user:leave', { userId: socket.id });
		}
	});
});

server.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});


