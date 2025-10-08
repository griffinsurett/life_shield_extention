/**
 * Settings Entry Point
 * 
 * Initializes React app for the settings page.
 * Now wraps app in AppProvider for global state.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Settings } from "./Settings";
import { AppProvider } from "../contexts/AppContext";
import { ToastProvider } from "../components/ToastContainer";
import "../App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <ToastProvider>
        <Settings />
      </ToastProvider>
    </AppProvider>
  </React.StrictMode>
);