import React from 'react';
import ReactDOM from 'react-dom/client';
import { Settings } from './Settings';
import { ToastProvider } from '../shared/components/ToastContainer';
import '../App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <Settings />
    </ToastProvider>
  </React.StrictMode>
);