// src/settings/index.jsx
/**
 * Settings Entry Point
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Settings } from "./Settings";
import { PageWrapper } from "../components/PageWrapper";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PageWrapper>
      <Settings />
    </PageWrapper>
  </React.StrictMode>
);