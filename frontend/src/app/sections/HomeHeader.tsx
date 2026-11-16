import { useEffect, useRef, useState } from "react";
import { HomeNavLinks } from "../components/HomeNavLinks";
import { useSession } from "../Session";
import { errorMessage } from "../api";

export function HomeHeader({
  accountName,
  accountRole = "invite",
}: {
  accountName?: string;
  accountRole?: "hote" | "invite";
}) {
  const innerPage = window.location.hash.startsWith("#/");
  const session = useSession();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const signedIn = Boolean(session.user);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const account = useRef<HTMLDivElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = () => {
      setAccountOpen(false);
      setOpen(false);
    };
    const outside = (event: PointerEvent) => {
      if (!account.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && accountOpen) {
        setAccountOpen(false);
        accountButton.current?.focus();
      }
    };
    window.addEventListener("hashchange", close);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("hashchange", close);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const element = header.current;
    const home = element?.closest<HTMLElement>(".app");
    if (!element || !home || open) return;
    const update = () =>
      home.style.setProperty("--nav-height", `${element.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  return (
    <>
      <div className="pm-sticky-nav">
        <header
          ref={header}
          className={scrolled ? "pm-header is-scrolled" : "pm-header"}
        >
          <a
            href="#accueil"
            className="pm-logo"
            aria-label="PlateMate, accueil"
          >
            <img
              src={
                innerPage
                  ? "/ready/imgLogo11-about.png"
                  : "/home/ColourWhite.webp"
              }
              alt="PlateMate"
            />
          </a>
          <button
            className="pm-menu-toggle"
            aria-controls="home-nav"
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
              setAccountOpen(false);
            }}
          >
            {open ? "Fermer" : "Menu"}
          </button>
          <nav
            id="home-nav"
            aria-label="Navigation principale"
            className={"pm-nav" + (open ? " is-open" : "")}
          >
            <HomeNavLinks onNavigate={() => setOpen(false)} />
          </nav>
          <div
            className="pm-header__account"
            ref={account}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setAccountOpen(false);
            }}
          >
            {signedIn ? (
              <button
                type="button"
                ref={accountButton}
                className="pm-button pm-header__login"
                aria-expanded={accountOpen}
                aria-controls="account-navigation"
                onClick={() => {
                  setAccountOpen(!accountOpen);
                  setOpen(false);
                }}
              >
                <img src="/home/UserCircle.svg" alt="" />
                {session.draftName ||
                  session.profile?.firstName ||
                  accountName ||
                  "Mon compte"}
              </button>
            ) : (
              <a className="pm-button pm-header__login" href="#/connexion">
                <img src="/home/UserCircle.svg" alt="" />
                Se connecter
              </a>
            )}
            {signedIn && (
              <nav
                id="account-navigation"
                className="pm-header__account-panel"
                aria-label="Espace personnel"
                hidden={!accountOpen}
              >
                <a href={`#/mon-profil/${accountRole}`}>Mon profil</a>
                <a href={`#/mes-repas/${accountRole}`}>Mes repas</a>
                <button
                  type="button"
                  className="pm-header__logout"
                  disabled={loggingOut}
                  aria-busy={loggingOut}
                  onClick={async () => {
                    setLoggingOut(true);
                    setLogoutError("");
                    try {
                      await session.logout();
                    } catch (e) {
                      setLogoutError(errorMessage(e));
                    } finally {
                      setLoggingOut(false);
                    }
                  }}
                >
                  {loggingOut ? "Déconnexion." : "Se déconnecter"}
                </button>
                {logoutError && (
                  <p className="pm-header__account-error" role="alert">
                    {logoutError}
                  </p>
                )}
              </nav>
            )}
          </div>
        </header>
      </div>
    </>
  );
}
