import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/instrument.css';
import './styles/neon.css';
import './styles/retro.css';
import './styles/matrix.css';

createRoot(document.getElementById('root')!).render(<App />);
