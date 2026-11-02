import { Link } from "react-router-dom";
export function Legal() {
  return (
    <main className="legal">
      <Link className="back-link" to="/">
        ← Retour à l’accueil
      </Link>
      <h1>Mentions légales</h1>
      <section aria-labelledby="publisher-title">
        <h2 id="publisher-title">Éditeur du site</h2>
        <p>
          PlateMate présente un projet de repas et de rencontres entre hôtes et
          invités à Grenoble et aux alentours.
        </p>
        <dl>
          <dt>E-mail de contact</dt>
          <dd>
            <a href="mailto:weareplatemate@gmail.com">
              weareplatemate@gmail.com
            </a>
          </dd>
          <dt>Responsable de publication</dt>
          <dd>Maxence Badin-Léger</dd>
        </dl>
      </section>
      <section aria-labelledby="hosting-title">
        <h2 id="hosting-title">Hébergement</h2>
        <p>
          Vercel Inc.
          <br />
          440 N Barranca Avenue #4133
          <br />
          Covina, CA 91723, États-Unis
        </p>
        <p>
          <a href="https://vercel.com/legal/privacy-notice">
            Coordonnées et politique de confidentialité de Vercel
          </a>
        </p>
      </section>
      <section aria-labelledby="content-title">
        <h2 id="content-title">Contenus et photographies</h2>
        <p>
          Les photographies présentent l’équipe PlateMate. Pour toute demande
          concernant un contenu ou l’utilisation d’un portrait, contactez
          l’éditeur à{" "}
          <a href="mailto:weareplatemate@gmail.com">weareplatemate@gmail.com</a>
          .
        </p>
      </section>
      <section aria-labelledby="privacy-title">
        <h2 id="privacy-title">Données personnelles et services externes</h2>
        <p>
          Ce site ne propose pas de formulaire ni de création de compte. Les
          liens WhatsApp et Instagram ouvrent des services externes, soumis à
          leurs propres conditions et politiques de confidentialité.
        </p>
        <p>
          La police DM Sans est chargée depuis Google Fonts. Ce chargement et
          l’hébergement du site impliquent des requêtes techniques auprès de
          prestataires externes, notamment avec l’adresse IP du visiteur.
        </p>
      </section>
    </main>
  );
}
