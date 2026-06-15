// main.jsx — the launch pad. Mounts the app onto #root and wraps it in the
// three things everything else assumes exist: the router, the auth context,
// and StrictMode (which double-invokes effects in dev — that second render
// you keep seeing is a feature, not a haunting).

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
