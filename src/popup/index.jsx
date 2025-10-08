/**
 * Popup Entry Point
 * 
 * Initializes React app for the popup.
 * Now wraps app in AppProvider for global state.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import { AppProvider } from "../contexts/AppContext";
import { ToastProvider } from "../components/ToastContainer";
import "../App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <ToastProvider>
        <Popup />
      </ToastProvider>
    </AppProvider>
  </React.StrictMode>
);