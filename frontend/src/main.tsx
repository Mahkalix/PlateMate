import "@fontsource-variable/dm-sans/standard.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { HomePage } from "./app/pages/HomePage";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>,
);
