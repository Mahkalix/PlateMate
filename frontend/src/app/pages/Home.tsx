import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { HostCard } from "../components/HostCard";
import { getExperiences, type Experience } from "../lib/api";

const steps = [
  [
    "Créez votre profil",
    "Dites-nous qui vous êtes, vos cuisines préférées et vos envies du moment. Ça prend deux minutes.",
  ],
  [
    "Explorez & trouvez votre hôte",
    "Parcourez les expériences par cuisine, ambiance ou ville.",
  ],
  [
    "Réservez & partagez le repas",
    "Réservez votre place, mangez, échangez. Repartez avec plus qu’un souvenir.",
  ],
];
export function Home() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    getExperiences({ limit: 5 }, controller.signal)
      .then((result) => setExperiences(result.experiences))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <main>
      <section className="pm-hero">
        <div className="pm-hero__content">
          <p className="pm-eyebrow">Expériences culinaires uniques</p>
          <h1>
            Nouvelles saveurs,
            <br />
            nouvelles rencontres.
          </h1>
          <p>
            Des hôtes passionnés vous ouvrent leur cuisine. Réservez votre
            place, découvrez de nouvelles saveurs et repartez avec une belle
            histoire.
          </p>
          <div className="pm-hero__actions">
            <Button to="/explorer" variant="yellow">
              Explorer les expériences
            </Button>
            <Button to="/devenir-hote" variant="outline">
              Proposer un repas
            </Button>
          </div>
        </div>
      </section>
      <div className="pm-trust">
        <span>
          ✓ &nbsp; Hôtes passionnés<small>Des tables à découvrir</small>
        </span>
        <span>
          ▣ &nbsp; Réservation encadrée
          <small>Paiement après accord de l’hôte</small>
        </span>
        <span>
          ★ &nbsp; Avis post-repas<small>Partagés par les invités</small>
        </span>
      </div>
      <section className="pm-featured pm-container">
        <div className="pm-section-heading">
          <div>
            <p className="pm-eyebrow">Expériences à la une</p>
            <h2>Des tables qui ont du caractère.</h2>
          </div>
          <Link to="/explorer">Découvrir →</Link>
        </div>
        {experiences.length ? (
          <div className="pm-featured__cards">
            {experiences.map((item) => (
              <HostCard experience={item} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="pm-empty">
            Les premières tables arrivent bientôt.{" "}
            <Link to="/whatsapp/">Rejoins la communauté</Link> pour suivre le
            lancement.
          </p>
        )}
      </section>
      <div className="pm-ticker" aria-hidden="true">
        FRANÇAISE <span>—</span> ITALIENNE <span>—</span> MAROCAINE{" "}
        <span>—</span> JAPONAISE <span>—</span> INDIENNE <span>—</span>{" "}
        MEXICAINE
      </div>
      <section className="pm-steps">
        <div className="pm-container">
          <p className="pm-eyebrow">Comment ça marche</p>
          <h2>3 étapes. Un repas inoubliable.</h2>
          <div className="pm-steps__grid">
            {steps.map(([title, description], index) => (
              <div className="pm-step" key={title}>
                <span>Étape</span>
                <strong>{index + 1}</strong>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className="pm-steps__action">
            <p>Prêt à passer à table ?</p>
            <Button to="/explorer" variant="outline">
              Explorer les expériences
            </Button>
          </div>
        </div>
      </section>
      <div className="pm-ticker pm-ticker--teal" aria-hidden="true">
        CULTUREL <span>—</span> GOURMAND <span>—</span> CONVIVIAL <span>—</span>{" "}
        AUTHENTIQUE <span>—</span> GÉNÉREUX <span>—</span> CURIEUX
      </div>
      <section className="pm-gallery">
        <div className="pm-gallery__title">
          <div className="pm-container">
            <p className="pm-eyebrow">La communauté en images</p>
            <h2>Des repas, des cultures, des rencontres.</h2>
          </div>
        </div>
        <div className="pm-container">
          <div
            className="pm-gallery__photo"
            role="img"
            aria-label="Table conviviale PlateMate"
          />
          <div className="pm-gallery__share">
            <strong>◎ &nbsp; Partagez vos moments</strong>
            <p>
              Partagez vos plus beaux moments avec nous sur Instagram en nous
              identifiant @weareplatemate.
            </p>
          </div>
        </div>
      </section>
      <section className="pm-host-cta">
        <div>
          <p className="pm-eyebrow">Devenez hôte PlateMate</p>
          <h2>
            Cuisinez.
            <br />
            Partagez.
            <br />
            Gagnez.
          </h2>
          <Button to="/devenir-hote" variant="yellow">
            Découvrir →
          </Button>
        </div>
        <div className="pm-host-cta__photo" aria-hidden="true" />
      </section>
    </main>
  );
}
