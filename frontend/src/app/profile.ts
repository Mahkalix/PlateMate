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
    "Fran�ais",
    "Anglais",
    "Arabe",
    "Espagnol",
    "Italien",
    "Allemand",
  ],
  affinities: [
    "Musique live",
    "Cuisine du monde",
    "Randonn�e",
    "Jeux de soci�t�",
    "Voyages",
    "Cin�ma d'auteur",
    "Photographie",
    "Escalade",
    "Litt�rature",
  ],
  ambiences: [
    "Intime (2-4 personnes)",
    "Conviviale (5-8 personnes)",
    "Calme et d�tendue",
    "Anim�e et dynamique",
  ],
  diets: [
    "V�g�tarien",
    "V�gan",
    "Sans gluten",
    "Sans lactose",
    "Halal",
    "Casher",
  ],
  cuisines: [
    "Fran�aise",
    "Italienne",
    "Marocaine",
    "Japonaise",
    "Indienne",
    "Mexicaine",
    "Libanaise",
  ],
  allergies: [
    "Arachides",
    "Fruits � coque",
    "Oufs",
    "Lait",
    "Poisson",
    "Crustac�s",
    "Soja",
    "S�same",
  ],
  intolerances: ["Lactose", "Gluten"],
  motivations: [
    "D�couvrir de nouvelles cultures",
    "Rencontrer des locaux",
    "Manger de la vraie cuisine familiale",
    "Partager des histoires et exp�riences",
    "Apprendre � cuisiner de nouveaux plats",
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
