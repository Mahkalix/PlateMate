import { Button } from "../components/Button";

export function HostInvitation() {
  return (
    <section id="hotes" className="pm-host-cta">
      <div>
        <p className="pm-eyebrow">Devenez hôte PlateMate</p>
        <h2>
          Cuisinez.
          <br />
          <span>Partagez.</span>
          <br />
          Gagnez.
        </h2>
        <Button to="#/devenir-hote" variant="yellow">
          En savoir plus <img src="/home/ArrowRightCircle.svg" alt="" />
        </Button>
      </div>
      <div className="pm-host-cta__photo" aria-hidden="true">
        <img src="/home/ColourWhite.webp" alt="" />
        <span>Hôte</span>
      </div>
    </section>
  );
}
