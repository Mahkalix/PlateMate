import { HomeHeader } from "../sections/HomeHeader";
import { Hero } from "../sections/Hero";
import { TrustBar } from "../sections/TrustBar";
import { FeaturedTables } from "../sections/FeaturedTables";
import { HowItWorks } from "../sections/HowItWorks";
import { CommunityGallery } from "../sections/CommunityGallery";
import { HostInvitation } from "../sections/HostInvitation";
import { HomeFooter } from "../sections/HomeFooter";
import { WordBanner } from "../components/WordBanner";
import "../../../scss/app.scss";

export function HomePage() {
  return (
    <div id="accueil" className="app">
      <HomeHeader />
      <main>
        <Hero />
        <TrustBar />
        <FeaturedTables />
        <WordBanner
          words={[
            "FRANÇAISE",
            "ITALIENNE",
            "MAROCAINE",
            "JAPONAISE",
            "INDIENNE",
            "MEXICAINE",
          ]}
        />
        <HowItWorks />
        <WordBanner
          teal
          words={[
            "CULTUREL",
            "GOURMAND",
            "CONVIVIAL",
            "AUTHENTIQUE",
            "GÉNÉREUX",
            "CURIEUX",
          ]}
        />
        <CommunityGallery />
        <HostInvitation />
      </main>
      <HomeFooter />
    </div>
  );
}
