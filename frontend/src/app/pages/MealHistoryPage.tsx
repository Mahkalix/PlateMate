import { useRef, useState } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import { AccountHeading } from "../components/AccountHeading";
import { Button } from "../components/Button";

export function MealHistoryPage({ host = false }: { host?: boolean }) {
  const notice = useRef<HTMLDialogElement>(null);
  const [action, setAction] = useState("");
  function explain(label: string) {
    setAction(label);
    notice.current?.showModal();
  }
  const past = host
    ? [
        ["Couscous du dimanche", "Dim. 19 oct. · 4 invités ·"],
        ["American Night", "Sam. 4 oct. · 6 invités ·"],
      ]
    : [
        ["Thiéboudienne chez Khady", "Sam. 25 oct. · Hôte : Khady D."],
        ["Pâtes fraîches chez Marco", "Ven. 10 oct. · Hôte : Marco R."],
      ];
  return (
    <div className="app pm-inner-page pm-account-page">
      <HomeHeader
        accountName={host ? "Amina" : "Mikaella"}
        accountRole={host ? "hote" : "invite"}
      />
      <main className="pm-account pm-history">
        <AccountHeading
          name={host ? "Amina" : "Mikaella"}
          host={host}
          active="meals"
          populated
        />
        <div className="pm-account__toolbar pm-history__toolbar">
          <nav className="pm-account__role" aria-label="Vue des repas">
            <a
              href="#/mes-repas/invite"
              aria-current={!host ? "page" : undefined}
            >
              Je suis invité
            </a>
            <a href="#/mes-repas/hote" aria-current={host ? "page" : undefined}>
              J’invite
            </a>
          </nav>
          {host && (
            <Button variant="yellow" onClick={() => explain("Créer un repas")}>
              Créer un repas <span aria-hidden="true">＋</span>
            </Button>
          )}
        </div>
        <div className="pm-meals__sections">
          <section className="pm-meals__section">
            <h2>{host ? "À venir" : "Prochain repas"}</h2>
            {host ? (
              <>
                <p className="pm-history__next">
                  <strong>Prochain repas :</strong>{" "}
                  <button
                    className="pm-history__link"
                    onClick={() => explain("Soirée mezzés libanais")}
                  >
                    Soirée mezzés libanais
                  </button>
                </p>
                <div className="pm-history__list">
                  {[
                    [
                      "SAM.",
                      "8",
                      "Soirée mezzés libanais",
                      "19 h 30",
                      "Invités : 3/6",
                    ],
                    [
                      "VEN.",
                      "21",
                      "Raclette entre montagnards",
                      "20 h",
                      "Complet",
                    ],
                  ].map(([day, date, name, time, status]) => (
                    <article className="pm-history__row" key={name}>
                      <div className="pm-history__meal">
                        <div className="pm-history__date">
                          <span>{day}</span>
                          <strong>{date}</strong>
                          <span>NOV.</span>
                        </div>
                        <div>
                          <h3>{name}</h3>
                          <p className="pm-history__time">
                            <img src="/account/7afe6.svg" alt="" />
                            {time}
                          </p>
                          <span
                            className={`pm-history__status ${status === "Complet" ? "is-full" : ""}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => explain(`Voir les invités : ${name}`)}
                      >
                        Voir les invités
                      </Button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="pm-history__upcoming">
                <article className="pm-history__booking">
                  <div>
                    <span className="pm-history__confirmed">
                      <img src="/account/447fc.svg" alt="" />
                      Confirmé
                    </span>
                    <h3>Brunch coréen</h3>
                    <p>Dimanche 2 novembre · 11 h30</p>
                  </div>
                  <div>
                    <div className="pm-history__host">
                      <span>JW</span>
                      <div>
                        <strong>Ji-Woo K.</strong>
                        <p>
                          <img src="/account/6c36e.svg" alt="" />
                          4,9 · 31 repas partagés · 4 intérêts en commun
                        </p>
                      </div>
                    </div>
                    <address>
                      <strong>Adresse</strong>
                      <p>
                        12 rue Félix Poulat, 38000 Grenoble
                        <br />
                        3e étage, interphone “Kim”
                      </p>
                    </address>
                    <div className="pm-history__buttons">
                      <Button onClick={() => explain("Écrire à Ji-Woo")}>
                        Écrire à Ji-Woo
                      </Button>
                      <button
                        className="pm-history__link"
                        onClick={() => explain("Voir le menu")}
                      >
                        Voir le menu
                      </button>
                    </div>
                  </div>
                </article>
                <aside className="pm-history__cancellation">
                  <h3>Annulation</h3>
                  <p>
                    Remboursement intégral jusqu'au vendredi 31 oct. à 11 h 30
                    (48 h avant).
                  </p>
                  <button
                    className="pm-history__link"
                    onClick={() => explain("Annuler")}
                  >
                    Annuler
                  </button>
                </aside>
              </div>
            )}
          </section>
          <section className="pm-meals__section">
            <h2>Passés</h2>
            <div className="pm-history__list">
              {past.map(([title, detail], index) => (
                <article key={title} className="pm-history__row">
                  <div>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                  </div>
                  {!host && index === 1 ? (
                    <div
                      className="pm-history__rating"
                      aria-label="4,5 étoiles sur 5"
                    >
                      {[0, 1, 2, 3, 4].map((star) => (
                        <img
                          key={star}
                          src={`/account/${star === 4 ? "b41de" : "3ebe7"}.svg`}
                          alt=""
                        />
                      ))}
                    </div>
                  ) : (
                    <button
                      className="pm-history__link"
                      onClick={() =>
                        explain(
                          `${host ? "Voir les avis" : "Noter l’hôte"} : ${title}`,
                        )
                      }
                    >
                      {host ? "Voir les avis" : "Noter l'hôte"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
          {!host && (
            <section className="pm-meals__section">
              <h2>Annulés et remboursés</h2>
              <div className="pm-history__list">
                <article className="pm-history__row">
                  <div className="pm-history__cancelled">
                    <h3>Tajine aux pruneaux</h3>
                    <p>· Mer. 15 oct. · Annulé par l'hôte</p>
                  </div>
                  <span className="pm-history__refund">Remboursé 22,00 €</span>
                </article>
              </div>
            </section>
          )}
        </div>
      </main>
      <HomeFooter />
      <dialog ref={notice} aria-labelledby="history-action">
        <h2 id="history-action">{action}</h2>
        <p>
          Cette action n’est pas raccordée à l’API dans cette preview. Les repas
          affichés sont des exemples de la maquette ; aucun message, paiement,
          avis ni annulation n’a été envoyé.
        </p>
        <Button onClick={() => notice.current?.close()}>Fermer</Button>
      </dialog>
    </div>
  );
}
