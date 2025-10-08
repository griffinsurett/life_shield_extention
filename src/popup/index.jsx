/**
 * Popup Entry Point
 * 
 * Initializes React app for the popup.
 * Wraps app in ToastProvider for notifications.
 * 
 * This file is the entry point specified in index.html
 * and is bundled by Vite.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import { ToastProvider } from "../components/ToastContainer";
import "../App.css";

// Create React root and render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <Popup />
    </ToastProvider>
  </React.StrictMode>
);