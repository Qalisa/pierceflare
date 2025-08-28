# PierceFlare
💉 Chriurgically, securely and automatically synchronize specific sub-domains IPs linked to your Cloudflare managed DNs.

This project includes:
- Dashboard, Backend API & workers (`./service`, known as `pierceflare`) 
- CLI daemon synchronizer (`./cli`, known as `pierceflare-cli`)
- Helm charts (https://qalisa.github.io/pierceflare/) 

> [!NOTE]
> At Qalisa, we host our own PierceFlare server !
> https://pierceflare.qalisa.fr
> [![ArgoCD Badge](https://argocd.qalisa.fr/api/badge?name=pierceflare-service-main&revision=true&showAppName=true)](https://argocd.qalisa.fr/applications/argocd/pierceflare-service-main)

## Purpose
TODO

## How does it work ?
TODO

## How to use

1. Login to CloudFlare, and generate an API Token (https://developers.cloudflare.com/fundamentals/api/get-started/create-token/). Make sure this tokens has `Zone:Read, DNS:Edit` permissions.

2. Install `pierceflare` using the official Docker image (or with the helm chart) on a server you own, and define env variables as: 
    - `CANONICAL_URL` as the URL you expect your server to respond to requests
    - `SERVICE_AUTH_USERNAME` / `SERVICE_AUTH_USERNAME` to connect to the dashboard later
    - `CLOUDFLARE_API_TOKEN` as the token generated in step 1

3. Once `pierceflare` installed, login to the dashboard and produce as many DDNS entries and API keys needed to synchronize your remote servers.
4. Then, install `pierceflare-cli` (using the Docker image or the Helm Chart) on any remote server you wish to synchronize, and configure env variables:
    - `PIERCEFLARE_SERVER_URL` to be as `CANONICAL_URL`
    - `PIERCEFLARE_API_KEY` as the API key you generated on the dashboard
5. Finally, check both `pierceflare-cli` logs and `pierceflare` dashboard to monitor DDNS synchronization in live !