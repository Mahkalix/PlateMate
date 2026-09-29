import { Link } from "react-router-dom";

export function Maintenance() {
  return (
    <main className="maintenance">
      <div className="cover">
        <img
          src="/whatsapp/assets/hero-table.png"
          alt="Un repas à partager autour d’une grande table"
          width="1125"
          height="750"
          fetchPriority="high"
        />
      </div>
      <section className="intro" aria-labelledby="maintenance-title">
        <p className="construction-note">Site en construction</p>
        <h1 id="maintenance-title">
          On prépare
          <br />
          la table.
        </h1>
        <p>
          PlateMate arrive bientôt. En attendant, rejoins la communauté et
          partage l’aventure avec nous.
        </p>
        <Link className="maintenance-link" to="/whatsapp/">
          Découvrir la communauté <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
