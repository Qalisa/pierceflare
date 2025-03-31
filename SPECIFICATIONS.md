# Spécifications Techniques - Pierceflare (v4)

Ce document détaille les spécifications techniques mises à jour pour le projet Pierceflare, en tenant compte de la structure de projet existante et des conventions de nommage.

## 1. Structure du Projet

*   `server/`: Contient le code source du serveur Node.js (ex: `server/src/`).
*   `cli/`: Contient le code source du client léger (ex: `cli/src/` ou `cli/client.js`).
*   `Dockerfile.server`: Dockerfile pour construire l'image du serveur (à la racine).
*   `Dockerfile.cli`: Dockerfile pour construire l'image du client léger (à la racine).
*   `.helm/`: Contient le Helm chart pour le déploiement du serveur.
*   `.vscode/`: Contient la configuration VSCode (ex: `launch.json`).
*   `SPECIFICATIONS.md`: Ce document.

## 2. Fonctionnalités Clés (Node.js Server - Code dans `server/`)

*   **Serveur HTTP (Express) :** Routes `/admin/*`, `/api/ping` (POST), **`/healthz` (GET)**, service fichiers statiques.
*   **DB SQLite :** Init DB/tables, CRUD profils, gestion clés API (génération, **hashage bcrypt**, révocation, validation, **multiples clés/profil**), logging accès API (**conservation indéfinie**, contenu: IP màj, Timestamp, ID Clé API, Statut CF, Erreur). Fichier DB stocké via PVC.
*   **API `/api/ping` (POST) :**
    *   Auth clé API (Bearer Token).
    *   **Rate limiting** (1 req/10s par clé API).
    *   Accepte `{"ip": "..."}` dans le corps JSON.
    *   **Valide l'IP fournie** : Doit être publique (IPv4 ou IPv6), rejeter IPs privées/réservées.
    *   Récupère le domaine associé à la clé API.
    *   **Gestion de la concurrence** (mécanisme de verrouillage simple par domaine).
    *   Appelle l'API Cloudflare pour mettre à jour les enregistrements **A et AAAA** du domaine avec l'IP validée (via token unique à portée de zone).
    *   Loggue le résultat (succès/échec CF).
*   **Dashboard Admin (`/admin/*`) :**
    *   Auth Basic (user/pass d'env, via HTTPS Cloudflare). **Pas de rate limit admin**.
    *   Gestion profils (créer/modifier).
    *   Gestion clés API (générer - afficher une fois, lister hachées?, révoquer).
    *   Visualisation des logs d'accès API (filtrables par profil).
    *   Afficher la **dernière IP configurée** en DB pour chaque domaine.
    *   Bouton **"Force Sync"** par profil : Déclenche une mise à jour Cloudflare avec la dernière IP enregistrée en DB pour ce profil.
*   **API `/healthz` (GET) :**
    *   Ne nécessite pas d'authentification.
    *   Lit la version de l'application (injectée au build via `K8S_APP__VERSION`, accessible via `process.env.APP_VERSION` ou similaire).
    *   Retourne un JSON simple, ex : `{"status": "ok", "version": "..."}`.

## 3. Ajustements Helm Chart (`.helm/server/`)

*   **`values.yaml` :** Adapter `image.repository` et `image.tag` pour pointer vers l'image construite par `Dockerfile.server`. Garder `persistence` (PVC) et `secrets` (nom Secret K8s). Clés Secret: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (ou hash), `CLOUDFLARE_API_TOKEN`, `DATABASE_PATH`.
*   **`templates/deployment.yaml` :**
    *   Adapter pour Node.js. Garder `envFrom`, `volumeMounts`, `volumes`.
    *   **Mettre à jour les `livenessProbe` et `readinessProbe` pour pointer vers `/healthz`**.
    *   Injecter la version de l'application (ex: depuis `Chart.AppVersion`) comme variable d'environnement `APP_VERSION` si elle n'est pas fournie par le build Docker.
*   **`templates/pvc.yaml` :** Inchangé.

## 4. Dockerfile Serveur (`Dockerfile.server` à la racine)

*   **Accepter un build argument `K8S_APP__VERSION`**.
*   **Rendre cette version accessible à l'application via `ENV APP_VERSION=$K8S_APP__VERSION`**.
*   Build multi-stage Node.js basé sur le code dans `server/`.
*   Définir le `WORKDIR /app/server` (ou similaire) avant `npm install`.
*   Copier `server/package.json`, `server/package-lock.json` dans `WORKDIR`.
*   Exécuter `npm ci --only=production` dans `WORKDIR`.
*   Copier le reste du code de `server/` dans `WORKDIR`.
*   User non-root, `EXPOSE` port, `CMD ["node", "src/index.js"]` (chemin relatif au WORKDIR).

## 5. Client Léger (Code dans `cli/`)

*   **Code Source (`cli/src/` ou `cli/client.js`) :**
    *   Prend `API_KEY` et `SERVER_URL` en env.
    *   Fonction `getCurrentIP()`: Récupère IP externe actuelle.
    *   Fonction `sendPing(ip)`: POST vers `$SERVER_URL/api/ping` avec Auth et `{"ip": "$ip"}`.
    *   Au démarrage : Récupère IP, `sendPing(currentIP)`, stocke `lastSentIP`.
    *   Boucle (sleep) : Récupère IP, si différente de `lastSentIP`, `sendPing(newIP)`, met à jour `lastSentIP`.
*   **Dockerfile Client (`Dockerfile.cli` à la racine) :**
    *   Image légère (alpine + curl/node/python).
    *   Basé sur le code dans `cli/`.
    *   Copier le script/code client depuis `cli/`.
    *   Installer les dépendances nécessaires (ex: `apk add curl`).
    *   Définir le `CMD` pour lancer le script client.

## 6. Configuration de Développement (`.vscode/launch.json`)

*   Configurer une entrée pour lancer et déboguer le serveur Node.js (`server/src/index.js`), permettant le chargement des variables d'environnement depuis `server/.env`.

## 7. Diagramme d'Architecture

*   (Conceptuellement inchangé par rapport à v3, mais les noms de fichiers et emplacements sont clarifiés).

```mermaid
graph TD
    subgraph Kubernetes Cluster (k3s)
        User --> TraefikIngress[Traefik Ingress Controller]
        TraefikIngress -- /admin/* --> Service[K8s Service (pierceflare-server)]
        TraefikIngress -- /api/ping --> Service
        Service --> PodServer[Pod: pierceflare-server]

        subgraph PodServer
            App[Node.js Application (Express - code in server/)]
            App -- Reads/Writes --> SQLiteDB[SQLite DB File]
        end

        PodServer -- Mounts --> PVC[PersistentVolumeClaim]
        PVC -- Binds --> PV[PersistentVolume]

        Secret[K8s Secret] -- envFrom --> PodServer
        Secret(Contains: Admin User/Pass, CF Token, DB Path)

        ClientPod[Pod: pierceflare-client] -- Runs --> ClientScript[Client Script/App (code in cli/)]
        ClientPod -- Needs --> SecretClient[K8s Secret (API Key)]

        Kubelet -- Probes /healthz --> PodServer
    end

    App -- Updates DNS (A/AAAA) --> CloudflareAPI[Cloudflare API]

    AdminUser[Admin User] -- Manages --> App(Via /admin/*)
    APIClient[API Client App/Script] -- Sends POST /api/ping {"ip": ...} --> App

    ClientScript -- Checks IP --> ExternalIPService[External IP Service (e.g., ifconfig.me)]
    ClientScript -- Sends Ping --> App

    style App fill:#9f9,stroke:#333,stroke-width:2px
    style SQLiteDB fill:#ccf,stroke:#333,stroke-width:1px
    style PVC fill:#ccf,stroke:#333,stroke-width:1px
    style ClientScript fill:#f9f,stroke:#333,stroke-width:1px