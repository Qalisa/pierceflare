
<div align="center">
    <img width="196" alt="logo-1" src="https://github.com/user-attachments/assets/60c4810d-ca56-48c0-a20b-da61e8f1e1fa" />
</div>

# PierceFlare
💉 Chriurgically, securely and automatically synchronize specific sub-domains IPs linked to your Cloudflare managed DNs.

This project includes:
- Dashboard, Backend API & workers (`./service`, known as `pierceflare`) 
- CLI daemon synchronizer (`./cli`, known as `pierceflare-cli`)
- Helm charts (https://qalisa.github.io/pierceflare/) 

> [!NOTE]
> We host our own PierceFlare at Qalisa !
> 
> https://pierceflare.qalisa.fr
> 
> [![ArgoCD Badge](https://argocd.qalisa.fr/api/badge?name=pierceflare-service-main&revision=true&showAppName=true)](https://argocd.qalisa.fr/applications/argocd/pierceflare-service-main)

## Purpose
At Qalisa, we leverage Cloudflare DNS capabilities to secure access to our customers SaaS platforms, often providing our own subdomains as gateway for our customers to access their apps.

Since we provide our client with self-custodial, on-premise platform, we have no direct control on their hardware nor their ISP routers, which could change unexpectedly their external IP at any given time, breaking access to their app using our subdomains.

On the other hand, Cloudflare do not provide fine-grained API token generation to limit control to specific subdomains. 

That's why we developped the Pierceflare suite.

## How does it work ?
A `pierceflare` instance will serve as a middleware gateway, securing the Cloudflare account-wide API key behind the ability to create autonomous API token which have restricted write-crendentials on a specific subdomain.
We will then install a lightweight client `pierceflare-cli` on our customers servers, bound to the previous `pierceflare` instance using a dedicated API key. Rince and repeat.
<div align="center">
    <img width="886" height="473" alt="PierceFlare scheme" src="https://github.com/user-attachments/assets/081697be-3464-42a5-a0f4-87df60ec62c9" />
</div>

## Features
- React based web-app with tRPC live-updates; watch the synchronization attempts !
- RxJS worker to feed CloudFlare DNS updates using its official API
- Lightweight and fast Golang-based IP change detector and synchronizer
- Smart, process-wide IP cache system to limit noise sent to both Pierceflare and CloudFlare APIs
<div align="center">
    <img width="1710" height="819" src="https://github.com/user-attachments/assets/f1f55ea5-5ace-4695-badb-b29640a44d00" />
</div>

## How to use

### Prepare and install `pierceflare` (once)
1. Login to CloudFlare, and generate an API Token (https://developers.cloudflare.com/fundamentals/api/get-started/create-token/). Make sure this tokens has `Zone:Read, DNS:Edit` permissions.

2. Install `pierceflare` using the official Docker image (or with the helm chart) on a server you own, and define env variables as: 
    - `CANONICAL_URL` as the URL you expect your server to respond to requests
    - `SERVICE_AUTH_USERNAME` / `SERVICE_AUTH_PASSWORD` to connect to the dashboard later
    - `CLOUDFLARE_API_TOKEN` as the token generated in step 1

3. Once `pierceflare` installed, login to the dashboard using `SERVICE_AUTH_USERNAME` / `SERVICE_AUTH_PASSWORD`.
<div align="center">
    <img width="287" height="378" src="https://github.com/user-attachments/assets/5cbabd97-daf2-47d5-bba1-b6a157bddaff" />
</div>

### Configure an entry (as many times as needed)
4. We will now create a synchronization entry; click on `Create DDNS Entry`.
<div align="center">
   <img width="262" height="200" src="https://github.com/user-attachments/assets/383d4497-c30d-4261-8f9a-3f10bb15e4d8" />
</div>

5. Fill up the informations on the specific subdomain you wish synchronizations to be set upon, then click on `Create`. No need to define this DNS entry on Cloudflare beforehand, it will be created automatically at first sync.
<div align="center">
 <img width="624" height="682" src="https://github.com/user-attachments/assets/30802962-f21a-4777-9094-1924fc61d192" />
</div>

6. Back on the dashboard, you will notice your new entry. Click on its `Generate API Key` button. Confirm creation by then clicking on `Create Key`.
<div align="center">
    <img width="1124" height="87" src="https://github.com/user-attachments/assets/d43fb979-9758-4f59-a1ba-ab9dfc71b10a" />
    <img width="481" height="371" src="https://github.com/user-attachments/assets/282e9567-8c43-4d55-9053-b9e8b805032f" />
</div>

7. Your API key is generated. Save it, and copy it on your clipboard using the `Copy Key` button.
<div align="center">
    <img width="637" height="388" src="https://github.com/user-attachments/assets/30590291-b06e-4f6c-803b-544f80289f30" />
</div>

### Initiate synchronization
8. Then, install `pierceflare-cli` (using the Docker image or the Helm Chart) on any remote server you wish to synchronize, and configure env variables:
    - `PIERCEFLARE_SERVER_URL` to be as `CANONICAL_URL`
    - `PIERCEFLARE_API_KEY` as the API key you generated on the dashboard
      
9. Finally, check both `pierceflare-cli` logs and `pierceflare` dashboard to monitor DDNS synchronization in live !
