import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Maintenance } from "./pages/Maintenance";
import { Community } from "./pages/Community";
import { Team } from "./pages/Team";
import { Legal } from "./pages/Legal";
import "../scss/community.scss";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Maintenance />} />
          <Route path="/whatsapp/*" element={<Community />} />
          <Route path="/equipe" element={<Team />} />
          <Route path="/mentions-legales" element={<Legal />} />
          <Route path="/whatsapp/equipe.html" element={<Team />} />
          <Route path="/whatsapp/mentions-legales.html" element={<Legal />} />
          <Route
            path="*"
            element={
              <main className="not-found">
                <h1>Page introuvable</h1>
                <a href="/">Retour à l’accueil</a>
              </main>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>,
);
