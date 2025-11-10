const { randomUUID } = require('node:crypto');

function generateId() {
	return randomUUID().replace(/-/g, '').slice(0, 12);
}

class DrawingState {
	constructor() {
		this.operations = [];
		this.redoStack = [];
	}

	addStroke(stroke) {
		const op = {
			id: stroke.id || generateId(),
			type: 'stroke',
			data: {
				tool: stroke.tool,
				color: stroke.color,
				size: stroke.size,
				points: stroke.points,
				composite: stroke.composite || 'source-over',
				createdAt: stroke.createdAt || Date.now()
			},
			userId: stroke.userId
		};
		this.operations.push(op);
		this.redoStack = [];
		return op;
	}

	undo() {
		if (this.operations.length === 0) return null;
		const op = this.operations.pop();
		this.redoStack.push(op);
		return op;
	}

	redo() {
		if (this.redoStack.length === 0) return null;
		const op = this.redoStack.pop();
		this.operations.push(op);
		return op;
	}

	getVisibleOps() {
		return this.operations.slice();
	}
}

module.exports = { DrawingState };


