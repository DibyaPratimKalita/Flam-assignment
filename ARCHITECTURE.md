# Architecture

## Data Flow

1. User draws on canvas → client streams recent points at ~60fps via `stroke:stream`.
2. Server forwards streamed points to other clients in the room for immediate preview.
3. On pointer up, client sends `stroke:commit` with full stroke data.
4. Server turns stroke into an operation, appends to the room's operation log, clears redo stack, and broadcasts `stroke:commit`.
5. Clients append operation and draw it. On `undo`/`redo`, server updates log and broadcasts, clients reconcile and redraw.

```
Pointer events → Client stroke buffer → stream (io) → Other clients preview
                                         commit (io) → Server op log → broadcast → All clients apply
```

## WebSocket Protocol (Socket.IO events)

- Client → Server
  - `join` { roomId, displayName }
  - `cursor:update` { x, y, name, color }
  - `stroke:stream` { tempId, tool, color, size, points[], composite }
  - `stroke:commit` { tool, color, size, points[], composite, createdAt }
  - `undo`
  - `redo`

- Server → Client
  - `room:init` { roomId, users[], history[] }
  - `user:join` { id, name, color }
  - `user:leave` { userId }
  - `cursor:update` { userId, cursor }
  - `stroke:stream` { userId, tempId, tool, color, size, points[], composite }
  - `stroke:commit` { id, type, data, userId }
  - `undo:applied` { opId }
  - `redo:applied` { id, type, data, userId }

## Undo/Redo Strategy (Global)

- Server maintains a global operation log per room:
  - `operations[]`: applied ops (strokes)
  - `redoStack[]`: undone ops
- `undo`: pop from `operations` → push to `redoStack` → broadcast `undo:applied { opId }`
- `redo`: pop from `redoStack` → push to `operations` → broadcast `redo:applied { op }`
- Clients rebuild canvas by replaying `operations` in order. On resize or state mismatch, redraw from `ops`.
- Conflict resolution when User A undoes User B's stroke: allowed by design since history is global. Last-in-first-out consistency is prioritized over per-user authorship.

## Performance Decisions

- Stream points at ~60fps to reduce network overhead while keeping smoothness.
- Client-side prediction: draw streamed segments immediately to feel responsive.
- Canvas redraw is done from operation log when necessary (resize, undo/redo).
- Eraser uses `globalCompositeOperation = destination-out` to avoid per-pixel diffing.
- Throttled cursor updates at ~30fps to reduce chatter.

## Simultaneous Drawing & Conflict Resolution

- All strokes are composited in arrival order with standard blending (`source-over`) or erasing (`destination-out`).
- Overlaps are handled visually by compositing; no locking. This keeps latency low and behavior predictable.
- Undo/redo operates on the last committed operation globally to keep all clients consistent.


