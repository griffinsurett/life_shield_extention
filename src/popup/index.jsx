/**
 * Popup Entry Point
 * 
 * Now wrapped with error boundary for better error handling.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import { AppProvider } from "../contexts/AppContext";
import { ToastProvider } from "../components/ToastContainer";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "../App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary showDetails={true}>
      <AppProvider>
        <ToastProvider>
          <Popup />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);