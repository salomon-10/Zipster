# Zipster — Cahier des charges

**Version 2.0** — révision du document initial. Les décisions ambiguës ont été tranchées, les couches inutiles supprimées, le MVP redéfini.

---

## 1. Concept

Convertir une arborescence décrite en texte (format `tree`, ou indentation simple) en archive ZIP téléchargeable.

**Problème résolu.** Recréer à la main la structure d'un projet est répétitif et source d'erreurs. Les CLI de scaffolding (`create-next-app`, etc.) sont figées sur un framework et n'acceptent pas une arborescence libre.

**Pourquoi le format d'entrée est le bon.** L'arborescence texte est déjà le format mental que tout développeur utilise pour visualiser un projet. Zéro apprentissage.

**Positionnement.** Pas un concurrent des CLI de scaffolding, qui restent supérieures pour un framework donné avec sa logique métier. Zipster est plus généraliste, visuel, sans installation, et surtout **partageable** : un formateur envoie un lien, pas une commande CLI à exécuter avec la bonne version de Node.

**Cibles, par ordre de priorité :**

1. Formateurs, bootcamps, profs — distribuent une structure d'exercice à N étudiants
2. Tech leads — imposent une convention d'équipe
3. Développeurs solo — prototypage rapide
4. Rédacteurs de documentation technique — veulent fournir un exemple téléchargeable

---

## 2. Décisions d'architecture structurantes

Quatre décisions qui conditionnent tout le reste. Elles corrigent des choix du document v1.

### 2.1 Génération du ZIP côté client

`JSZip` dans le navigateur construit l'archive et déclenche le téléchargement. Aucun appel serveur.

Pour des fichiers vides ou des templates de quelques kilo-octets, le streaming serveur avec `archiver` était une réponse à un problème inexistant. Ce que la génération client élimine :

- la route `/api/generate`, le service de validation serveur, le service de génération
- Supabase Storage, les URLs signées, les TTL, le cron de nettoyage
- le risque de DoS applicatif et de zip bomb — le seul CPU consommé est celui de l'utilisateur
- le path traversal comme faille **serveur** (l'assainissement des noms reste nécessaire, mais c'est de l'hygiène produit, pas de la sécurité d'infrastructure)
- les coûts de stockage et une large part de la surface RGPD

Le serveur ne redevient nécessaire qu'avec l'API publique et l'export GitHub.

### 2.2 Aucun ZIP n'est jamais stocké

On stocke l'**arbre** (quelques kilo-octets de texte), jamais l'archive. Toute génération est reproductible à la demande depuis le texte source.

Le document v1 identifiait ce point dans son tableau de risques ("TTL sur les fichiers générés, régénération à la demande plutôt que stockage permanent") puis concevait malgré tout une couche Storage complète avec expiration et job de nettoyage. Contradiction supprimée.

### 2.3 Pas d'authentification avant la première génération

L'utilisateur arrive, colle son arbre, télécharge son ZIP. Sans compte.

Le document v1 plaçait l'auth complète en fondation du MVP et imposait même une vérification email avant la première génération. Pour un produit dont toute la valeur tient à l'absence de friction, exiger un signup avant la valeur perçue est le principal facteur d'abandon. Le compte devient une fonctionnalité de **rétention** (sauvegarder, retrouver, partager), pas un préalable d'accès.

### 2.4 Le partage par lien public est gratuit

Le document v1 le plaçait en Phase 3 et le réservait au plan Pro. C'est le principal moteur d'acquisition : un formateur qui envoie un lien à trente étudiants, ce sont trente visiteurs qualifiés. Le placer derrière un paywall revient à facturer son propre canal marketing.

---

## 3. Le cœur technique : le parser

C'est la seule partie réellement difficile du produit, et le seul endroit où un investissement en tests est indispensable. La génération ZIP est triviale ; le parsing tolérant ne l'est pas.

### 3.1 Formats d'entrée à accepter

- format `tree` Unix avec `├──`, `└──`, `│`
- indentation par espaces (2 ou 4), par tabulations, ou mélangée
- JSON / YAML (pour l'usage avancé et l'API, plus tard)

### 3.2 Cas limites à traiter explicitement

| Cas | Décision retenue |
|---|---|
| Fichier ou dossier ? | Priorité 1 : `/` final ⇒ dossier. Priorité 2 : a des enfants ⇒ dossier. Priorité 3 : contient un `.` ⇒ fichier. Sinon ⇒ dossier |
| `Dockerfile`, `LICENSE`, `Makefile`, `Procfile` | Liste blanche de noms connus sans extension ⇒ fichier |
| `.env`, `.gitignore` | Nom commençant par `.` et sans autre `.` ⇒ fichier |
| Commentaires en fin de ligne (`app/ # routes`) | Strippés (fréquent dans les arbres copiés d'un README) |
| Caractères `│` mélangés aux espaces | Normalisés avant calcul de profondeur |
| Indentation incohérente | Rattachée au parent le plus proche, avec avertissement non bloquant |
| Racine multiple ou unique | Les deux acceptés |
| Lignes vides, espaces en fin de ligne | Ignorés |
| Noms réservés Windows (`CON`, `NUL`, `COM1`...) | Avertissement, suffixe automatique proposé |
| `..`, chemins absolus, caractères de contrôle | Rejetés |

### 3.3 Exigence de test

Suite de fixtures couvrant 60 à 80 cas limites, testée avec Vitest. C'est précisément la partie fastidieuse qu'un cloneur bâclera — donc le seul avantage technique défendable du produit.

---

## 4. Stack

Cohérente avec la stack existante (Next.js, Supabase), sans options laissées ouvertes.

| Couche | Choix | Note |
|---|---|---|
| Frontend | Next.js 15 App Router + TypeScript | SSR pour le SEO du landing et des pages de partage |
| UI | Tailwind CSS + shadcn/ui | |
| Éditeur | CodeMirror 6 | Retenu contre Monaco : bien plus léger, et la coloration multi-langage n'est pas requise |
| État | React state local + `useReducer` | Périmètre trop restreint pour justifier Zustand |
| Génération ZIP | JSZip (navigateur) | `archiver` seulement si une génération serveur devient nécessaire pour l'API |
| Auth | Supabase Auth — OAuth GitHub en priorité, puis Google, puis email/mot de passe | GitHub d'abord : la cible est développeur |
| Base de données | Supabase Postgres + RLS | |
| Backend | Route Handlers Next.js | Pas de service Express/Fastify séparé, pas d'hébergement backend distinct |
| Hébergement | Vercel | |
| Monitoring | Sentry + Vercel Analytics | |
| CI | GitHub Actions — lint, typecheck, tests du parser | |

**Supprimés de la v1 :** Supabase Storage, Railway/Render, Upstash Redis (inutile sans API publique), Stripe (voir §7), Resend (Supabase SMTP suffit au départ).

---

## 5. Base de données

Schéma réduit à l'essentiel. Noter l'absence de `zip_path`, d'`expires_at` et de toute référence au stockage d'archives.

```sql
-- Profil complémentaire à auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Une architecture sauvegardée
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  raw_tree text not null,          -- source de vérité : le texte saisi
  is_public boolean not null default false,
  share_slug text unique,          -- partage par lien, gratuit
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Templates de contenu de fichiers (package.json, .gitignore...)
create table file_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- ex: "package.json (Next.js)"
  file_pattern text not null,      -- ex: "package.json"
  framework text,                  -- ex: "nextjs", null si générique
  content text not null,
  is_official boolean not null default false,
  created_by uuid references profiles(id)
);
```

`parsed_tree jsonb` est supprimé : l'arbre se déduit de `raw_tree` en quelques millisecondes côté client. Dupliquer l'information crée un risque de désynchronisation sans bénéfice.

Une table `generations` n'est ajoutée que si un historique s'avère utile, et alors sans chemin de fichier : `project_id`, `file_count`, `size_bytes`, `created_at`.

**RLS** activée partout. Exception : lecture publique de `projects` quand `is_public = true`.

---

## 6. Endpoints

La génération n'apparaît pas dans cette liste — elle est entièrement côté client.

| Méthode | Endpoint | Auth |
|---|---|---|
| GET / POST | `/api/projects` | Oui |
| GET / PUT / DELETE | `/api/projects/:id` | Oui (lecture publique si `is_public`) |
| POST | `/api/projects/:id/share` | Oui |
| GET | `/api/templates` | Non |
| GET | `/api/import/github?repo=` | Non (voir §8.2) |

Auth déléguée à Supabase Auth via `@supabase/ssr`, cookie httpOnly, middleware Next.js sur le groupe de routes `(app)`, RLS en seconde ligne de défense.

---

## 7. Monétisation — repositionnement

Le document v1 plaçait Stripe en Phase 2, avec un quota gratuit de 10 générations par mois.

**Deux problèmes.** Un ZIP de fichiers vides ne se vend pas à 9 € par mois — le document v1 le signalait lui-même ("valeur perçue limitée si les fichiers restent vides") sans en tirer la conséquence. Et limiter à 10 générations mensuelles une opération à coût marginal strictement nul punit exactement les utilisateurs susceptibles d'assurer le bouche-à-oreille.

**Conséquence : pas de paiement avant d'avoir du trafic.** Construire la facturation avant d'avoir la preuve d'un usage est du travail spéculatif.

Les trois sources de revenu plausibles, par ordre de crédibilité :

1. **Remplissage de contenu par IA** — décrire son projet, obtenir la structure *et* le contenu de départ des fichiers. Coût réel par appel, donc paiement légitime et compréhensible. C'est probablement la seule vraie raison de payer. Le document v1 le reléguait en Phase 4.
2. **API / B2B** — intégration dans des CLI internes d'entreprise ou des générateurs de projets maison. Facturation à l'usage.
3. **Angle pédagogique** — espace classe, distribution à une cohorte, suivi. Le formateur paie, les étudiants non. Marché peu couvert par les concurrents généralistes.

Le générateur de base reste gratuit et sans quota restrictif : c'est le canal d'acquisition, pas le produit payant.

---

## 8. Différenciation

Le produit est techniquement simple à cloner. La barrière n'est donc pas le code.

### 8.1 Ce qui constitue réellement un avantage

- **La qualité du parser** (§3) — tolérance réelle aux formats hétérogènes, là où un clone rapide cassera sur la moitié des arbres collés
- **Le partage par lien, gratuit** — boucle d'acquisition virale, notamment via les formateurs
- **La bibliothèque communautaire de templates d'architecture** (pas de code) — effet de réseau, difficile à copier une fois la communauté constituée. Répond à une question réellement posée : "comment structurer un projet Next.js avec tests et CI ?"
- **Le SEO** — les pages de partage publiques et l'import inversé génèrent des pages indexables

### 8.2 L'import inversé mérite une priorité haute

Coller une URL de repo GitHub, obtenir son arborescence en texte à insérer dans un README. C'est une requête réellement tapée dans les moteurs de recherche, ça ne demande aucune authentification, et ça alimente naturellement le générateur : l'arbre obtenu est éditable puis re-téléchargeable.

Le document v1 le classait en simple "amélioration possible" n°3. C'est probablement un meilleur point d'entrée que le générateur lui-même, et ça crée une boucle bidirectionnelle : repo → texte → édition → ZIP.

### 8.3 Autres leviers, plus tard

Export direct vers GitHub/GitLab (transforme l'outil en véritable point de départ de projet), extension VS Code, API publique.

---

## 9. Risques

| Risque | Statut après les décisions du §2 |
|---|---|
| Noms de fichiers piégés, path traversal | Réduit à de l'hygiène de validation côté client. Plus de surface serveur |
| DoS par très grosse arborescence | **Éliminé** — génération côté client |
| Coûts de stockage des archives | **Éliminé** — aucune archive stockée |
| RGPD | Fortement réduit — seuls comptes et texte d'arborescence sont conservés |
| Clonage facile par un concurrent | Réel et non éliminable. Mitigation : parser, communauté, SEO, distribution |
| Valeur perçue faible si les fichiers restent vides | Réel. Mitigation : templates officiels dès la V1.5, contenu IA comme offre payante |
| Absence de demande | **Le risque principal.** Mitigation : voir le MVP ci-dessous |

Le dernier point est celui que le document v1 ne traitait pas. Une roadmap de cinq phases écrite avant tout contact avec des utilisateurs suppose que le marché existe.

---

## 10. Hors-scope assumé

- Édition collaborative temps réel — complexité disproportionnée
- Exécution ou build du projet généré dans le navigateur — hors périmètre
- Génération de logique métier complexe — mieux couvert par les outils IA génériques
- Espaces d'équipe et rôles — uniquement si une traction B2B est confirmée par les données
- Mode "diff" entre deux architectures — intéressant, mais aucun signal de demande

---

# 11. Le nouveau MVP

Principe directeur : **obtenir un signal de demande réel avant d'investir des semaines de développement.** Le document v1 prévoyait 1 à 2 semaines de cadrage (maquettes, schéma définitif) puis 4 à 6 semaines de MVP, soit 6 à 8 semaines avant le premier utilisateur. Pour un outil de cette simplicité, c'est inversé.

## Étape 1 — L'outil nu (objectif : 3 à 5 jours)

Une seule page. Aucun compte. Aucune base de données. Aucun backend.

**Périmètre :**

- Éditeur CodeMirror avec l'arborescence d'exemple préchargée
- Parser tolérant (§3) avec la suite de tests Vitest
- Prévisualisation arborescente façon explorateur de fichiers, icônes par extension, debounce 200 ms
- Erreurs et avertissements de syntaxe affichés en continu, jamais bloquants
- Champ de nom du ZIP, puis génération JSZip et téléchargement
- Landing minimale au-dessus de l'éditeur : une phrase, le fonctionnement, rien d'autre

**Hors périmètre à cette étape :** auth, sauvegarde, dashboard, profil, templates, paiement, API, historique.

**Critères de sortie :** un arbre collé depuis n'importe quel README public se parse correctement ; le ZIP s'ouvre proprement sur Windows, macOS et Linux ; la génération est instantanée jusqu'à 500 nœuds.

**Puis : déployer et diffuser.** Reddit (r/webdev, r/SideProject), X, Hacker News, Product Hunt, groupes de formateurs et de bootcamps. Instrumenter deux métriques seulement : nombre de générations, et part des visiteurs qui génèrent au moins un ZIP.

## Étape 2 — Rétention (objectif : 1 semaine, **uniquement si l'étape 1 est utilisée**)

- Auth Supabase, OAuth GitHub en premier
- Sauvegarde et liste des architectures
- Lien de partage public, gratuit, en lecture seule avec bouton "forker dans l'éditeur"
- Templates officiels : `package.json`, `.gitignore`, `README.md`, `tsconfig.json`, activables par case à cocher

## Étape 3 — Le levier d'acquisition (objectif : 1 semaine)

- Import inversé depuis une URL de repo GitHub (§8.2)
- Pages de partage indexables par les moteurs de recherche

## Ensuite

Piloté par les données d'usage, pas par une roadmap figée. Les trois directions candidates, à trancher selon le signal observé : contenu de fichiers par IA (si la demande de fichiers pré-remplis remonte), bibliothèque communautaire (si les utilisateurs sauvegardent et partagent beaucoup), fonctionnalités classe et facturation (si l'usage pédagogique se confirme).

## Condition d'arrêt

Si l'étape 1, correctement diffusée, ne produit aucun usage répété, le projet s'arrête là — pour un coût de quelques jours au lieu de deux mois. C'est l'intérêt principal de ce découpage.

---

## Annexe — Réserve à la décision de découpage

Deux arguments contre le MVP minimal ci-dessus, à peser selon l'objectif poursuivi.

**Si l'objectif est l'apprentissage et le portfolio** plutôt que la traction, construire la stack complète (Stripe, quotas, RLS avancé, clés API, webhooks) a une valeur pédagogique propre. Un SaaS complet se présente mieux à un recruteur qu'une page unique, même excellente.

**L'absence de comptes appauvrit la mesure.** À l'étape 1 on observe des volumes, pas de la rétention : impossible de savoir si dix générations viennent d'un utilisateur fidèle ou de dix visiteurs de passage. Atténuation possible : un identifiant anonyme en `localStorage` pour distinguer les visiteurs récurrents sans exiger d'inscription.
