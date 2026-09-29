const people = [
  ["DSCF2184.jpg", "Mikaella Loppnow", "Produit & Design"],
  ["DSCF2201.jpg", "Maxence Badin-Léger", "Développement Web"],
  ["DSCF2174.jpg", "Sohail Asklou", "Marketing"],
  ["IMG_1434.jpg", "Andry Razafimanantsoa", "Marketing"],
  ["DSCF2180.jpg", "Charlie Estebe", "Direction artistique"],
  ["DSCF2195.JPG", "Giorgia Cambiaso", "Direction artistique"],
];
export function About() {
  return (
    <main className="pm-about">
      <section className="pm-about__hero">
        <h1>La vraie culture d’un pays se découvre à table.</h1>
      </section>
      <section className="pm-about__mission pm-container">
        <h2>
          Notre
          <br />
          mission
        </h2>
        <div>
          <p>
            PlateMate est né d’une conviction simple : les plus belles
            rencontres se font autour d’une table et la vraie découverte d’une
            culture passe par sa cuisine familiale.
          </p>
          <p>
            Nous avons créé cette plateforme pour reconnecter les voyageurs avec
            l’authenticité. Fatigués des expériences touristiques standardisées,
            nous voulions offrir quelque chose de différent : des liens humains,
            des plats qui ont une histoire, des moments partagés.
          </p>
        </div>
      </section>
      <section className="pm-about__team">
        <div className="pm-container">
          <h2>L’équipe</h2>
          <div>
            {people.map(([file, name, role]) => (
              <figure key={file}>
                <img
                  src={`/whatsapp/assets/team/${file}`}
                  alt={`Portrait de ${name}`}
                  loading="lazy"
                />
                <figcaption>
                  <strong>{name}</strong>
                  <span>{role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <section className="pm-about__values pm-container">
        <h2>Nos valeurs</h2>
        <div>
          <article>
            <h3>Authenticité</h3>
            <p>Pas de mise en scène. Des repas et des rencontres vrais.</p>
          </article>
          <article>
            <h3>Inclusivité</h3>
            <p>
              Toutes les cultures, toutes les cuisines et toutes les histoires
              ont une place autour de la table.
            </p>
          </article>
          <article>
            <h3>Respect</h3>
            <p>Chaque échange commence par l’écoute et la confiance.</p>
          </article>
        </div>
      </section>
      <section className="pm-about__contact">
        <h2>Rejoignez l’aventure</h2>
        <p>Vous partagez notre vision ? Écrivez-nous.</p>
        <a href="mailto:weareplatemate@gmail.com">weareplatemate@gmail.com</a>
      </section>
    </main>
  );
}
