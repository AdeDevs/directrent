import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// Suppress Firestore clock skew warnings from console
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const isFirestoreClockSkewError = args.some(
    arg => typeof arg === 'string' && arg.includes('Detected an update time that is in the future')
  );
  if (isFirestoreClockSkewError) {
    return;
  }
  originalConsoleError(...args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)

