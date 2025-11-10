(function () {
	const canvas = document.getElementById('canvas');
	const cursorsLayer = document.getElementById('cursorsLayer');
	const ctx = canvas.getContext('2d');
	const offscreen = document.createElement('canvas');
	const off = offscreen.getContext('2d');

	let tool = 'brush';
	let color = '#2f80ed';
	let size = 6;

	let isDrawing = false;
	let currentPoints = [];
	let lastStreamAt = 0;
	let tempIdCounter = 0;

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const w = Math.floor(rect.width);
		const h = Math.floor(rect.height);
		if (w === canvas.width && h === canvas.height) return;
		const old = document.createElement('canvas');
		old.width = canvas.width;
		old.height = canvas.height;
		old.getContext('2d').drawImage(canvas, 0, 0);

		canvas.width = w;
		canvas.height = h;
		offscreen.width = w;
		offscreen.height = h;
		ctx.clearRect(0, 0, w, h);
		off.clearRect(0, 0, w, h);
		window.requestRedraw && window.requestRedraw();
	}
	window.addEventListener('resize', resize);
	setTimeout(resize, 0);

	function setTool(nextTool) { tool = nextTool; }
	function setColor(nextColor) { color = nextColor; }
	function setSize(nextSize) { size = nextSize; }

	function pointerPos(e) {
		const rect = canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left);
		const y = (e.clientY - rect.top);
		return { x, y, t: Date.now() };
	}

	function drawPath(context, stroke) {
		context.save();
		context.globalCompositeOperation = stroke.composite || 'source-over';
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.strokeStyle = stroke.color;
		context.lineWidth = stroke.size;
		context.beginPath();
		const pts = stroke.points;
		if (!pts || pts.length === 0) return;
		context.moveTo(pts[0].x, pts[0].y);
		for (let i = 1; i < pts.length; i++) {
			const p = pts[i];
			context.lineTo(p.x, p.y);
		}
		context.stroke();
		context.restore();
	}

	canvas.addEventListener('pointerdown', (e) => {
		e.preventDefault();
		canvas.setPointerCapture(e.pointerId);
		isDrawing = true;
		currentPoints = [pointerPos(e)];
		lastStreamAt = 0;
	});
	canvas.addEventListener('pointermove', (e) => {
		if (!isDrawing) return;
		currentPoints.push(pointerPos(e));
		const now = performance.now();
		if (now - lastStreamAt > 16) {
			streamCurrent('append');
			lastStreamAt = now;
		}
	});
	function endStroke(e) {
		if (!isDrawing) return;
		if (e) e.preventDefault();
		isDrawing = false;
		streamCurrent('end');
		commitCurrent();
		currentPoints = [];
	}
	canvas.addEventListener('pointerup', endStroke);
	canvas.addEventListener('pointercancel', endStroke);
	canvas.addEventListener('pointerleave', endStroke);

	function streamCurrent(kind) {
		if (currentPoints.length === 0) return;
		const payload = {
			tempId: `tmp-${++tempIdCounter}`,
			tool,
			color,
			size,
			points: currentPoints.slice(-4),
			composite: tool === 'eraser' ? 'destination-out' : 'source-over'
		};
		drawPath(ctx, { ...payload, points: payload.points });
		window.Realtime.streamStroke(payload);
	}

	function commitCurrent() {
		if (currentPoints.length < 1) return;
		const stroke = {
			tool,
			color,
			size,
			points: currentPoints.slice(),
			composite: tool === 'eraser' ? 'destination-out' : 'source-over',
			createdAt: Date.now()
		};
		window.Realtime.commitStroke(stroke);
	}

	window.Realtime.on('stroke:stream', ({ tool, color, size, points, userId, composite }) => {
		drawPath(ctx, { tool, color, size, points, composite });
	});
	function redrawFromOps(ops) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const op of ops) {
			if (op.type === 'stroke') {
				drawPath(ctx, {
					tool: op.data.tool,
					color: op.data.color,
					size: op.data.size,
					points: op.data.points,
					composite: op.data.composite
				});
			}
		}
	}
	window.requestRedraw = () => {
		if (window.getOps) {
			redrawFromOps(window.getOps());
		}
	};
	window.Realtime.on('stroke:commit', (op) => {
		if (window.addOp) window.addOp(op);
		redrawFromOps(window.getOps ? window.getOps() : []);
	});
	window.Realtime.on('undo:applied', ({ opId }) => {
		if (window.removeOpById) window.removeOpById(opId);
		redrawFromOps(window.getOps ? window.getOps() : []);
	});
	window.Realtime.on('redo:applied', (op) => {
		if (window.addOp) window.addOp(op);
		if (op.type === 'stroke') {
			drawPath(ctx, {
				tool: op.data.tool,
				color: op.data.color,
				size: op.data.size,
				points: op.data.points,
				composite: op.data.composite
			});
		}
	});

	const cursorElements = new Map();
	function upsertCursor({ userId, cursor }) {
		if (!cursor) return;
		let el = cursorElements.get(userId);
		if (!el) {
			el = document.createElement('div');
			el.className = 'cursor';
			cursorElements.set(userId, el);
			cursorsLayer.appendChild(el);
		}
		el.style.left = cursor.x + 'px';
		el.style.top = cursor.y + 'px';
		el.style.borderColor = cursor.color || '#000';
		el.textContent = cursor.name || userId.slice(0, 4);
		el.style.color = '#111';
	}
	function removeCursor({ userId }) {
		const el = cursorElements.get(userId);
		if (el) {
			cursorsLayer.removeChild(el);
			cursorElements.delete(userId);
		}
	}
	window.Realtime.on('cursor:update', upsertCursor);
	window.Realtime.on('cursor:remove', removeCursor);

	window.CanvasAPI = { setTool, setColor, setSize, redrawFromOps };
})();


