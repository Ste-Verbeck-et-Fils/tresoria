# Frontend UI

Bienvenue dans l'interface utilisateur de **Tresoria**. une application conçue dans le cadre de la soutenance du diplôme d'ingénieur en Informatique de l'ISIG-GOMA.

<div>

 <img src="src/assets/gif/programming.gif" alt="alt text"  />
 </div>

## Technologies

| Partie        | Technologies                                                                                                                                                        |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework** | [React 19](https://react.dev/)                                                                                                                                      |
| **Outils**    | [Vite](https://vitejs.dev/)                                                                                                                                         |
| **Styling**   | CSS Moderne (Custom Properties, Flexbox, Grid) - Pas de framework CSS lourd, pour un contrôle total du design.                                                      |
| **Linting**   | [Cloudnary](https://cloudinary.com/) pour le stockage des images de profile et d'autres, [ESLint](https://eslint.org/) Garantit la qualité et la cohérence du code. |

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

**Node.js** (LTS recommandé)
**NPM** (généralement inclus avec Node.js)

---

## Structure du Projet

```text
frontend/
├── public/          # Pour les assets statiques (logos, favicons)
├── src/
│   ├── assets/      # Ressources (images, icon, gif)
│   ├── components/  # Composants UI (boutons, inputs) et Layout (Header, Sidebar)
│   ├── context/     # Gestion du state global
│   ├── pages/       # Pages de l'application (Login HomePage...)
│   |    /admin
│   |    /public
│   ├── services/    # services pour les appels API
│   ├── routes/      # Configuration des routes(React Router)
│   ├── styles/      # Thèmes et styles(CSS)
│   |    /admin
│   |    /public
│   ├── App.jsx      # Point d'entrée des composants et providers
│   └── main.jsx     # Point d'entrée DOM et configuration React
├── package.json     # Scripts et dépendances
└── vite.config.js   # Configuration de Vite
```

---

## Installation et Lancement

1. **Installer les dépendances :**

   ```bash
   npm install
   ```

2. **Lancer le serveur de développement :**

   ```bash
   npm run dev
   ```

   L'application sera disponible par défaut sur `http://localhost:5173`.

3. **Préparer la mise en production :**
   ```bash
   npm run build
   ```
   Les fichiers optimisés seront générés dans le dossier `dist/`.

---

## Design et UX

- **Responsive Design :** Interface optimisée pour mobile, tablette et desktop.
- **Thématisation :** Utilisation intensive des variables CSS pour un changement de thème facilité.
- **Performance :** Lazy loading des routes pour réduire le temps de chargement initial.

---

## Standards de Code

- **Naming :** [PascalCase](https://code.mu/fr/theory/glossary/pascal-case/) pour les composants et [camelCase](https://www.v-labs.fr/glossaire/camel-case/) pour les fonctions et variables.
- **Commit :** [Conventional Commits](https://www.conventionalcommits.org/).

**Tout le texte en bleu est cliquable et mène vers un site web pour chaque cas**

---

## Dépannage

- **Vite "Port already in use" :** Vite choisira automatiquement un autre port, mais vous pouvez forcer un port dans `vite.config.js`.
- **Erreurs de linting :** Lancez `npm run lint` pour identifier et corriger automatiquement les problèmes de style de code.

---

## Tests & Qualité

- **Linting :** `npm run lint` pour maintenir un code propre.
- **Build Check :** Lancez régulièrement `npm run build` pour vous assurer qu'il n'y a pas d'erreurs de compilation avant un déploiement.

---

## Contribution

1. Créez une branche pour votre fonctionnalité (`git checkout -b feature/exemple`).
2. Commitez vos changements (`git commit -m "feat: Add example"`).
3. Poussez la branche (`git push origin feature/exemple`).
4. Ouvrez une Pull Request.

---
