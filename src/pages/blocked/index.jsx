/**
 * Blocked Page Entry Point
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Blocked } from "./Blocked";
import { PageWrapper } from "../../components/PageWrapper";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PageWrapper withProviders={false}>
      <Blocked />
    </PageWrapper>
  </React.StrictMode>
);