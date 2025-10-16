// app/settings/page.js
'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    mongodbUri: '',
    theme: 'dark'
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(prev => ({ ...prev, ...data })));
  }, []);

  const save = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    alert('Settings saved!');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', color: 'white', backgroundColor: '#313338', minHeight: '100vh' }}>
      <h1>⚙️ Settings</h1>
      <p>Configure your experience on caught.wiki.</p>

      <div style={{ marginTop: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your MongoDB URI (for servers)</label>
        <input
          value={settings.mongodbUri || ''}
          onChange={(e) => setSettings({ ...settings, mongodbUri: e.target.value })}
          placeholder="mongodb+srv://..."
          style={{ width: '100%', padding: '0.5rem', backgroundColor: '#2b2d31', color: 'white', border: '1px solid #4f545c' }}
        />
        <p style={{ fontSize: '0.9rem', color: '#b9bbbe', marginTop: '0.3rem' }}>
          Provide your own MongoDB to keep server messages permanently. DMs are always ephemeral.
        </p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Theme</label>
        <select
          value={settings.theme}
          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
          style={{ padding: '0.5rem', backgroundColor: '#2b2d31', color: 'white', border: '1px solid #4f545c' }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <button
        onClick={save}
        style={{ marginTop: '2rem', padding: '0.7rem 1.5rem', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Save Settings
      </button>
    </div>
  );
}
