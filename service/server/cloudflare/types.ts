import type Cloudflare from "cloudflare";

import type { DbRequestsEvents } from "#/db/requests";

import type { Zones } from "./zones";

//
export type CloudflareWorkerRequest = {
  flareAdded: DbRequestsEvents["flareAdded"][number];
  priority?: number; // Higher number = higher priority
  retries?: number; // Number of retries allowed for this request
  options?: {
    ttl?: number; // Time to live in seconds
    proxied?: boolean; // Whether the record is proxied through Cloudflare
  };
};

export interface CloudflareConfig {
  zones: Zones;
  cloudflareCli: Cloudflare;
  rateLimit: number; // Requests per minute
  maxConcurrent: number; // Maximum concurrent requests
  timeout: number; // Request timeout in milliseconds
  retryDelay: number; // Delay between retries in milliseconds
  maxRetries: number; // Maximum number of retries
}
