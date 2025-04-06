import type Cloudflare from "cloudflare";
import type { Zones } from "./zones";

// Types for our DNS update operations
export interface DNSRecord {
  type: "A" | "AAAA"; // A, AAAA, CNAME, etc.
  fullName: string; // The DNS record name
  content: string; // The DNS record content (e.g. IP address)
  ttl?: number; // Time to live in seconds
  proxied?: boolean; // Whether the record is proxied through Cloudflare
}

export interface DNSUpdateRequest {
  record: DNSRecord;
  operation: "update";
  priority?: number; // Higher number = higher priority
  retries?: number; // Number of retries allowed for this request
}

export interface CloudflareConfig {
  zones: Zones;
  cloudflareCli: Cloudflare;
  rateLimit: number; // Requests per minute
  maxConcurrent: number; // Maximum concurrent requests
  timeout: number; // Request timeout in milliseconds
  retryDelay: number; // Delay between retries in milliseconds
  maxRetries: number; // Maximum number of retries
}
