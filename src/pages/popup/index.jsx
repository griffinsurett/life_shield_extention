/**
 * Popup Entry Point
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Popup } from "./Popup";
import { PageWrapper } from "../../components/PageWrapper";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PageWrapper>
      <Popup />
    </PageWrapper>
  </React.StrictMode>
);