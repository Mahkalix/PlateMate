import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Community } from "./pages/Community";
import { Legal } from "./pages/Legal";
import { Team } from "./pages/Team";

export function AppRouter() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Community />} />
        <Route path="/equipe" element={<Team />} />
        <Route path="/mentions-legales" element={<Legal />} />
        <Route path="/whatsapp/equipe.html" element={<Team />} />
        <Route path="/whatsapp/mentions-legales.html" element={<Legal />} />
        <Route
          path="*"
          element={
            <main className="not-found">
              <h1>Page introuvable</h1>
              <Link to="/">Retour à l’accueil</Link>
            </main>
          }
        />
      </Routes>
    </Layout>
  );
}
