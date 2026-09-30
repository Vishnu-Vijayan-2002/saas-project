/* ============================================================
   MAIN ENTRY POINT
   ============================================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Design system
import './styles/index.css';
import './styles/components.css';
import './styles/layouts.css';

// App
import App from './app/App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
