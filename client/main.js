(function () {
	const roomInput = document.getElementById('roomId');
	const nameInput = document.getElementById('displayName');
	const joinBtn = document.getElementById('joinBtn');
	const undoBtn = document.getElementById('undoBtn');
	const redoBtn = document.getElementById('redoBtn');
	const usersList = document.getElementById('usersList');

	const toolButtons = Array.from(document.querySelectorAll('.tool'));
	const colorPicker = document.getElementById('colorPicker');
	const sizePicker = document.getElementById('sizePicker');
	const canvas = document.getElementById('canvas');

	let joined = false;
	let ops = [];
	function renderUsers(users) {
		usersList.innerHTML = '';
		for (const u of users) {
			const li = document.createElement('li');
			const dot = document.createElement('span');
			dot.className = 'dot';
			dot.style.background = u.color;
			li.appendChild(dot);
			li.appendChild(document.createTextNode(u.name));
			usersList.appendChild(li);
		}
	}

	window.Realtime.on('users:update', renderUsers);
	window.Realtime.on('room:init', (snapshot) => {
		ops = snapshot.history || [];
		window.CanvasAPI.redrawFromOps(ops);
	});

	window.addOp = (op) => { ops.push(op); };
	window.removeOpById = (id) => {
		const idx = ops.findIndex(o => o.id === id);
		if (idx >= 0) ops.splice(idx, 1);
	};
	window.getOps = () => ops.slice();

	joinBtn.addEventListener('click', () => {
		if (joined) return;
		window.Realtime.join(roomInput.value.trim() || 'default', nameInput.value.trim() || '');
		joined = true;
	});

	window.addEventListener('load', () => {
		if (!joined) {
			window.Realtime.join(roomInput.value.trim() || 'default', nameInput.value.trim() || '');
			joined = true;
		}
	});

	toolButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			toolButtons.forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
			window.CanvasAPI.setTool(btn.getAttribute('data-tool'));
		});
	});
	colorPicker.addEventListener('input', (e) => window.CanvasAPI.setColor(e.target.value));
	sizePicker.addEventListener('input', (e) => window.CanvasAPI.setSize(parseInt(e.target.value, 10)));

	undoBtn.addEventListener('click', () => window.Realtime.undo());
	redoBtn.addEventListener('click', () => window.Realtime.redo());

	window.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
			window.Realtime.undo();
			e.preventDefault();
		}
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
			window.Realtime.redo();
			e.preventDefault();
		}
	});

	let lastCursorSent = 0;
	window.addEventListener('pointermove', (e) => {
		if (!joined) return;
		const rect = canvas.getBoundingClientRect();
		const now = performance.now();
		if (now - lastCursorSent < 33) return;
		lastCursorSent = now;
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const me = window.Realtime.getUsers().find(Boolean);
		window.Realtime.updateCursor({
			x, y,
			name: nameInput.value.trim() || 'Me',
			color: colorPicker.value
		});
	});
})();


