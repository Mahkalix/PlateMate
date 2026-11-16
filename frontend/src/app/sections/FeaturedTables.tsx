import { ExperienceCards } from "../components/ExperienceCards";

export function FeaturedTables() {
  return (
    <section id="tables" className="pm-featured pm-container">
      <div className="pm-section-heading">
        <div>
          <p className="pm-eyebrow">Expériences à la une</p>
          <h2>Des tables qui ont du caractère.</h2>
        </div>
        <a href="#/explorer">
          Découvrez <img src="/home/ArrowRightCircle1.svg" alt="" />
        </a>
      </div>
      <ExperienceCards featured />
    </section>
  );
}
