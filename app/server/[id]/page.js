// app/server/[id]/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ServerPage() {
  const { id: serverId } = useParams();
  const router = useRouter();
  const [serverName, setServerName] = useState('Loading...');
  const [channels, setChannels] = useState([{ id: 'general', name: 'general' }]);
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [username, setUsername] = useState('');
  const [text, setText] = useState('');
  const [roomExists, setRoomExists] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simulate server name (in real app, fetch from /api/server/[id])
  useEffect(() => {
    setServerName(decodeURIComponent(serverId).replace(/-/g, ' '));
  }, [serverId]);

  // SSE for real-time updates
  useEffect(() => {
    const roomId = `${serverId}-${activeChannel}`;
    const es = new EventSource(`/api/room/${roomId}/sse`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'init' || data.type === 'update') {
        setMessages(data.messages || []);
        setActiveUsers(data.active || 0);
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
  }, [serverId, activeChannel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !text.trim()) return;

    const roomId = `${serverId}-${activeChannel}`;
    await fetch(`/api/room/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), text: text.trim() }),
    });
    setText('');
  };

  const handleCloseServer = async () => {
    if (!confirm(`Are you sure you want to permanently close "${serverName}" for everyone?`)) return;

    const roomId = `${serverId}-${activeChannel}`;
    await fetch(`/api/room/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close' }),
    });
    router.push('/');
  };

  if (!roomExists) {
    return (
      <div style={{ padding: '2rem', color: '#fff', backgroundColor: '#313338', textAlign: 'center' }}>
        <h2>🔒 Server Closed</h2>
        <p>This server has been deleted.</p>
        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#5865F2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#313338', color: '#dcddde' }}>
      {/* Left Sidebar — Servers & DMs */}
      <div style={{ width: '72px', backgroundColor: '#2b2d31', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#5865F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/')}
        >
          <span style={{ fontWeight: 'bold', color: 'white' }}>C</span>
        </div>

        {/* Mock server icons */}
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#4f545c', marginBottom: '8px' }} />
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#4f545c' }} />

        <div style={{ marginTop: 'auto', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#4f545c' }} />
      </div>

      {/* Server Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Channel List */}
        <div style={{ width: '240px', backgroundColor: '#2b2d31', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', fontWeight: 'bold', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {serverName}
          </div>
          <div style={{ padding: '4px 16px', color: '#b5bac1', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Text Channels
          </div>
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                color: activeChannel === channel.id ? '#fff' : '#b5bac1',
                backgroundColor: activeChannel === channel.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
            >
              # {channel.name}
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top Bar */}
          <div style={{ height: '56px', backgroundColor: '#2e3035', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <span># {activeChannel}</span>
            <span style={{ marginLeft: '16px', color: '#b5bac1', fontSize: '14px' }}>
              {activeUsers} {activeUsers === 1 ? 'member' : 'members'}
            </span>
            <button
              onClick={handleCloseServer}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              🔒 Close Server
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#313338' }}>
            {messages.length === 0 ? (
              <p style={{ color: '#72767d' }}>No messages yet. Send the first one!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>{msg.username}</div>
                  <div style={{ color: '#dcddde', fontSize: '16px', marginTop: '4px' }}>{msg.text}</div>
                  <div style={{ color: '#72767d', fontSize: '12px', marginTop: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '12px',
              borderTop: '1px solid #4f545c',
              backgroundColor: '#2e3035',
              display: 'flex',
              gap: '12px',
            }}
          >
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              style={{
                width: '140px',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #4f545c',
                backgroundColor: '#313338',
                color: '#fff',
              }}
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message #${activeChannel}`}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #4f545c',
                backgroundColor: '#313338',
                color: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={!username.trim() || !text.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: username.trim() && text.trim() ? '#5865F2' : '#4f545c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: username.trim() && text.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
