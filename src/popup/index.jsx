import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from './Popup';
import { ToastProvider } from '../shared/components/ToastContainer';
import '../App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <Popup />
    </ToastProvider>
  </React.StrictMode>
);