import { useEffect, useRef, useState } from "react";
import { HomeNavLinks } from "../components/HomeNavLinks";

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const login = useRef<HTMLDialogElement>(null);

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
            <img src="/home/ColourWhite.webp" alt="PlateMate" />
          </a>
          <button
            className="pm-menu-toggle"
            aria-controls="home-nav"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
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
          <button
            className="pm-button pm-header__login"
            onClick={() => login.current?.showModal()}
          >
            <img src="/home/UserCircle.svg" alt="" />
            Se connecter
          </button>
        </header>
      </div>
      <dialog
        aria-labelledby="home-login-title"
        ref={login}
        className="pm-dialog"
      >
        <h2 id="home-login-title">Se connecter</h2>
        <p>La connexion sera disponible lors du raccordement au backend.</p>
        <form method="dialog">
          <button autoFocus className="pm-button pm-button--red">
            Fermer
          </button>
        </form>
      </dialog>
    </>
  );
}
