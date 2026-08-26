import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { BallApp } from './BallApp.js';
import { BattleSetup, BattleConfig } from './BattleSetup.js';

function Root() {
  const [config, setConfig] = useState<BattleConfig | null>(null);

  if (!config) {
    return <BattleSetup onStart={setConfig} />;
  }

  const back = () => setConfig(null);

  // Mode and pack are independent — either view renders whatever roster it is given.
  return config.mode === 'ffa'
    ? <App onBack={back} packId={config.packId} roster={config.roster} />
    : <BallApp onBack={back} packId={config.packId} roster={config.roster} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
