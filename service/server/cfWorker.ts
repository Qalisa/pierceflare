import { CloudflareDNSWorker, getZones } from "./cloudflareWorker";
import { CLOUDFLARE_API_TOKEN } from "./env";

let availableCloudflareDomains: string[];

const cfWorker = new CloudflareDNSWorker({
  apiToken: CLOUDFLARE_API_TOKEN,
  rateLimit: 1200, // Cloudflare's rate limit is 1200 requests per 5 minutes
  maxConcurrent: 1,
  timeout: 10000,
  retryDelay: 2000,
  maxRetries: 3,
});

const prewarmCfWorker = async () => {
  const zones = await getZones(cfWorker);
  availableCloudflareDomains = zones.map(([_id, name]) => name);
  return cfWorker.initializeWorker(zones);
};

export { cfWorker, prewarmCfWorker, availableCloudflareDomains };
