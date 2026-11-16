import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { HostPage } from "./pages/HostPage";
import { RequireSession } from "./Session";
import {
  ConnectedProfile,
  ConnectedExplorer,
  ConnectedLogin,
  ConnectedMeals,
  Experience,
} from "./pages/ConnectedPages";

export function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => {
      setRoute(window.location.hash);
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    if (route.startsWith("#/")) {
      window.scrollTo(0, 0);
    } else {
      document.getElementById(route.slice(1) || "accueil")?.scrollIntoView();
    }
  }, [route]);
  if (route === "#/explorer")
    return (
      <RequireSession>
        <ConnectedExplorer />
      </RequireSession>
    );
  const experience = route.match(/^#\/experience\/([^/]+)\/([^/]+)$/);
  if (experience)
    return (
      <RequireSession>
        <Experience
          key={route}
          hostId={experience[1]}
          contextId={experience[2]}
        />
      </RequireSession>
    );
  if (/^#\/mes-repas\/(hote|invite)(\/vide)?$/.test(route))
    return (
      <RequireSession>
        <ConnectedMeals key={route} host={route.includes("/hote")} />
      </RequireSession>
    );
  if (/^#\/mon-profil\/(hote|invite)$/.test(route))
    return (
      <RequireSession>
        <ConnectedProfile key={route} host={route.endsWith("/hote")} />
      </RequireSession>
    );
  if (route === "#/a-propos") return <AboutPage />;
  if (route === "#/devenir-hote") return <HostPage />;
  if (route === "#/profil")
    return (
      <RequireSession>
        <ConnectedProfile />
      </RequireSession>
    );
  if (route === "#/candidature")
    return (
      <RequireSession>
        <ConnectedProfile host />
      </RequireSession>
    );
  if (route === "#/connexion") return <ConnectedLogin />;
  return <HomePage />;
}
