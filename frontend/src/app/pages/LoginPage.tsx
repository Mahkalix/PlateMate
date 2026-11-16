import { useRef } from "react";
import { HomeHeader } from "../sections/HomeHeader";
import { HomeFooter } from "../sections/HomeFooter";
import { TextField } from "../components/ProfileFields";

export function LoginPage() {
  const notice = useRef<HTMLDialogElement>(null);
  function unavailable() {
    notice.current?.showModal();
  }
  return (
    <div className="app pm-inner-page">
      <HomeHeader />
      <main className="pm-login">
        <header>
          <h1>Hello !</h1>
          <p>Connectez-vous pour retrouver vos hôtes préférés</p>
        </header>
        <form
          className="pm-form-card"
          onSubmit={(event) => {
            event.preventDefault();
            unavailable();
          }}
        >
          <div className="pm-login__sso">
            <button type="button" onClick={unavailable}>
              <img src="/ready/49de5.svg" alt="" />
              Continuer avec Google
            </button>
            <button type="button" onClick={unavailable}>
              <img src="/ready/1e94d.svg" alt="" />
              Continuer avec Apple
            </button>
          </div>
          <div className="pm-login__divider">ou par email</div>
          <div className="pm-login__fields">
            <TextField
              name="email"
              label="Email"
              values={{}}
              type="email"
              required
              placeholder="votre@email.com"
            />
            <TextField
              name="password"
              label="Mot de passe"
              values={{}}
              type="password"
              required
              placeholder="********"
            />
          </div>
          <div className="pm-login__actions">
            <div>
              <label>
                <input type="checkbox" name="remember" />
                Se souvenir de moi
              </label>
              <button type="button" onClick={unavailable}>
                Mot de passe oublié ?
              </button>
            </div>
            <button className="pm-button" type="submit">
              Se connecter
            </button>
          </div>
          <p className="pm-login__register">
            Pas encore de compte ? <a href="#/profil">S’inscrire</a>
          </p>
        </form>
      </main>
      <HomeFooter />
      <dialog
        className="pm-dialog"
        ref={notice}
        aria-labelledby="login-notice-title"
      >
        <h2 id="login-notice-title">Connexion indisponible dans la preview</h2>
        <p>
          Cet écran présente la maquette. Aucun identifiant n’est transmis ni
          enregistré. La connexion réelle utilisera Auth0 lors du raccordement
          au backend.
        </p>
        <form method="dialog">
          <button className="pm-button" autoFocus>
            Fermer
          </button>
        </form>
      </dialog>
    </div>
  );
}
