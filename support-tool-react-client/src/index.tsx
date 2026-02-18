import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

// Wait for the env-config.json fetch (started in index.html <head>) to complete,
// then render the app so that window._env_ is fully populated before any component reads it.
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
  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}
