# PMT — Project Management Tool

Application web de gestion de projet : projets, membres avec rôles, tâches
assignables. Angular 19 côté client, Spring Boot 4 côté serveur, MySQL 8.

**Étude de cas — Mastère en ingénierie du logiciel** · Yann Dipita

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Développement](#développement)
- [Tests et couverture](#tests-et-couverture)
- [Procédure de déploiement](#procédure-de-déploiement)
- [Sécurité](#sécurité)
- [Documentation](#documentation)

---

## Fonctionnalités

| # | User story | Endpoint |
|---|---|---|
| 1 | Se connecter avec e-mail et mot de passe | `POST /api/auth/login` |
| 2 | Créer un projet et en devenir administrateur | `POST /api/projects` |
| 3 | Inviter un membre par son adresse e-mail | `POST /api/projects/{id}/members` |
| 4 | Attribuer un rôle (administrateur, membre, observateur) | `PUT /api/projects/{id}/members/{userId}/role` |
| 5 | Créer une tâche (nom, description, échéance, priorité) | `POST /api/projects/{id}/tasks` |
| 6 | Assigner une tâche à un membre | via `assigneeId` |
| 7 | Mettre à jour une tâche, ajouter une date de fin | `PUT /api/tasks/{id}` |
| 8 | Visualiser une tâche unitaire | `GET /api/tasks/{id}` |

## Architecture

```
                  ┌──────────────┐
   navigateur ───►│  nginx :80   │  sert Angular, relaie /api
                  └──────┬───────┘
                         │  réseau Docker interne
                  ┌──────▼───────┐
                  │  API :8082   │  Spring Boot 4 · JWT · JPA
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │  MySQL 8     │  aucun port publié
                  └──────────────┘
```

En production, nginx relaie `/api` vers le conteneur de l'API : **le navigateur
ne voit qu'une seule origine**, donc pas de CORS et pas de cookie tiers. Ni la
base ni l'API ne publient de port — nginx est le seul point d'entrée.

```
api/pmt_api/          Spring Boot — contrôleurs, services, entités, sécurité
client_web/           Angular 19 — composants autonomes, signaux, routes paresseuses
db/init/init.sql      Structure et données de test
docs/                 Conception, design, documentation
.github/workflows/    Pipeline CI/CD
```

## Démarrage rapide

Prérequis : Docker, et pour le développement Java 21 et Node 20.

```bash
git clone https://github.com/kingcrud12/pmt_web_app.git
cd pmt_web_app
cp .env.example .env          # renseigner les mots de passe et le secret JWT
docker compose --profile full up -d --build
```

L'application est sur **http://localhost:8080**.

Comptes de démonstration, mot de passe `motdepasse123` :

| Compte | Rôles |
|---|---|
| `alice@pmt.fr` | administratrice de 2 projets |
| `bob@pmt.fr` | administrateur de 1 projet, membre d'un autre |
| `chloe@pmt.fr` | observatrice |
| `mallory@pmt.fr` | aucun projet — pour vérifier le cloisonnement |

## Développement

Base seule en conteneur, API et front lancés depuis l'IDE :

```bash
docker compose up -d                        # MySQL sur 127.0.0.1:3306
cd api/pmt_api && ./mvnw spring-boot:run    # API sur :8082
cd client_web  && npm start                 # front sur :4200, /api relayé vers :8082
```

Variables d'environnement — voir `.env.example` :

| Variable | Rôle |
|---|---|
| `MYSQL_*` | base de données |
| `PMT_JWT_SECRET` | signature des jetons, **32 caractères minimum** |
| `PMT_CORS_ORIGINS` | origines autorisées, séparées par des virgules |
| `WEB_PORT` | port exposé par nginx |

Générer un secret : `openssl rand -base64 48`

## Tests et couverture

```bash
cd api/pmt_api
./mvnw test                    # tests unitaires seuls, sans Docker
./mvnw test -Pit               # + intégration (contexte Spring, MySQL requis)
# rapport : target/site/jacoco/index.html

cd client_web
npm test                       # mode interactif
npm run test:ci                # une passe, Chrome headless, avec couverture
# rapport : coverage/client_web/index.html
```

Les tests unitaires du back n'exigent ni base ni réseau : ils sont isolés par
Mockito. Les tests d'intégration sont marqués `@Tag("integration")` et exclus
par défaut, pour que la boucle de développement reste rapide et déterministe.

## Procédure de déploiement

Le déploiement est automatique sur `main` via GitHub Actions. Le pipeline
teste, construit les images, les publie sur GHCR, puis les déploie par SSH.

### 1. Préparer le VPS

Docker et le plugin Compose doivent être installés, et le port choisi ouvert.

```bash
ssh utilisateur@votre-vps
sudo mkdir -p /opt/pmt && sudo chown $USER:$USER /opt/pmt
docker --version && docker compose version
```

### 2. Créer la clé de déploiement

Sur votre poste :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/pmt_deploy -C "deploiement pmt" -N ""
ssh-copy-id -i ~/.ssh/pmt_deploy.pub utilisateur@votre-vps
ssh-keyscan -H votre-vps            # empreinte à mettre dans VPS_KNOWN_HOSTS
```

L'empreinte est **épinglée** plutôt que la vérification désactivée : sans
cela, le pipeline livrerait ses secrets à n'importe quelle machine se faisant
passer pour le serveur.

### 3. Déclarer les secrets GitHub

`Settings → Secrets and variables → Actions`

| Secret | Contenu |
|---|---|
| `VPS_HOST` | nom d'hôte ou IP |
| `VPS_USER` | utilisateur SSH |
| `VPS_SSH_KEY` | contenu de `~/.ssh/pmt_deploy` (clé **privée**) |
| `VPS_KNOWN_HOSTS` | sortie de `ssh-keyscan -H votre-vps` |
| `VPS_PORT` | port SSH — facultatif, 22 par défaut |
| `VPS_APP_DIR` | dossier cible — facultatif, `/opt/pmt` par défaut |
| `WEB_PORT` | port exposé — facultatif, 80 par défaut |
| `MYSQL_ROOT_PASSWORD` | |
| `MYSQL_DATABASE` | `pmt_db` |
| `MYSQL_USER`, `MYSQL_PASSWORD` | |
| `PMT_JWT_SECRET` | `openssl rand -base64 48` |
| `PMT_CORS_ORIGINS` | `https://votre-domaine.fr` |
| `GHCR_PULL_TOKEN` | jeton `read:packages` — inutile si les images sont publiques |

### 4. Déployer

```bash
git push origin main
```

Le pipeline enchaîne : tests back (unitaires puis intégration contre un MySQL
de service), build du front, publication des images sur GHCR étiquetées par
SHA de commit, copie du compose et de `db/init` sur le VPS, écriture du `.env`
par stdin, `docker compose pull && up -d`, puis **contrôle de santé**. Si
l'API ne devient pas saine en 150 secondes, le job échoue et affiche les
journaux — un déploiement cassé ne passe pas pour un succès.

### Déploiement manuel

```bash
scp docker-compose.prod.yml utilisateur@votre-vps:/opt/pmt/docker-compose.yml
scp -r db/init utilisateur@votre-vps:/opt/pmt/db/
ssh utilisateur@votre-vps
cd /opt/pmt
cat > .env <<'EOF'
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=pmt_db
MYSQL_USER=...
MYSQL_PASSWORD=...
PMT_JWT_SECRET=...
PMT_CORS_ORIGINS=https://votre-domaine.fr
WEB_PORT=80
API_IMAGE=ghcr.io/kingcrud12/pmt-api:latest
WEB_IMAGE=ghcr.io/kingcrud12/pmt-web:latest
EOF
chmod 600 .env
docker compose pull && docker compose up -d
docker compose ps
```

### Revenir en arrière

Chaque image est étiquetée par le SHA du commit :

```bash
sed -i 's|:latest|:<sha-precedent>|' .env
docker compose pull && docker compose up -d
```

### Points d'attention

**`db/init` ne s'exécute que sur un volume vide.** Sur un serveur neuf c'est
le comportement voulu ; ensuite, une modification du schéma demande une
migration — le pipeline n'en fait aucune, volontairement.

**HTTPS.** Le conteneur nginx sert en HTTP. En production, placez un
reverse-proxy TLS devant (Caddy, Traefik, ou nginx avec Certbot) et faites
pointer `PMT_CORS_ORIGINS` sur l'URL en `https://`.

## Sécurité

**Mots de passe** — BCrypt, jamais renvoyés par l'API ni écrits dans les
journaux. Le type `HashedPassword` refuse toute valeur qui ne fait pas
60 caractères : stocker un mot de passe en clair ne compile pas.

**Authentification** — JWT HS256 dans l'en-tête `Authorization`, jamais en
cookie. Le navigateur ne l'envoie donc jamais de lui-même : **le CSRF est
impossible par construction**. Le jeton ne porte que l'identité, aucun rôle de
projet — les rôles changent, un jeton émis ne change plus.

**IDOR** — aucun endpoint n'accepte d'identifiant d'utilisateur : l'appelant
vient toujours du jeton signé. Tout accès projet ou tâche passe par
`ProjectAccessService`, qui relit l'appartenance en base. Un non-membre reçoit
**404 et non 403** : un 403 confirmerait l'existence du projet et permettrait
de cartographier les données des autres équipes.

**XSS** — l'API ne renvoie que du JSON ; le front n'utilise que
l'interpolation Angular, jamais `innerHTML`. nginx sert une CSP restrictive.

**Énumération de comptes** — la connexion compare toujours un hachage, même
pour un e-mail inconnu : sans cela, l'écart de temps de réponse trahirait les
comptes existants. Le message d'erreur est identique dans les deux cas.

**Fuite d'information** — aucune trace d'exception ne sort vers le client ;
les erreurs inattendues sont journalisées côté serveur et renvoyées sous forme
générique.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/conception/schema-base-de-donnees.md`](docs/conception/schema-base-de-donnees.md) | Schéma, entités, choix techniques |
| [`db/init/init.sql`](db/init/init.sql) | Script de génération — structure et données de test |
| [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) | Pipeline CI/CD |
| [`api/pmt_api/Dockerfile`](api/pmt_api/Dockerfile) | Image du backend |
| [`client_web/Dockerfile`](client_web/Dockerfile) | Image du frontend |
