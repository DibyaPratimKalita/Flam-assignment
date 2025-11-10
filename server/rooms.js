const { DrawingState } = require('./drawing-state');

function randomColorForSeed(seed) {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = ((hash << 5) - hash) + seed.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 70%, 50%)`;
}

class RoomsManager {
	constructor() {
		this.roomIdToRoom = new Map();
	}

	getOrCreate(roomId) {
		if (!this.roomIdToRoom.has(roomId)) {
			this.roomIdToRoom.set(roomId, {
				id: roomId,
				users: new Map(),
				state: new DrawingState()
			});
		}
		return this.roomIdToRoom.get(roomId);
	}

	addUser(roomId, socketId, displayName) {
		const room = this.getOrCreate(roomId);
		const color = randomColorForSeed(socketId + (displayName || ''));
		const user = {
			id: socketId,
			name: displayName || `User-${socketId.slice(0, 4)}`,
			color,
			cursor: null
		};
		room.users.set(socketId, user);
		const snapshot = {
			roomId,
			users: Array.from(room.users.values()).map(u => ({
				id: u.id, name: u.name, color: u.color, cursor: u.cursor
			})),
			history: room.state.getVisibleOps()
		};
		return { userInfo: { public: { id: user.id, name: user.name, color: user.color } }, snapshot };
	}

	updateCursor(roomId, socketId, cursor) {
		const room = this.getOrCreate(roomId);
		const user = room.users.get(socketId);
		if (user) user.cursor = cursor;
	}

	commitStroke(roomId, socketId, stroke) {
		const room = this.getOrCreate(roomId);
		return room.state.addStroke({
			...stroke,
			userId: socketId
		});
	}

	undo(roomId) {
		const room = this.getOrCreate(roomId);
		return room.state.undo();
	}

	redo(roomId) {
		const room = this.getOrCreate(roomId);
		return room.state.redo();
	}

	removeUser(roomId, socketId) {
		const room = this.getOrCreate(roomId);
		const existed = room.users.delete(socketId);
		return existed;
	}
}

module.exports = { RoomsManager };


