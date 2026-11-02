import { Button } from "../components/Button";

export function Hero() {
  return (
    <section className="pm-hero">
      <div className="pm-hero__content">
        <p className="pm-eyebrow">Expériences culinaires uniques</p>
        <h1>
          Nouvelles saveurs,
          <br />
          nouvelles rencontres.
        </h1>
        <p>
          Des hôtes passionnés vous ouvrent leur cuisine. Réservez votre place,
          découvrez de nouvelles saveurs et repartez avec une belle histoire.
        </p>
        <div className="pm-hero__actions">
          <Button to="#tables" variant="yellow">
            Explorer les expériences{" "}
            <img src="/home/ArrowRightCircle.svg" alt="" />
          </Button>
          <Button to="#hotes" variant="outline">
            Devenez hôte
          </Button>
        </div>
      </div>
    </section>
  );
}
