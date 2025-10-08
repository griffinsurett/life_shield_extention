/**
 * Settings Entry Point
 * 
 * Initializes React app for the settings page.
 * Wraps app in ToastProvider for notifications.
 * 
 * This file is the entry point specified in index.html
 * and is bundled by Vite.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Settings } from "./Settings";
import { ToastProvider } from "../components/ToastContainer";
import "../App.css";

// Create React root and render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <Settings />
    </ToastProvider>
  </React.StrictMode>
);