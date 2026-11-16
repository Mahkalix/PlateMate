import { useEffect, useState } from "react";
import { api, publicApi, errorMessage } from "../api";
import { useSession } from "../Session";

type Card = {
  hostId: string;
  contextId: string;
  contextTitle: string;
  firstName: string;
  city: string;
  kind: string;
  ambience: string;
  score: number;
};
type Page = { items: Card[]; total: number; nextOffset: number | null };

const discoveryTables = [
  {
    title: "Une soirée libanaise",
    host: "Amina",
    kind: "Cuisine libanaise",
    ambience: "Conviviale",
    photo: "BackgroundImage",
  },
  {
    title: "Le bistrot à la maison",
    host: "Jean-Marc",
    kind: "Cuisine française",
    ambience: "Calme et détendue",
    photo: "BackgroundImage4",
  },
  {
    title: "Burgers et jeux de société",
    host: "Troy",
    kind: "Cuisine américaine",
    ambience: "Animée",
    photo: "BackgroundImage3",
  },
  {
    title: "Un dimanche à partager",
    host: "Usain",
    kind: "Cuisine familiale",
    ambience: "Grande tablée",
    photo: "BackgroundImage2",
  },
];

function DiscoveryCards({ featured }: { featured: boolean }) {
  return (
    <div className="pm-suggestions" id={featured ? "cartes" : undefined}>
      <p>
        Un aperçu des moments à partager autour d’une table. Connectez-vous pour
        découvrir les repas disponibles et vos suggestions personnalisées.
      </p>
      <p>Exemples de tables, présentés à titre d’inspiration.</p>
      <div className="pm-suggestions__grid">
        {discoveryTables.map((table) => (
          <article className="pm-suggestion" key={table.title}>
            <img
              src={`/home/${table.photo}.webp`}
              alt=""
              loading="lazy"
              width="400"
              height="240"
              style={{ width: "100%", height: "20rem", objectFit: "cover" }}
            />
            <div className="pm-suggestion__body">
              <p className="pm-eyebrow">Table découverte · Exemple</p>
              <h3>{table.title}</h3>
              <p>Chez {table.host}</p>
              <p>
                {table.kind} · {table.ambience}
              </p>
              <a className="pm-button pm-button--red" href="#/connexion">
                Découvrir PlateMate
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ExperienceCards({ featured = false }: { featured?: boolean }) {
  const { user, profile, loading } = useSession();
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data?: Page;
    error?: string;
  }>({ key: "" });
  const personalized = !!user && !!profile;
  const key = JSON.stringify([user?.id, profile, offset, attempt, featured]);
  useEffect(() => {
    if (loading) return;
    let active = true;
    const path = `${personalized ? "" : "/public"}/explorer?offset=${offset}&limit=${featured ? 4 : 20}`;
    const request = personalized ? api<Page>(path) : publicApi<Page>(path);
    request
      .then((data) => {
        if (active) setState({ key, data });
      })
      .catch((error) => {
        if (active) setState({ key, error: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [key, loading, personalized, offset, featured]);
  useEffect(() => {
    setOffset(0);
  }, [user?.id, profile]);
  const current = state.key === key ? state : null;
  if (!user && !current?.data?.items.length)
    return <DiscoveryCards featured={featured} />;
  return (
    <div className="pm-suggestions" id={featured ? "cartes" : undefined}>
      <p>
        {personalized
          ? "Des suggestions classées selon vos langues, vos centres d’intérêt et vos préférences alimentaires."
          : "Découvrez les tables. Connectez-vous pour obtenir des suggestions adaptées à votre profil et réserver."}
      </p>
      {!personalized && <a href="#/connexion">Se connecter</a>}
      {loading || !current ? (
        <p role="status">Chargement des tables…</p>
      ) : current.error ? (
        <div role="alert">
          <p>{current.error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {!current.data?.items.length && (
            <p>
              Aucune table {personalized ? "compatible avec votre profil " : ""}
              pour le moment. Revenez bientôt découvrir les prochains repas.
            </p>
          )}
          <div className="pm-suggestions__grid">
            {current.data?.items.map((card) => (
              <article className="pm-suggestion" key={card.contextId}>
                <div className="pm-suggestion__cover" aria-hidden="true">
                  <span>{card.firstName.slice(0, 1)}</span>
                  <span>À table !</span>
                </div>
                <div className="pm-suggestion__body">
                  <p className="pm-eyebrow">{card.city}</p>
                  <h3>{card.contextTitle}</h3>
                  <p>Chez {card.firstName}</p>
                  <p>
                    {card.kind} · {card.ambience}
                  </p>
                  {personalized && card.score > 0 && (
                    <p className="pm-suggestion__match">
                      Des affinités avec votre profil
                    </p>
                  )}
                  <a
                    className="pm-button pm-button--red"
                    href={
                      user
                        ? `#/experience/${card.hostId}/${card.contextId}`
                        : "#/connexion"
                    }
                  >
                    {user ? "Découvrir ce repas" : "Se connecter pour réserver"}
                  </a>
                </div>
              </article>
            ))}
          </div>
          {!featured && (
            <nav aria-label="Pages des tables">
              {offset > 0 && (
                <button onClick={() => setOffset(Math.max(0, offset - 20))}>
                  Précédent
                </button>
              )}
              {current.data?.nextOffset != null && (
                <button onClick={() => setOffset(current.data!.nextOffset!)}>
                  Suivant
                </button>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
