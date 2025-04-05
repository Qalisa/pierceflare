import { Subject, from, of, throwError, timer } from "rxjs";
import {
  bufferTime,
  catchError,
  concatMap,
  delay,
  filter,
  finalize,
  mergeMap,
  retry,
  timeout,
} from "rxjs/operators";
// Import Cloudflare client from their npm package
import Cloudflare from "cloudflare";
import { title } from "@/helpers/static";

// Types for our DNS update operations
interface DNSRecord {
  type: "A" | "AAAA"; // A, AAAA, CNAME, etc.
  fullName: string; // The DNS record name
  content: string; // The DNS record content (e.g. IP address)
  ttl?: number; // Time to live in seconds
  proxied?: boolean; // Whether the record is proxied through Cloudflare
}

interface DNSUpdateRequest {
  record: DNSRecord;
  operation: "update";
  priority?: number; // Higher number = higher priority
  retries?: number; // Number of retries allowed for this request
}

interface CloudflareConfig {
  apiToken: string;
  rateLimit: number; // Requests per minute
  maxConcurrent: number; // Maximum concurrent requests
  timeout: number; // Request timeout in milliseconds
  retryDelay: number; // Delay between retries in milliseconds
  maxRetries: number; // Maximum number of retries
}

export class CloudflareDNSWorker {
  private config: CloudflareConfig;
  private requestSubject = new Subject<DNSUpdateRequest>();
  private activeRequests = 0;
  private rateWindow: number[] = [];
  public client: Cloudflare;

  constructor(config: CloudflareConfig) {
    this.config = config;

    // Initialize Cloudflare client
    this.client = new Cloudflare({
      apiToken: this.config.apiToken,
    });
  }

  /**
   * Queue a DNS record operation
   */
  public queueDNSUpdate(request: DNSUpdateRequest): void {
    this.requestSubject.next(request);
  }

  /**
   * Initialize the worker and set up the processing pipeline
   */
  public initializeWorker(zones: Zones): void {
    // Process requests in order, respecting rate limits and concurrency
    this.requestSubject
      .pipe(
        // Group by priority - higher priority items processed first
        bufferTime(100),
        filter((batch) => batch.length > 0),
        mergeMap((batch) => {
          // Sort batch by priority
          return of(
            batch.sort((a, b) => (b.priority || 0) - (a.priority || 0)),
          );
        }),
        // Process each batch in order
        concatMap((batch) => from(batch)),
        // Respect concurrency limits
        mergeMap((request) => {
          // Check if we're under rate limits and concurrency limits
          if (this.canMakeRequest()) {
            return of(request);
          } else {
            // Calculate delay based on rate window
            const delayMs = this.calculateBackoff();
            return of(request).pipe(delay(delayMs));
          }
        }, this.config.maxConcurrent),
        // Process each request
        mergeMap((request) => {
          this.activeRequests++;
          this.rateWindow.push(Date.now());

          // Execute the API call
          return this.executeRequest(request, zones).pipe(
            timeout(this.config.timeout),
            retry({
              count: request.retries || this.config.maxRetries,
              delay: (error, retryCount) => {
                const delayMs = this.calculateRetryDelay(error, retryCount);
                console.log(
                  `[${title}]`,
                  `Retrying request (${retryCount}/${request.retries || this.config.maxRetries}) after ${delayMs}ms`,
                );
                return timer(delayMs);
              },
            }),
            catchError((error) => {
              console.error(`[${title}]`, "Error executing request:", error);
              return throwError(() => error);
            }),
            finalize(() => {
              this.activeRequests--;
              // Clean up old entries in rate window
              const now = Date.now();
              this.rateWindow = this.rateWindow.filter(
                (time) => now - time < 300000,
              ); // 5 minutes
            }),
          );
        }),
      )
      .subscribe({
        next: (result) =>
          console.log(`[${title}]`, "Request completed:", result),
        error: (error) =>
          console.error(`[${title}]`, "Error in request pipeline:", error),
      });
  }

  /**
   * Check if we can make a request based on rate limits and concurrency
   */
  private canMakeRequest(): boolean {
    // Check concurrency
    if (this.activeRequests >= this.config.maxConcurrent) {
      return false;
    }

    // Check rate limits - Cloudflare's limit is 1200 requests per 5 minutes
    const now = Date.now();
    const requestsInWindow = this.rateWindow.filter(
      (time) => now - time < 300000,
    ).length;

    return requestsInWindow < this.config.rateLimit;
  }

  /**
   * Calculate backoff time based on current rate window
   */
  private calculateBackoff(): number {
    const now = Date.now();

    // Clean up old entries in rate window
    this.rateWindow = this.rateWindow.filter((time) => now - time < 300000); // 5 minutes

    if (this.rateWindow.length === 0) {
      return 0;
    }

    // If we're at capacity
    if (this.rateWindow.length >= this.config.rateLimit) {
      // Find the oldest request and calculate when we can make another request
      const oldest = Math.min(...this.rateWindow);
      return Math.max(0, oldest + 300000 - now + 100); // Add a small buffer
    }

    // If we're approaching capacity, add progressive backoff
    const utilizationRatio = this.rateWindow.length / this.config.rateLimit;
    if (utilizationRatio > 0.8) {
      return Math.floor(Math.random() * 1000) + 500; // Random delay between 500-1500ms
    }

    return 0;
  }

  /**
   * Calculate retry delay based on error type and retry count
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateRetryDelay(error: any, retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * exponentialDelay;

    // For rate limit errors
    if ("code" in error) {
      if (error?.code === 10000 || error?.code === 429) {
        // Cloudflare rate limit error codes
        return exponentialDelay * 2 + jitter;
      }
    }

    return exponentialDelay + jitter;
  }

  /**
   * Execute the Cloudflare API request using the Cloudflare client
   */
  private executeRequest(request: DNSUpdateRequest, zones: Zones) {
    const { record, operation } = request;
    const { fullName } = record;

    //
    const find = zones.find(([, name]) => fullName.endsWith(name));

    //
    if (find == undefined) {
      return throwError(() => new Error(`Unknown zone ID for "${fullName}"`));
    }

    const [zone_id] = find;
    const name = fullName.split(".").find(Boolean); // get first

    //
    if (name == undefined || name == "" || name == fullName) {
      return throwError(
        () => new Error(`Could not determine subdomain in "${fullName}"`),
      );
    }

    // Use the Cloudflare client to execute the request
    switch (operation) {
      case "update":
        return from(
          this.client.dns.records.batch({
            zone_id,
            posts: [
              {
                type: record.type,
                name,
                content: record.content,
                ttl: record.ttl || 1,
                proxied: record.proxied,
              },
            ],
          }),
        );

      default:
        return throwError(() => new Error(`Unknown operation: ${operation}`));
    }
  }
}

//
//
//

type Zones = Awaited<ReturnType<typeof getZones>>;

//
export const getZones = async (cfWorker: CloudflareDNSWorker) => {
  console.log(`[${title}]`, "Checking availables zones...");
  const zones = await cfWorker.client.zones.list({ status: "active" });
  if (zones.result.length == 0) {
    throw new Error(`[${title}] No zones are `);
  }

  //
  const zoneMap = zones.result.map(({ id, name }) => [id, name] as const);
  console.log(`[${title}]`, "Available zones :", zoneMap);

  return zoneMap;
};
