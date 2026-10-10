import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * Application entry point.
 * BrowserRouter is placed here (outside App) so that any component rendered
 * inside App can use React Router hooks.  AuthProvider lives inside App so
 * it has access to routing context if needed.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
