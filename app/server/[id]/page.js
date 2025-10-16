// app/server/[id]/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ServerPage() {
  const { id: roomId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(0);
  const [username, setUsername] = useState('');
  const [text, setText] = useState('');
  const [roomExists, setRoomExists] = useState(true);
  const endRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const es = new EventSource(`/api/room/${roomId}/sse`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'init' || data.type === 'update') {
        setMessages(data.messages || []);
        setActive(data.active || 0);
        setRoomExists(true);
        setTimeout(scrollToBottom, 100);
      } else if (data.type === 'closed') {
        setRoomExists(false);
        es.close();
      }
    };
    es.onerror = () => {
      setRoomExists(false);
      es.close();
    };
    return () => es.close();
  }, [roomId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !text.trim()) return;
    await fetch(`/api/room/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), text: text.trim() })
    });
    setText('');
  };

  const handleClose = async () => {
    if (!confirm('Close this server for everyone?')) return;
    await fetch(`/api/room/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close' })
    });
    router.push('/');
  };

  if (!roomExists) return <div style={{ padding: '2rem', color: 'white' }}><h2>Server closed</h2></div>;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#313338', color: 'white' }}>
      {/* Fake sidebar (reuse from dashboard) */}
      <div style={{ width: '240px', backgroundColor: '#2b2d31' }}></div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #4f545c', backgroundColor: '#2b2d31' }}>
          <h2>Server #{roomId}</h2>
          <span>👥 {active} online</span>
        </div>

        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#313338' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '1rem' }}>
              <strong>{msg.username}:</strong> {msg.text}
              <br />
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid #4f545c', backgroundColor: '#2b2d31' }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            style={{ width: '120px', padding: '0.5rem', marginRight: '0.5rem', backgroundColor: '#313338', color: 'white', border: '1px solid #4f545c' }}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            style={{ flex: 1, padding: '0.5rem', marginRight: '0.5rem', backgroundColor: '#313338', color: 'white', border: '1px solid #4f545c' }}
          />
          <button
            type="submit"
            disabled={!username.trim() || !text.trim()}
            style={{ padding: '0.5rem 1rem', background: '#5865F2', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Send
          </button>
        </form>

        <div style={{ padding: '0.5rem 1rem', backgroundColor: '#2b2d31' }}>
          <button
            onClick={handleClose}
            style={{ background: '#ff4444', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px' }}
          >
            🔒 Close Server
          </button>
        </div>
      </div>
    </div>
  );
}
