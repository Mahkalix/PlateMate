import { useRef } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import { Button } from "../components/Button";

const emptyMeals = [
  {
    heading: "Prochain repas",
    title: "Aucun repas à venir",
    description:
      "Vous n'avez pas encore de table réservée. Trouvez un hôte qui partage vos centres d'intérêt.",
    icon: "58e08",
    action: true,
  },
  {
    heading: "Passés",
    title: "Aucun repas passé",
    description: "Vos repas passés et les hôtes rencontrés apparaîtront ici.",
    icon: "e0d5a",
  },
  {
    heading: "Annulés et remboursés",
    title: "Aucun repas annulé",
    description: "Les repas annulés et leurs remboursements apparaîtront ici.",
    icon: "76507",
  },
];

export function MealsPage({ host = false }: { host?: boolean }) {
  const notice = useRef<HTMLDialogElement>(null);
  return (
    <div className="app pm-inner-page pm-account-page">
      <HomeHeader accountName="Mikaella" />
      <main className="pm-account">
        <div className="pm-account__heading">
          <h1>Bonjour Mikaella</h1>
          <nav className="pm-account__tabs" aria-label="Mon compte">
            <a href="#/mon-profil/invite">Profil</a>
            <a
              href={host ? "#/mes-repas/hote/vide" : "#/mes-repas/invite/vide"}
              aria-current="page"
            >
              Mes repas
            </a>
            <button onClick={() => notice.current?.showModal()}>
              Paiements
            </button>
          </nav>
        </div>
        <div className="pm-account__toolbar">
          <nav className="pm-account__role" aria-label="Vue des repas">
            <a
              href="#/mes-repas/invite/vide"
              aria-current={!host ? "page" : undefined}
            >
              Je suis invité
            </a>
            <a
              href="#/mes-repas/hote/vide"
              aria-current={host ? "page" : undefined}
            >
              J’invite
            </a>
          </nav>
        </div>
        <div className="pm-meals__sections">
          {host ? (
            <section className="pm-meals__empty">
              <span className="pm-meals__icon">
                <img src="/account/49d80.svg" alt="" />
              </span>
              <div>
                <h2>Devenez hôte</h2>
                <p>
                  Vous êtes invité, mais vous n'avez pas encore de compte hôte.
                  Créez-le pour proposer vos repas et inviter vos convives.
                </p>
              </div>
              <Button to="#/devenir-hote" variant="yellow">
                Devenir hôte
                <img src="/account/eb2be.svg" alt="" />
              </Button>
            </section>
          ) : (
            emptyMeals.map((meal) => (
              <section className="pm-meals__section" key={meal.title}>
                <h2>{meal.heading}</h2>
                <div className="pm-meals__empty">
                  <span className="pm-meals__icon">
                    <img src={`/account/${meal.icon}.svg`} alt="" />
                  </span>
                  <div>
                    <h3>{meal.title}</h3>
                    <p>{meal.description}</p>
                  </div>
                  {meal.action && (
                    <Button to="#/explorer" variant="yellow">
                      Explorer les experiences
                      <img src="/account/eb2be.svg" alt="" />
                    </Button>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <HomeFooter />
      <dialog ref={notice}>
        <p>
          Cette rubrique n’est pas encore disponible dans cette démonstration.
        </p>
        <Button onClick={() => notice.current?.close()}>Fermer</Button>
      </dialog>
    </div>
  );
}
