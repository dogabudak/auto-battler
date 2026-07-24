import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { BallApp } from './BallApp.js';

function Root() {
  const [mode, setMode] = useState<'menu' | 'classic' | 'ball'>('menu');

  if (mode === 'classic') {
    return <App onBack={() => setMode('menu')} />;
  }

  if (mode === 'ball') {
    return <BallApp onBack={() => setMode('menu')} />;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 30,
    }}>
      <h1 style={{ fontSize: 40, letterSpacing: 3 }}>AUTO BATTLER</h1>
      <p style={{ color: '#888', fontSize: 16 }}>Choose a game mode</p>

      <div style={{ display: 'flex', gap: 20 }}>
        <button
          onClick={() => setMode('classic')}
          style={{
            padding: '24px 40px', fontSize: 18, fontWeight: 'bold',
            background: 'linear-gradient(135deg, #334, #223)',
            border: '2px solid #4ade80', borderRadius: 12,
            cursor: 'pointer', color: '#4ade80', letterSpacing: 1,
            width: 220, textAlign: 'center',
          }}
        >
          FFA BATTLE
          <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontWeight: 'normal' }}>
            Classic free-for-all
          </div>
        </button>

        <button
          onClick={() => setMode('ball')}
          style={{
            padding: '24px 40px', fontSize: 18, fontWeight: 'bold',
            background: 'linear-gradient(135deg, #2d5a27, #1a3a18)',
            border: '2px solid #fbbf24', borderRadius: 12,
            cursor: 'pointer', color: '#fbbf24', letterSpacing: 1,
            width: 220, textAlign: 'center',
          }}
        >
          PL BRAWL
          <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontWeight: 'normal' }}>
            Hit once, move on
          </div>
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
