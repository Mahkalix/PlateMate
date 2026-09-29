import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { HostCard } from "../components/HostCard";
import { getExperiences, type Experience } from "../lib/api";

const cuisines = [
  "Français",
  "Asiatique",
  "Italien",
  "Japonais",
  "Indienne",
  "Mexicaine",
  "Urbaine",
];
export function Explore() {
  const [params, setParams] = useSearchParams();
  const [city, setCity] = useState(params.get("city") || "");
  const [date, setDate] = useState(params.get("date") || "");
  const [cuisine, setCuisine] = useState(params.get("cuisine") || "");
  const [items, setItems] = useState<Experience[]>([]);
  const [more, setMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [limit, setLimit] = useState(8);
  const query = params.toString();
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    getExperiences(
      {
        city: params.get("city") || undefined,
        date: params.get("date") || undefined,
        cuisine: params.get("cuisine") || undefined,
        limit,
        offset: 0,
      },
      controller.signal,
    )
      .then((result) => {
        setItems(result.experiences);
        setMore(result.pagination.hasMore);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [query, limit]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLimit(8);
    const next = new URLSearchParams();
    if (city.trim()) next.set("city", city.trim());
    if (date) next.set("date", date);
    if (cuisine) next.set("cuisine", cuisine);
    setParams(next);
  }
  function selectCuisine(value: string) {
    const next = new URLSearchParams(params);
    if (next.get("cuisine") === value) next.delete("cuisine");
    else next.set("cuisine", value);
    setCuisine(next.get("cuisine") || "");
    setLimit(8);
    setParams(next);
  }
  return (
    <main className="pm-explore">
      <section className="pm-banner">
        <div className="pm-container">
          <h1>Explorer les expériences</h1>
          <p>Découvrez les tables disponibles près de chez vous</p>
        </div>
      </section>
      <div className="pm-container">
        <form
          className="pm-search"
          onSubmit={submit}
          aria-label="Rechercher des expériences"
        >
          <label>
            ⌖ Ville
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Où ?"
            />
          </label>
          <label>
            ▣ Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            ♧ Cuisine
            <input
              value={cuisine}
              onChange={(event) => setCuisine(event.target.value)}
              placeholder="Pays, régime alimentaire..."
            />
          </label>
          <Button variant="yellow" type="submit">
            ⌕ &nbsp; Rechercher
          </Button>
        </form>
        <div className="pm-categories" aria-label="Cuisines populaires">
          {cuisines.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => selectCuisine(item)}
              aria-pressed={params.get("cuisine") === item}
            >
              <span
                className={`pm-categories__visual pm-categories__visual--${index + 1}`}
                aria-hidden="true"
              >
                ✺
              </span>
              {item}
            </button>
          ))}
        </div>
        <div className="pm-explore__tools">
          <span>
            {status === "ready"
              ? `${items.length}${more ? "+" : ""} expérience${items.length > 1 ? "s" : ""}`
              : "Expériences"}
          </span>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("pm-filters")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Filtres ☷
          </button>
        </div>
        <div id="pm-filters" className="pm-explore__results" aria-live="polite">
          {status === "loading" ? (
            <p className="pm-empty">Chargement des expériences…</p>
          ) : status === "error" ? (
            <p className="pm-empty">
              Les expériences sont indisponibles pour le moment. Réessaie plus
              tard.
            </p>
          ) : items.length ? (
            items.map((item) => <HostCard key={item.id} experience={item} />)
          ) : (
            <p className="pm-empty">
              Aucune expérience disponible avec ces filtres pour le moment.
            </p>
          )}
        </div>
        {status === "ready" && more && (
          <div className="pm-explore__more">
            <Button onClick={() => setLimit(Math.min(limit + 8, 50))}>
              Voir plus
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
