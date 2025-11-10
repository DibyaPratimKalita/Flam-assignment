window.Realtime = (function () {
	const socket = io();
	let joined = false;
	let userColor = null;
	let users = new Map();

	const listeners = {};
	function emitLocal(event, payload) {
		(listeners[event] || []).forEach(fn => fn(payload));
	}
	function on(event, fn) {
		if (!listeners[event]) listeners[event] = [];
		listeners[event].push(fn);
		return () => {
			listeners[event] = (listeners[event] || []).filter(f => f !== fn);
		};
	}

	socket.on('room:init', (snapshot) => {
		users = new Map(snapshot.users.map(u => [u.id, u]));
		emitLocal('room:init', snapshot);
		emitLocal('users:update', Array.from(users.values()));
	});
	socket.on('user:join', (user) => {
		users.set(user.id, user);
		emitLocal('users:update', Array.from(users.values()));
	});
	socket.on('user:leave', ({ userId }) => {
		users.delete(userId);
		emitLocal('users:update', Array.from(users.values()));
		emitLocal('cursor:remove', { userId });
	});

	socket.on('cursor:update', (payload) => emitLocal('cursor:update', payload));
	socket.on('stroke:stream', (payload) => emitLocal('stroke:stream', payload));
	socket.on('stroke:commit', (op) => emitLocal('stroke:commit', op));
	socket.on('undo:applied', (data) => emitLocal('undo:applied', data));
	socket.on('redo:applied', (op) => emitLocal('redo:applied', op));

	function join(roomId, displayName) {
		if (joined) return;
		socket.emit('join', { roomId, displayName });
		joined = true;
	}
	function updateCursor(cursor) {
		if (!joined) return;
		socket.emit('cursor:update', cursor);
	}
	function streamStroke(payload) {
		socket.emit('stroke:stream', payload);
	}
	function commitStroke(stroke) {
		socket.emit('stroke:commit', stroke);
	}
	function undo() { socket.emit('undo'); }
	function redo() { socket.emit('redo'); }

	function getUsers() { return Array.from(users.values()); }

	return { on, join, updateCursor, streamStroke, commitStroke, undo, redo, getUsers };
})();


