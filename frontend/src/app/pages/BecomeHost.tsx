import { useState } from "react";
import { Button } from "../components/Button";
const benefits = [
  [
    "€",
    "Revenu complémentaire",
    "Vous définissez votre menu, vos dates et votre tarif. Les revenus dépendent des repas organisés.",
  ],
  [
    "♧",
    "Rencontres culturelles",
    "Échangez avec des voyageurs du monde entier, partagez votre culture et créez des liens authentiques.",
  ],
  [
    "☼",
    "Vous restez maître",
    "Choisissez vos dates, vos menus, le nombre d’invités. Vous acceptez ou refusez chaque réservation.",
  ],
];
const questions = [
  "Quelles sont les obligations légales ?",
  "Comment sont calculés les revenus ?",
  "Puis-je choisir mes dates ?",
  "Comment fonctionne le paiement ?",
  "Que faire en cas d’annulation ?",
];
export function BecomeHost() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <main className="pm-become">
      <section className="pm-become__hero">
        <div>
          <h1>Transformez votre table en expérience</h1>
          <p>
            Vous adorez cuisiner ? Ouvrez votre table aux curieux du monde
            entier. Vous fixez vos dates, votre menu, votre prix. On s’occupe du
            reste.
          </p>
          <Button to="/connexion" variant="yellow">
            Commencer →
          </Button>
        </div>
        <div className="pm-become__photo" aria-hidden="true" />
      </section>
      <section className="pm-container pm-benefits">
        <h2>Pourquoi devenir hôte ?</h2>
        <div>
          {benefits.map(([icon, title, body]) => (
            <article key={title}>
              <span aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="pm-container pm-faq">
        <h2>Questions fréquentes</h2>
        {questions.map((question, index) => (
          <div key={question}>
            <button
              type="button"
              aria-expanded={open === index}
              onClick={() => setOpen(open === index ? null : index)}
            >
              {question}
              <span aria-hidden="true">{open === index ? "−" : "+"}</span>
            </button>
            {open === index && (
              <p>
                Les conditions dépendent de votre situation. Pour les détails du
                service PlateMate, contactez-nous à weareplatemate@gmail.com.
              </p>
            )}
          </div>
        ))}
      </section>
      <section className="pm-become__closing">
        <h2>Prêt à partager votre table ?</h2>
        <p>Rejoignez la communauté des passionnés de cuisine</p>
        <Button to="/connexion">Commencer →</Button>
      </section>
    </main>
  );
}
