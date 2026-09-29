import type { Experience } from "../lib/api";

// Cartes éditoriales de la maquette en attendant cinq expériences illustrées.
const image = (name: string) => `/figma/cards/${name}.jpg`;
const card = (
  id: string,
  title: string,
  hostName: string,
  hostInterests: string[],
  asset: string,
): Experience => ({
  id,
  title,
  hostName,
  hostInterests,
  photoUrl: image(asset + "-food"),
  hostPhotoUrl: image(asset + "-portrait"),
  city: "",
  cuisine: "",
  theme: null,
  atmosphere: null,
  menuPriceCents: 0,
  serviceFeeCents: 0,
});

export const showcaseCards = [
  card(
    "showcase-amina-1",
    "Nuit libanaise",
    "Amina Kader",
    ["Musique", "Jiu Jitsu", "Films"],
    "amina",
  ),
  card(
    "showcase-troy",
    "Troy Bolton",
    "Hôte légendaire",
    ["Musique", "Basketball", "Films"],
    "troy",
  ),
  card(
    "showcase-amina-2",
    "Nuit libanaise",
    "Amina Kader",
    ["Musique", "Jiu Jitsu", "Films"],
    "amina",
  ),
  card(
    "showcase-jean",
    "Jean Marc",
    "Hôte légendaire",
    ["Foody", "Culture", "Films"],
    "jean",
  ),
  card(
    "showcase-usain",
    "Usain Bolt",
    "Hôte confirmé",
    ["Football", "Artes", "Films"],
    "usain",
  ),
];
