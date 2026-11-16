import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";

const team = [
  ["Mikaella LOPPNOW", "Product Designer", "imgContainer"],
  ["Maxence BADIN-LÉGER", "Responsable Technique", "imgContainer1"],
  ["Sohail ASKLOU", "Co-directeur Marketing", "imgContainer2"],
  ["Andry RAZAFIMANANTSOA", "Co-directeur Marketing", "imgContainer3"],
  ["Charlie ESTEBE", "Responsable Direction Artistique", "imgContainer4"],
  ["Giorgia CAMBIASO", "Responsable Direction Artistique", "imgContainer5"],
];
const values = [
  [
    "Authenticité",
    "Pas de mise en scène, pas de spectacle. Juste des vraies personnes qui partagent leur vraie cuisine dans leur vrai quotidien. L'authenticité ne se fabrique pas, elle se vit.",
  ],
  [
    "Inclusivité",
    "Toutes les cuisines, toutes les cultures, tous les budgets. PlateMate est un espace ouvert où chacun trouve sa place, que vous soyez végétarien, halal, sans gluten ou simplement curieux.",
  ],
  [
    "Respect",
    "Respect des hôtes qui ouvrent leur porte. Respect des voyageurs qui font confiance. Respect des cultures qui se partagent. C'est la base de tout échange authentique.",
  ],
];

export function AboutPage() {
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main className="pm-about">
        <div className="pm-about__hero">
          <img
            className="pm-about__hero-photo"
            src="/ready/imgImage3-about.png"
            alt=""
          />
          <img
            className="pm-about__hero-logo"
            src="/ready/imgColourWhite-about.png"
            alt="PlateMate"
          />
        </div>
        <section className="pm-about__mission">
          <h1>
            Notre
            <br />
            mission
          </h1>
          <div>
            <p>
              PlateMate est né d'une conviction simple : les plus belles
              rencontres se font autour d'une table, et la vraie découverte
              d'une culture passe par sa cuisine familiale.
            </p>
            <p>
              Nous avons créé cette plateforme pour reconnecter les voyageurs
              avec l'authenticité. Fatigués des expériences touristiques
              standardisées, nous voulions offrir quelque chose de différent :
              l'opportunité de partager un vrai repas chez l'habitant, de tisser
              des liens humains, d'échanger des histoires.
            </p>
          </div>
        </section>
        <section className="pm-about__team">
          <h2>L'équipe</h2>
          <div className="pm-about__people">
            {team.map(([name, role, image]) => (
              <article key={name}>
                <div className="pm-about__portrait">
                  <img src={`/ready/${image}-about.png`} alt={name} />
                </div>
                <h3>{name}</h3>
                <p>{role}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="pm-about__values">
          <h2>Nos valeurs</h2>
          <div>
            {values.map(([name, text]) => (
              <article key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="pm-about__join">
          <h2>Rejoignez l'aventure</h2>
          <p>
            Vous partagez notre vision ? Vous voulez contribuer à reconnecter
            les humains autour de la table ? Écrivez-nous.
          </p>
          <div className="pm-about__contacts">
            <article>
              <h3>Pour les médias</h3>
              <p>Demandes de presse, interviews, partenariats</p>
              <a href="mailto:presse@platemate.com">presse@platemate.com</a>
            </article>
            <article>
              <h3>Pour les partenariats</h3>
              <p>Collaborations, offices de tourisme, marques</p>
              <a href="mailto:partenariats@platemate.com">
                partenariats@platemate.com
              </a>
            </article>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
