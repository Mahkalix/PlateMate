import { TableCard } from "../components/TableCard";
import { HomeFooter } from "../sections/HomeFooter";
import { HomeHeader } from "../sections/HomeHeader";

const experiences = [
  ["Amina", "Nuit libanaise", "BackgroundImage", "Image25"],
  ["Troy", "USA Burgers", "BackgroundImage3", "Image27"],
  ["Jean-Marc", "La French Touch", "BackgroundImage4", "Image28"],
  ["Usain", "La French Touch", "BackgroundImage2", "Image26"],
] as const;

export function ExplorerPage() {
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main className="pm-explorer">
        <header className="pm-explorer__heading">
          <h1>Explorer les expériences</h1>
          <p>Voir les expériences disponibles près de chez vous</p>
        </header>
        <a className="pm-explorer__banner" href="#/connexion">
          Connectez-vous pour en voir plus !
        </a>
        <div className="pm-explorer__content">
          <div className="pm-explorer__cards">
            {experiences.map(([host, title, photo, portrait]) => (
              <TableCard
                key={host}
                host={host}
                title={title}
                photo={photo}
                portrait={portrait}
                href="#/connexion"
              />
            ))}
          </div>
          <a
            className="pm-explorer__locked"
            href="#/connexion"
            aria-label="Se connecter pour voir plus d’expériences"
          >
            <span className="pm-explorer__cards" aria-hidden="true">
              {experiences.map(([host, , photo]) => (
                <img key={host} src={`/home/${photo}.webp`} alt="" />
              ))}
            </span>
            <span className="pm-explorer__lock" aria-hidden="true" />
          </a>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
