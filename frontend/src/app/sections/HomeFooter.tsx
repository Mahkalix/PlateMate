import { HomeNavLinks } from "../components/HomeNavLinks";
import { Link } from "react-router-dom";

export function HomeFooter() {
  return (
    <footer className="pm-footer">
      <div className="pm-footer__top">
        <a className="pm-logo" href="#accueil">
          <img src="/home/ColourWhite.webp" alt="PlateMate, accueil" />
        </a>
        <div className="pm-footer__social">
          <span>
            <img src="/home/Tiktok.svg" alt="TikTok" />
          </span>
          <a
            href="https://www.instagram.com/weareplatemate/"
            aria-label="Instagram PlateMate"
          >
            <img src="/home/Instagram.svg" alt="" />
          </a>
        </div>
        <nav aria-label="Pied de page">
          <HomeNavLinks />
        </nav>
      </div>
      <div className="pm-footer__bottom">
        <span>© 2025 PlateMate. Tous droits réservés.</span>
        <div className="pm-footer__legal">
          <Link to="/mentions-legales">Mentions légales</Link>
          <a href="/mentions-legales#privacy-title">Confidentialité</a>
          <span title="Conditions générales à venir">CGU</span>
        </div>
      </div>
    </footer>
  );
}
