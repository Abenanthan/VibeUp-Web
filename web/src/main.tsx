import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AudioProvider } from './context/AudioContext.tsx';
import { LibraryProvider } from './context/LibraryContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LibraryProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </LibraryProvider>
  </React.StrictMode>,
);
