import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { HostPage } from "./pages/HostPage";
import { ProfileWizard } from "./pages/ProfileWizard";
import { ExplorerPage } from "./pages/ExplorerPage";
import { LoginPage } from "./pages/LoginPage";
import { MealsPage } from "./pages/MealsPage";
import { AccountProfilePage } from "./pages/AccountProfilePage";
import { MealHistoryPage } from "./pages/MealHistoryPage";

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
  if (route === "#/explorer") return <ExplorerPage />;
  if (route === "#/mes-repas/hote") return <MealHistoryPage host />;
  if (route === "#/mes-repas/invite") return <MealHistoryPage />;
  if (route === "#/mon-profil/hote")
    return <AccountProfilePage key="host-account" host />;
  if (route === "#/mon-profil/invite")
    return <AccountProfilePage key="guest-account" />;
  if (route === "#/mes-repas/invite/vide") return <MealsPage />;
  if (route === "#/mes-repas/hote/vide") return <MealsPage host />;
  if (route === "#/a-propos") return <AboutPage />;
  if (route === "#/devenir-hote") return <HostPage />;
  if (route === "#/profil") return <ProfileWizard key="profile" />;
  if (route === "#/candidature") return <ProfileWizard key="host" host />;
  if (route === "#/connexion") return <LoginPage />;
  return <HomePage />;
}
