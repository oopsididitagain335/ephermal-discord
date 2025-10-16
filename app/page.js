// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [servers, setServers] = useState([]);
  const [dms, setDms] = useState([]);
  const router = useRouter();

  // Mock data — in real app, fetch from /api/user/servers
  useEffect(() => {
    setServers([{ id: 'server1', name: 'General' }]);
    setDms([{ id: 'dm_user123', name: 'Alice' }]);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', backgroundColor: '#36393f', color: 'white', padding: '1rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>caught.wiki</h2>
        
        <h3 style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#b9bbbe' }}>SERVERS</h3>
        {servers.map((s) => (
          <div
            key={s.id}
            onClick={() => router.push(`/server/${s.id}`)}
            style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '4px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#4f545c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {s.name}
          </div>
        ))}

        <h3 style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#b9bbbe' }}>DIRECT MESSAGES</h3>
        {dms.map((d) => (
          <div
            key={d.id}
            onClick={() => router.push(`/dm/${d.id}`)}
            style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '4px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#4f545c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {d.name}
          </div>
        ))}

        <button
          onClick={() => router.push('/settings')}
          style={{ marginTop: '2rem', width: '100%', padding: '0.5rem', background: 'transparent', border: '1px solid #b9bbbe', color: '#b9bbbe', borderRadius: '4px' }}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', backgroundColor: '#313338', color: 'white' }}>
        <h1>Welcome to caught.wiki</h1>
        <p>Select a server or DM to start chatting.</p>
        <p style={{ fontSize: '0.9rem', color: '#b9bbbe', marginTop: '2rem' }}>
          💬 All DMs are ephemeral. Servers can be permanent if you provide your own MongoDB.
        </p>
      </div>
    </div>
  );
}
