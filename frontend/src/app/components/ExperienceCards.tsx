import { useEffect, useState } from "react";
import { api, publicApi, errorMessage } from "../api";
import { useSession } from "../Session";
import { TableCard } from "./TableCard";
import { Featured } from "./Featured";

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
    title: "Nuit libanaise",
    host: "Amina",
    kind: "Cuisine libanaise",
    ambience: "Conviviale",
    photo: "BackgroundImage",
    portrait: "Image25",
  },
  {
    title: "La French Touch",
    host: "Jean-Marc",
    kind: "Cuisine française",
    ambience: "Calme et détendue",
    photo: "BackgroundImage4",
    portrait: "Image28",
  },
  {
    title: "American Night",
    host: "Troy",
    kind: "Cuisine américaine",
    ambience: "Animée",
    photo: "BackgroundImage3",
    portrait: "Image27",
  },
  {
    title: "La French Touch",
    host: "Usain",
    kind: "Cuisine familiale",
    ambience: "Grande tablée",
    photo: "BackgroundImage2",
    portrait: "Image26",
  },
];

function DiscoveryCards({
  featured,
  signedIn,
}: {
  featured: boolean;
  signedIn: boolean;
}) {
  if (featured) return <Featured />;
  return (
    <div className="pm-suggestions" id={featured ? "cartes" : undefined}>
      <div className="pm-discovery-cards">
        {(signedIn ? [0, 2, 1, 3, 0, 2, 1, 3] : [0, 2, 1, 3]).map(
          (index, position) => {
            const table = discoveryTables[index];
            return (
              <TableCard
                key={position}
                host={table.host}
                title={table.title}
                photo={table.photo}
                portrait={table.portrait}
                variant={featured ? "filled" : "outline"}
                href={signedIn ? "#/devenir-hote" : "/auth/login"}
              />
            );
          },
        )}
      </div>
      {!signedIn && (
        <a
          className="pm-explorer__locked"
          href="/auth/login"
          aria-label="Se connecter pour découvrir plus d’expériences"
        >
          <span className="pm-explorer__cards" aria-hidden="true">
            {[0, 2, 1, 3].map((index) => (
              <img
                key={index}
                src={`/home/${discoveryTables[index].photo}.webp`}
                alt=""
              />
            ))}
          </span>
          <span className="pm-explorer__lock" aria-hidden="true" />
        </a>
      )}
      <p className="pm-explorer__notice">
        Exemples de tables, présentés à titre d’inspiration. Aucun repas
        disponible pour le moment.
      </p>
    </div>
  );
}

export function ExperienceCards({
  featured = false,
  filters = "",
}: {
  featured?: boolean;
  filters?: string;
}) {
  const { user, profile, loading } = useSession();
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data?: Page;
    error?: string;
  }>({ key: "" });
  const personalized = !!user && !!profile;
  const key = JSON.stringify([
    user?.id,
    profile,
    offset,
    attempt,
    featured,
    filters,
  ]);
  useEffect(() => {
    if (loading) return;
    let active = true;
    const path = `${personalized ? "" : "/public"}/explorer?offset=${offset}&limit=${featured ? 4 : 8}&${filters}`;
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
  }, [key, loading, personalized, offset, featured, filters]);
  useEffect(() => {
    setOffset(0);
  }, [user?.id, profile, filters]);
  const current = state.key === key ? state : null;
  if (filters && current?.data?.items.length === 0)
    return (
      <p role="status">
        Aucun repas ne correspond à ces filtres. Essayez une autre recherche.
      </p>
    );
  if (
    (!user && !current?.data?.items.length) ||
    current?.data?.items.length === 0
  )
    return <DiscoveryCards featured={featured} signedIn={!!user} />;
  const hasSuggestions =
    personalized && current?.data?.items.some((card) => card.score > 0);
  return (
    <div className="pm-suggestions" id={featured ? "cartes" : undefined}>
      <p>
        {hasSuggestions
          ? "Des suggestions classées selon vos langues, vos centres d’intérêt et vos préférences alimentaires."
          : user
            ? "Découvrez les tables et les prochains repas."
            : "Découvrez les tables. Connectez-vous pour réserver."}
      </p>
      {!personalized && <a href="/auth/login">Se connecter</a>}
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
                        : "/auth/login"
                    }
                  >
                    {user ? "Découvrir ce repas" : "Se connecter pour réserver"}
                  </a>
                </div>
              </article>
            ))}
          </div>
          {!featured && (
            <nav
              className="pm-explorer__pagination"
              aria-label="Pages des tables"
            >
              {offset > 0 && (
                <button onClick={() => setOffset(Math.max(0, offset - 8))}>
                  Précédent
                </button>
              )}
              {current.data?.nextOffset != null && (
                <button
                  className="pm-button pm-button--red"
                  type="button"
                  onClick={() => setOffset(current.data!.nextOffset!)}
                >
                  Voir plus <span aria-hidden="true">+</span>
                </button>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
