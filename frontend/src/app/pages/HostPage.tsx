import { useRef } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";

const benefits = [
  [
    "6a0ac.svg",
    "Revenu complémentaire",
    "Gagnez entre 400€ et 1 200€ par mois en accueillant 2 à 3 fois par semaine. Aucune charge fixe, vous contrôlez tout.",
  ],
  [
    "4fd13.svg",
    "Rencontres culturelles",
    "Échangez avec des voyageurs du monde entier, partagez votre culture et créez des liens authentiques.",
  ],
  [
    "c8311.svg",
    "Vous restez maître",
    "Choisissez vos dates, vos menus, le nombre d'invités. Vous acceptez ou refusez chaque réservation.",
  ],
];
const faq = [
  [
    "Comment devenir hôte sur PlateMate ?",
    "Cliquez sur Commencer, présentez-vous puis indiquez vos disponibilités et votre capacité d’accueil. Le parcours vous guide ensuite vers les informations nécessaires à votre candidature.",
  ],
  [
    "Est-ce que je choisis mon menu et mes dates ?",
    "Oui. Vous choisissez ce que vous souhaitez cuisiner, vos disponibilités et le nombre de personnes que vous pouvez accueillir. Votre proposition doit décrire clairement le repas et ses ingrédients.",
  ],
  [
    "Comment prendre en compte les allergies des invités ?",
    "Renseignez précisément les ingrédients et les risques de contamination croisée. En cas de doute sur votre capacité à respecter une contrainte alimentaire, ne confirmez pas la réservation et échangez avec l’invité.",
  ],
  [
    "Comment fonctionnent les paiements dans le MVP ?",
    "Le MVP utilise Stripe Connect en mode test : les paiements, rechargements et virements sont simulés. Aucun argent réel n’est encaissé ni versé pendant ces essais.",
  ],
  [
    "Que puis-je tester sur cette preview ?",
    "Vous pouvez découvrir les pages et parcourir les formulaires avec des données fictives. Cette preview front ne transmet pas de candidature, ne crée pas de compte réel et n’enregistre pas de réservation.",
  ],
];
function StartLink() {
  return (
    <a className="pm-button" href="#/candidature">
      <span>Commencer</span>
      <img src="/ready/eb2be.svg" alt="" />
    </a>
  );
}
export function HostPage() {
  const videoNotice = useRef<HTMLDialogElement>(null);
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main className="pm-host">
        <section className="pm-host__hero">
          <div>
            <h1>Transformez votre table en expérience</h1>
            <p>
              Vous adorez cuisiner ? Ouvrez votre table aux curieux du monde
              entier. Vous fixez vos dates, votre menu, votre prix. On s'occupe
              du reste.
            </p>
            <StartLink />
          </div>
          <img
            className="pm-host__photo"
            src="/ready/49a3b.png"
            alt="Un repas partagé autour d’une table"
          />
        </section>
        <section className="pm-host__benefits">
          <h2>Pourquoi devenir hôte ?</h2>
          <div>
            {benefits.map(([icon, title, text]) => (
              <article key={title}>
                <span>
                  <img src={`/ready/${icon}`} alt="" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="pm-host__video"
          aria-label="Présentation de PlateMate"
        >
          <button
            aria-label="Voir la vidéo Pourquoi devenir hôte"
            onClick={() => videoNotice.current?.showModal()}
          >
            <img
              className="pm-host__poster"
              src="/ready/447f8.png"
              alt="Pourquoi devenir hôte ? La réponse en vidéo !"
            />
            <img className="pm-host__play" src="/ready/1fed7.svg" alt="" />
          </button>
        </section>
        <section className="pm-host__faq">
          <h2>FAQ</h2>
          {faq.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <img src="/ready/9b219.svg" alt="" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
        <section className="pm-host__join">
          <h2>Prêt à partager votre table ?</h2>
          <p>
            Rejoignez plus de 1 200 hôtes qui partagent leur passion culinaire
          </p>
          <StartLink />
        </section>
      </main>
      <HomeFooter />
      <dialog
        className="pm-dialog"
        ref={videoNotice}
        aria-labelledby="video-title"
      >
        <h2 id="video-title">Vidéo à venir</h2>
        <p>La vidéo de présentation n’est pas encore disponible.</p>
        <form method="dialog">
          <button autoFocus className="pm-button">
            Fermer
          </button>
        </form>
      </dialog>
    </div>
  );
}
