import { Button } from "../components/Button";
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

export function HowItWorks() {
  return (
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
  );
}
