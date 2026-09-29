import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Community } from "./pages/Community";
import { Legal } from "./pages/Legal";
import { Team } from "./pages/Team";
import { AppShell } from "./app/components/AppShell";
import { Home } from "./app/pages/Home";
import { Explore } from "./app/pages/Explore";
import { ExperienceDetail } from "./app/pages/ExperienceDetail";
import { BecomeHost } from "./app/pages/BecomeHost";
import { About } from "./app/pages/About";
import { SignIn } from "./app/pages/SignIn";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/explorer" element={<Explore />} />
        <Route path="/experiences/:id" element={<ExperienceDetail />} />
        <Route path="/devenir-hote" element={<BecomeHost />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/connexion" element={<SignIn />} />
      </Route>
      <Route
        element={
          <Layout>
            <Community />
          </Layout>
        }
        path="/whatsapp"
      />
      <Route
        element={
          <Layout>
            <Team />
          </Layout>
        }
        path="/equipe"
      />
      <Route
        element={
          <Layout>
            <Legal />
          </Layout>
        }
        path="/mentions-legales"
      />
      <Route
        element={
          <Layout>
            <Team />
          </Layout>
        }
        path="/whatsapp/equipe.html"
      />
      <Route
        element={
          <Layout>
            <Legal />
          </Layout>
        }
        path="/whatsapp/mentions-legales.html"
      />
      <Route
        path="*"
        element={
          <Layout>
            <main className="not-found">
              <h1>Page introuvable</h1>
              <Link to="/">Retour à l’accueil</Link>
            </main>
          </Layout>
        }
      />
    </Routes>
  );
}
