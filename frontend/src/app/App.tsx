import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { HostPage } from "./pages/HostPage";
import { ProfileWizard } from "./pages/ProfileWizard";
import { LoginPage } from "./pages/LoginPage";

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
  if (route === "#/a-propos") return <AboutPage />;
  if (route === "#/devenir-hote") return <HostPage />;
  if (route === "#/profil") return <ProfileWizard key="profile" />;
  if (route === "#/candidature") return <ProfileWizard key="host" host />;
  if (route === "#/connexion") return <LoginPage />;
  return <HomePage />;
}
