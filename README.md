# PlateMate

Pendant la construction de l'application, la racine du site affiche une page d'attente inspirée de la maquette PlateMate. La page communautaire existante reste accessible sous [`/whatsapp/`](whatsapp/).

Pour prévisualiser localement :

```sh
python3 -m http.server 8080
# http://localhost:8080/ (page d'attente)
# http://localhost:8080/whatsapp/ (site communautaire)
```

Le backend en mode test est développé dans la [PR #1](https://github.com/Mahkalix/PlateMate/pull/1).
