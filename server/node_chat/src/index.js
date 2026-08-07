'use strict';

const { WebSocketServer } = require('ws');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 5000;
const wss = new WebSocketServer({ port: PORT });

// In-memory сховище кімнат: Map<roomId, { id, name, messages: [] }>
const rooms = new Map();

function createRoom(name) {
  const id = randomUUID();

  rooms.set(id, { id, name, messages: [] });

  return rooms.get(id);
}

// Стартова кімната, щоб було куди зайти одразу
createRoom('General');

function getRoomsList() {
  return [...rooms.values()].map(({ id, name }) => ({ id, name }));
}

function broadcastToAll(data) {
  const payload = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastToRoom(roomId, data) {
  const payload = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.roomId === roomId) {
      client.send(payload);
    }
  });
}

function sendTo(ws, data) {
  ws.send(JSON.stringify(data));
}

wss.on('connection', (ws) => {
  ws.username = null;
  ws.roomId = null;

  ws.on('message', (raw) => {
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return sendTo(ws, { type: 'error', message: 'Invalid JSON' });
    }

    switch (data.type) {
      case 'join': {
        ws.username = data.username;
        ws.roomId = data.roomId || getRoomsList()[0].id;

        const room = rooms.get(ws.roomId);

        sendTo(ws, { type: 'rooms', rooms: getRoomsList() });

        sendTo(ws, {
          type: 'history',
          roomId: room.id,
          messages: room.messages,
        });
        break;
      }

      case 'switch_room': {
        const room = rooms.get(data.roomId);

        if (!room) {
          return sendTo(ws, { type: 'error', message: 'Room not found' });
        }

        ws.roomId = room.id;

        sendTo(ws, {
          type: 'history',
          roomId: room.id,
          messages: room.messages,
        });
        break;
      }

      case 'message': {
        const room = rooms.get(ws.roomId);

        if (!room || !ws.username) {
          return sendTo(ws, { type: 'error', message: 'Join a room first' });
        }

        const message = {
          author: ws.username,
          text: data.text,
          time: new Date().toISOString(),
        };

        room.messages.push(message);
        broadcastToRoom(room.id, { type: 'message', roomId: room.id, message });
        break;
      }

      case 'create_room': {
        const room = createRoom(data.name);

        broadcastToAll({ type: 'rooms', rooms: getRoomsList() });
        break;
      }

      case 'rename_room': {
        const room = rooms.get(data.roomId);

        if (!room) {
          return sendTo(ws, { type: 'error', message: 'Room not found' });
        }

        room.name = data.name;
        broadcastToAll({ type: 'rooms', rooms: getRoomsList() });
        break;
      }

      case 'delete_room': {
        rooms.delete(data.roomId);

        const fallback = getRoomsList()[0];

        wss.clients.forEach((client) => {
          if (client.roomId === data.roomId) {
            client.roomId = fallback ? fallback.id : null;

            if (fallback) {
              sendTo(client, {
                type: 'history',
                roomId: fallback.id,
                messages: rooms.get(fallback.id).messages,
              });
            }
          }
        });

        broadcastToAll({ type: 'rooms', rooms: getRoomsList() });
        break;
      }

      default:
        sendTo(ws, { type: 'error', message: `Unknown type: ${data.type}` });
    }
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
