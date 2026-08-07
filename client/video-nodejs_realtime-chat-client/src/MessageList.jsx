export const MessageList = ({ messages }) => (
  <ul className="message-list">
    {messages.map((message) => (
      <li key={message.time + message.author}>
        <strong>{message.author}</strong>{' '}
        <span className="time">
          {new Date(message.time).toLocaleTimeString()}
        </span>
        <p>{message.text}</p>
      </li>
    ))}
  </ul>
);
