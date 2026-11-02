import { Button } from "../components/Button";
const steps = [
  [
    "Créez votre profil",
    "Dites-nous qui vous êtes, vos cuisines préférées et vos envies du moment. Ça prend deux minutes.",
  ],
  [
    "Explorez et trouvez votre table",
    "Parcourez les rencontres par cuisine, ambiance ou ville. Trouvez une table qui correspond à votre profil.",
  ],
  [
    "Réservez & partagez le repas",
    "Réservez votre place, mangez, échangez. Repartez avec plus qu’un souvenir.",
  ],
];

export function HowItWorks() {
  return (
    <section id="fonctionnement" className="pm-steps">
      <header className="pm-steps__title">
        <div className="pm-container">
          <p className="pm-eyebrow">Comment ça marche</p>
          <h2>3 étapes. Un repas inoubliable.</h2>
        </div>
      </header>
      <div className="pm-container">
        <ol className="pm-steps__grid">
          {steps.map(([title, description], index) => (
            <li className="pm-step" key={title}>
              <span>Étape</span>
              <strong>{index + 1}</strong>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
        <div className="pm-steps__action">
          <p>Prêt à passer à table ?</p>
          <Button to="#tables" variant="outline">
            Explorer les expériences{" "}
            <img src="/home/ArrowRightCircle1.svg" alt="" />
          </Button>
        </div>
      </div>
    </section>
  );
}
