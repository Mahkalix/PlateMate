import { Link } from "react-router-dom";
const members = [
  ["DSCF2174.jpg", "Sohail Asklou", "Marketing"],
  ["DSCF2180.jpg", "Charlie Estebe", "Direction artistique"],
  ["DSCF2184.jpg", "Mikaella Loppnow", "UX/UI"],
  ["DSCF2195.JPG", "Giorgia Cambiaso", "Direction artistique"],
  ["DSCF2201.jpg", "Maxence Badin-Léger", "Développement Web"],
  ["IMG_1434.jpg", "Andry Razafimanantsoa", "Marketing"],
];
export function Team() {
  return (
    <main>
      <Link className="back-link" to="/">
        ← Retour à l’accueil
      </Link>
      <section
        id="equipe"
        className="team team-page"
        aria-labelledby="team-title"
      >
        <h1 id="team-title">
          L’équipe derrière
          <br />
          PlateMate
        </h1>
        <p className="team-intro">
          Six visages, une même envie : se retrouver autour d’un bon repas.
        </p>
        <div className="team-grid">
          {members.map(([image, name, role]) => (
            <figure className="team-member" key={image}>
              <img
                src={`/whatsapp/assets/team/${image}`}
                alt={`Portrait de ${name}`}
                width="2080"
                height="3120"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                {name}
                <span className="team-role">{role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
