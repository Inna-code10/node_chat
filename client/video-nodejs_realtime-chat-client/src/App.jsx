import { useEffect, useState } from 'react';
import './App.css';
import { MessageForm } from './MessageForm.jsx';
import { MessageList } from './MessageList.jsx';
import { RoomList } from './RoomList.jsx';
import { UsernameForm } from './UsernameForm.jsx';
import { useWebSocket } from './WebSocket.jsx';

export function App() {
  const [username, setUsername] = useState(
    () => localStorage.getItem('username') || '',
  );

  const {
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
  } = useWebSocket();

  // як тільки з'єднання відкрилось і є ім'я — заходимо в чат
  useEffect(() => {
    if (isConnected && username) {
      join(username, null);
    }
  }, [isConnected, username, join]);

  if (!username) {
    return (
      <section className="section content">
        <h1 className="title">Chat application</h1>
        <UsernameForm onSubmit={setUsername} />
      </section>
    );
  }

  return (
    <section className="section content">
      <h1 className="title">
        Chat application — <small>{username}</small>
      </h1>

      <RoomList
        rooms={rooms}
        activeRoomId={activeRoomId}
        onJoin={switchRoom}
        onCreate={createRoom}
        onRename={renameRoom}
        onDelete={deleteRoom}
      />

      <MessageList messages={messages} />
      <MessageForm onSend={sendMessage} />
    </section>
  );
}