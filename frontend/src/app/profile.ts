export type Profile = {
  firstName: string;
  lastName: string;
  city: string;
  neighborhood?: string;
  phone?: string;
  birthDate?: string;
  description?: string;
  motivations?: string[];
  languages: string[];
  affinities: string[];
  publicInterests: string[];
  ambiences: string[];
  diets: string[];
  allergies: string[];
  intolerances: string[];
  cuisines: string[];
  consent: boolean;
};
export const suggestions = {
  languages: [
    "Français",
    "Anglais",
    "Arabe",
    "Espagnol",
    "Italien",
    "Allemand",
  ],
  affinities: [
    "Musique live",
    "Cuisine du monde",
    "Randonnée",
    "Jeux de société",
    "Voyages",
    "Cinéma d'auteur",
    "Photographie",
    "Escalade",
    "Littérature",
  ],
  ambiences: [
    "Intime (2-4 personnes)",
    "Conviviale (5-8 personnes)",
    "Calme et détendue",
    "Animée et dynamique",
  ],
  diets: [
    "Végétarien",
    "Végan",
    "Sans gluten",
    "Sans lactose",
    "Halal",
    "Casher",
  ],
  cuisines: [
    "Française",
    "Italienne",
    "Marocaine",
    "Japonaise",
    "Indienne",
    "Mexicaine",
    "Libanaise",
  ],
  allergies: [
    "Arachides",
    "Fruits à coque",
    "Œufs",
    "Lait",
    "Poisson",
    "Crustacés",
    "Soja",
    "Sésame",
  ],
  intolerances: ["Lactose", "Gluten"],
  motivations: [
    "Découvrir de nouvelles cultures",
    "Rencontrer des locaux",
    "Manger de la vraie cuisine familiale",
    "Partager des histoires et expériences",
    "Apprendre à cuisiner de nouveaux plats",
    "Voyager autrement",
  ],
};
export const emptyProfile: Profile = {
  firstName: "",
  lastName: "",
  city: "",
  description: "",
  languages: [],
  affinities: [],
  publicInterests: [],
  ambiences: [],
  diets: [],
  allergies: [],
  intolerances: [],
  cuisines: [],
  motivations: [],
  consent: false,
};
