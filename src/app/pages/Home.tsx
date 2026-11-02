import { Button } from "../components/Button";
import { Featured } from "../components/Featured";
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
            <Button to="#tables" variant="yellow">
              Explorer les expériences{" "}
              <img src="/home/ArrowRightCircle.svg" alt="" />
            </Button>
            <Button to="#hotes" variant="outline">
              Devenez hôte
            </Button>
          </div>
        </div>
      </section>
      <div className="pm-trust">
        <span>
          <img src="/home/VerifiedIcon.svg" alt="" /> Hôtes vérifiés
          <small>Profils contrôlés</small>
        </span>
        <span>
          <img src="/home/SecurityIcon.svg" alt="" /> Paiement sécurisé
          <small>Stripe &amp; 3D Secure</small>
        </span>
        <span>
          <img src="/home/ReviewsIcon.svg" alt="" /> Avis authentiques
          <small>Vérifiés post-repas</small>
        </span>
      </div>
      <section id="tables" className="pm-featured pm-container">
        <div className="pm-section-heading">
          <div>
            <p className="pm-eyebrow">Expériences à la une</p>
            <h2>Des tables qui ont du caractère.</h2>
          </div>
          <a href="#cartes">
            Découvrir <img src="/home/ArrowRightCircle1.svg" alt="" />
          </a>
        </div>
        <Featured />
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
            <Button to="#tables" variant="outline">
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
          <div className="pm-gallery__photo">
            <img
              src="/home/1371.webp"
              alt="Plats partagés autour d’une table"
            />
            <img src="/home/Foto1.webp" alt="Amis réunis autour d’un repas" />
            <img src="/home/1381.webp" alt="Repas partagé autour d’une table" />
            <img
              src="/home/TiramisuNouvelleIdee1.webp"
              alt="Plat dressé à table"
            />
            <img
              src="/home/FotoFoto1.webp"
              alt="Convives partageant des plats"
            />
            <img src="/home/1401.webp" alt="Grande tablée conviviale" />
          </div>
          <a
            href="https://www.instagram.com/weareplatemate/"
            className="pm-gallery__share"
          >
            <strong>
              <img src="/home/InstagramIcon.svg" alt="" /> Partagez vos moments
            </strong>
            <p>
              Partagez vos plus beaux moments avec nous sur Instagram en nous
              identifiant @weareplatemate.
            </p>
          </a>
        </div>
      </section>
      <section id="hotes" className="pm-host-cta">
        <div>
          <p className="pm-eyebrow">Devenez hôte PlateMate</p>
          <h2>
            Cuisinez.
            <br />
            Partagez.
            <br />
            Gagnez.
          </h2>
          <Button to="/whatsapp" variant="yellow">
            En savoir plus
          </Button>
        </div>
        <div className="pm-host-cta__photo" aria-hidden="true">
          <img src="/home/ColourWhite.webp" alt="" />
          <span>Hôte</span>
        </div>
      </section>
    </main>
  );
}
