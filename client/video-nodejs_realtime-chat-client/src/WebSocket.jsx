// src/WebSocket.jsx
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:5000';

export function useWebSocket() {
  const wsRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'rooms') {
        setRooms(data.rooms);
      }

      if (data.type === 'history') {
        setActiveRoomId(data.roomId);
        setMessages(data.messages);
      }

      if (data.type === 'message' && data.roomId === activeRoomIdRef.current) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // потрібен ref, бо onmessage замикається на "старий" activeRoomId
  const activeRoomIdRef = useRef(activeRoomId);
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const join = useCallback(
    (username, roomId) => send({ type: 'join', username, roomId }),
    [send],
  );

  const switchRoom = useCallback(
    (roomId) => send({ type: 'switch_room', roomId }),
    [send],
  );

  const sendMessage = useCallback(
    (text) => send({ type: 'message', text }),
    [send],
  );

  const createRoom = useCallback(
    (name) => send({ type: 'create_room', name }),
    [send],
  );

  const renameRoom = useCallback(
    (roomId, name) => send({ type: 'rename_room', roomId, name }),
    [send],
  );

  const deleteRoom = useCallback(
    (roomId) => send({ type: 'delete_room', roomId }),
    [send],
  );

  return {
    isConnected,
    rooms,
    activeRoomId,
    messages,
    join,
    switchRoom,
    sendMessage,
    createRoom,
    renameRoom,
    deleteRoom,
  };
}
