// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/');
    } else {
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto' }}>
      <h1>🔐 Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
        />
        <button
          type="submit"
          style={{ width: '100%', padding: '0.75rem', background: '#5865F2', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Login
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don’t have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
