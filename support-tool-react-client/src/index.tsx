import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

// Wait for env.json fetch (started in index.html <head>) to complete,
// so window._env_ is fully populated before any component reads it.
(window as any)._envConfigPromise
  ? (window as any)._envConfigPromise.finally(renderApp)
  : renderApp();

function renderApp() {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  reportWebVitals();
}
