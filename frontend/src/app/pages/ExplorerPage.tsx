import { useRef, useState, type FormEvent } from "react";
import { ExperienceCards } from "../components/ExperienceCards";
import { useSession } from "../Session";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";

const cuisines = [
  ["Français", "française", "d7552"],
  ["Asiatique", "asiatique", "b34b8"],
  ["Italien", "italienne", "e5554"],
  ["Japonais", "japonaise", "ceee7"],
  ["Indienne", "indienne", "fa324"],
  ["Mexicaine", "mexicaine", "c06a3"],
] as const;
export function ExplorerPage() {
  const { user } = useSession();
  const [filters, setFilters] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [expanded, setExpanded] = useState(false);
  const slider = useRef<HTMLDivElement>(null);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (String(value).trim()) params.set(key, String(value).trim());
    }
    setFilters(params.toString());
  }
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main className="pm-explorer">
        <header className="pm-explorer__heading">
          <h1>Explorer les expériences</h1>
          <p>Voir les expériences disponibles près de chez vous</p>
        </header>
        {!user && (
          <a className="pm-explorer__banner" href="#/connexion">
            Connectez-vous pour en voir plus !
          </a>
        )}
        {user && (
          <div className="pm-explorer__tools">
            <form className="pm-explorer__search" onSubmit={search}>
              <label>
                <span>
                  <img src="/explorer/e14bc.svg" alt="" />
                  Adresse
                </span>
                <input name="city" placeholder="Où ?" maxLength={80} />
              </label>
              <label>
                <span>
                  <img src="/explorer/25efc.svg" alt="" />
                  Date
                </span>
                <input name="date" type="date" />
              </label>
              <label>
                <span>
                  <img src="/explorer/ae339.svg" alt="" />
                  Cuisine
                </span>
                <input
                  name="cuisine"
                  placeholder="Pays, cuisine…"
                  maxLength={80}
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                />
              </label>
              <button className="pm-button" type="submit">
                Rechercher <img src="/explorer/5363d.svg" alt="" />
              </button>
              <div className="pm-explorer__filter-panel" hidden={!expanded}>
                <label>
                  Régime alimentaire
                  <select name="diet">
                    <option value="">Tous</option>
                    <option value="vegetarian">Végétarien</option>
                    <option value="vegan">Végétalien</option>
                  </select>
                </label>
                <label>
                  Langue
                  <input name="language" placeholder="fr, en…" maxLength={80} />
                </label>
                <button
                  type="reset"
                  onClick={() => {
                    setCuisine("");
                    setFilters("");
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </form>
            <section
              className="pm-explorer__categories"
              aria-labelledby="cuisines-title"
            >
              <h2 id="cuisines-title">Qu’est-ce qui vous fait envie ?</h2>
              <div className="pm-explorer__slider">
                <button
                  type="button"
                  aria-label="Catégories précédentes"
                  onClick={() =>
                    slider.current?.scrollBy({ left: -376, behavior: "smooth" })
                  }
                >
                  <img src="/explorer/a6a76.svg" alt="" />
                </button>
                <div ref={slider} className="pm-explorer__cuisines">
                  {cuisines.map(([label, value, asset], i) => (
                    <button
                      type="button"
                      key={value}
                      className={`pm-cuisine pm-cuisine--${i}`}
                      aria-pressed={cuisine === value}
                      onClick={() => {
                        const next = cuisine === value ? "" : value;
                        setCuisine(next);
                        const p = new URLSearchParams(filters);
                        next ? p.set("cuisine", next) : p.delete("cuisine");
                        setFilters(p.toString());
                      }}
                    >
                      <span>
                        <img src={`/explorer/${asset}.png`} alt="" />
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Catégories suivantes"
                  onClick={() =>
                    slider.current?.scrollBy({ left: 376, behavior: "smooth" })
                  }
                >
                  <img src="/explorer/b561b.svg" alt="" />
                </button>
              </div>
            </section>
            <button
              className="pm-explorer__filter-toggle"
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              <img src="/explorer/0c500.svg" alt="" />
              Filtres
            </button>
          </div>
        )}
        <div className="pm-explorer__content">
          <ExperienceCards filters={filters} />
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
