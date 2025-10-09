/**
 * Blocked Page Entry Point
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Blocked } from "./Blocked";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "../index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary showDetails={true}>
      <Blocked />
    </ErrorBoundary>
  </React.StrictMode>
);
