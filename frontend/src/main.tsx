import "@fontsource-variable/dm-sans/standard.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { SessionProvider } from "./app/Session";
import "../scss/app.scss";
import "../scss/8_sections/_live.scss";
import "../scss/8_sections/_profile-flow.scss";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>,
);

