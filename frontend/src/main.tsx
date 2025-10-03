import React from 'react';

import { createRoot } from 'react-dom/client';

import App from './App';
import './favicon';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
