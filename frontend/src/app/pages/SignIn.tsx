import { Link } from "react-router-dom";
import { Button } from "../components/Button";
export function SignIn() {
  return (
    <main className="pm-sign-in">
      <h1>Hello !</h1>
      <p>Connectez-vous pour retrouver vos hôtes préférés</p>
      <div className="pm-sign-in__panel">
        <p className="pm-sign-in__notice">
          La connexion PlateMate arrive bientôt. Ce formulaire est un aperçu.
        </p>
        <fieldset disabled>
          <button type="button">Continuer avec Google</button>
          <button type="button">Continuer avec Facebook</button>
          <button type="button">Continuer avec GitHub</button>
          <span className="pm-sign-in__separator">ou par email</span>
          <label>
            Email
            <input type="email" placeholder="votre@email.com" />
          </label>
          <label>
            Mot de passe
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="button" className="pm-sign-in__submit">
            Se connecter
          </button>
        </fieldset>
        <Button to="/whatsapp/">Rejoindre la communauté</Button>
        <Link to="/explorer">Explorer les expériences</Link>
      </div>
    </main>
  );
}
