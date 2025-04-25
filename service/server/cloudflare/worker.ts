import type Cloudflare from "cloudflare";
import { from, fromEvent, of, Subject, timer } from "rxjs";
import {
  bufferTime,
  catchError,
  concatMap,
  delay,
  filter,
  finalize,
  map,
  mergeMap,
  retry,
  takeUntil,
  tap,
  timeout,
} from "rxjs/operators";

import type { DbRequestsEvents } from "#/db/requests";
import { dbRequestsEE, eeRequests } from "#/db/requests";
import { willDomainBeCFProxiedByDefault } from "#/db/schema";
import { randomIntFromInterval } from "#/helpers/random";
import { wait, withLinger } from "#/helpers/withLinger";
import logr from "#/server/helpers/loggers";

import type { CloudflareConfig, CloudflareWorkerRequest } from "./types";
import type { Zones } from "./zones";

//
//
//

//
export class CloudflareDNSWorker {
  private config: CloudflareConfig;
  private activeRequests = 0;
  private rateWindow: number[] = [];
  public flow: ReturnType<typeof this.initializeWorker>;
  private shutdownSignal = new Subject<void>();
  private isShuttingDown = false;
  private shutdownHandlers = {
    SIGINT: () => this.handleShutdown("SIGINT"),
    SIGTERM: () => this.handleShutdown("SIGTERM"),
    SIGHUP: () => this.handleShutdown("SIGHUP"),
  };

  constructor(config: CloudflareConfig) {
    this.config = config;
    this.flow = this.initializeWorker(config.zones);
  }

  /**
   * Initialize the worker and set up the processing pipeline
   */
  private initializeWorker(zones: Zones) {
    // Process requests in order, respecting rate limits and concurrency
    const flow = fromEvent<CloudflareWorkerRequest["flareAdded"]>(
      dbRequestsEE,
      "flareAdded" as const satisfies keyof DbRequestsEvents,
    ).pipe(
      takeUntil(this.shutdownSignal), // Stops processing during shutdown
      // cast
      map((flareAdded) => {
        //
        logr.logD("Processing", flareAdded);

        //
        return { flareAdded } as CloudflareWorkerRequest;
      }),
      // Group by priority - higher priority items processed first
      bufferTime(1000),
      filter((batch) => batch.length > 0),
      mergeMap((batch) => {
        // Sort batch by priority
        return of(batch.sort((a, b) => (b.priority || 0) - (a.priority || 0)));
      }),
      // Process each batch in order
      concatMap((batch) => from(batch)),
      // Respect concurrency limits
      mergeMap((request) => {
        // If we are shutting down, don't accept new requests
        if (this.isShuttingDown) {
          logr.logD("Skipping request - system is shutting down");
          return of(); // Don't continue with this request
        }
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
        return from(this.executeSingleRequest(request, zones)).pipe(
          timeout(this.config.timeout),
          retry({
            count: request.retries || this.config.maxRetries,
            delay: (error, retryCount) => {
              const delayMs = this.calculateRetryDelay(error, retryCount);
              logr.logD(
                `Retrying request (${retryCount}/${request.retries || this.config.maxRetries}) after ${delayMs}ms`,
              );
              return timer(delayMs);
            },
          }),
          //
          tap({
            next: () =>
              logr.logD(
                `[flareId|${request.flareAdded.flareId}]`,
                "Request completed",
              ),
          }),
          //
          catchError((error) => {
            //
            logr.error(
              `[flareId|${request.flareAdded.flareId}]`,
              "Error executing request:",
              error instanceof Error ? error.message : JSON.stringify(error),
            );

            //
            return of(request.flareAdded.flareId);
          }),
          //
          finalize(() => {
            this.activeRequests--;
            // Clean up old entries in rate window
            const now = Date.now();
            this.rateWindow = this.rateWindow.filter(
              (time) => now - time < 300000,
            ); // 5 minutes

            // If we are in shutdown mode and there are no active requests, we can complete
            if (this.isShuttingDown && this.activeRequests === 0) {
              this.completeShutdown();
            }
          }),
        );
      }),
    );

    //
    return flow;
  }

  /**
   * Configure system shutdown event listeners
   */
  public setupShutdownHandler(): void {
    // Listen for system shutdown signals
    process.on("SIGINT", this.shutdownHandlers.SIGINT);
    process.on("SIGTERM", this.shutdownHandlers.SIGTERM);
    process.on("SIGHUP", this.shutdownHandlers.SIGHUP);
  }

  /**
   * Handle graceful worker shutdown
   */
  private handleShutdown(signal: string): void {
    if (this.isShuttingDown) return; // Avoid multiple calls

    this.isShuttingDown = true;
    logr.logD(`Received ${signal} signal. Starting graceful shutdown...`);

    // If no requests are active, we can close immediately
    if (this.activeRequests === 0) {
      this.completeShutdown();
      return;
    }

    // Allow time to complete in-progress requests
    logr.logD(
      `Waiting for ${this.activeRequests} active requests to complete...`,
    );

    // Set a timeout to force shutdown if necessary
    const forceShutdownTimeout = setTimeout(() => {
      logr.logD("Force shutdown: Some requests did not complete in time");
      this.completeShutdown();
    }, 30000); // 30 seconds maximum delay

    // Clean up the timeout if we finish normally
    this.shutdownSignal
      .pipe(finalize(() => clearTimeout(forceShutdownTimeout)))
      .subscribe();
  }

  /**
   * Complete the shutdown process
   */
  private completeShutdown(): void {
    logr.logD(
      "All requests completed or timeout reached. Shutting down worker.",
    );

    // Close the event stream
    this.shutdownSignal.next();
    this.shutdownSignal.complete();

    // Remove all process signal listeners to prevent memory leaks
    process.removeListener("SIGINT", this.shutdownHandlers.SIGINT);
    process.removeListener("SIGTERM", this.shutdownHandlers.SIGTERM);
    process.removeListener("SIGHUP", this.shutdownHandlers.SIGHUP);

    // Notify other components that we've finished cleanup
    logr.logD("Worker shutdown completed.");
  }

  /**
   * Check if we can make a request based on rate limits and concurrency
   */
  private canMakeRequest(): boolean {
    // Don't accept new requests if we're shutting down
    if (this.isShuttingDown) {
      return false;
    }

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
  private async executeSingleRequest(
    request: CloudflareWorkerRequest,
    zones: Zones,
  ) {
    const { flareId } = request.flareAdded;
    return await withLinger(_mayExec(this.config.cloudflareCli, request, zones))
      .then((result) => eeRequests.markSyncStatusForFlare(flareId, result))
      .then(() => flareId)
      .catch(async (err) => {
        //
        await eeRequests.markSyncStatusForFlare(flareId, {
          syncStatus: "error",
          statusDescr: err instanceof Error ? err.message : JSON.stringify(err),
          statusAt: new Date(),
        });

        // rethrow
        throw err;
      });
  }
}

//
//
//

//
const _mayExec = async (
  cloudflareCli: Cloudflare,
  { flareAdded: flare, options }: CloudflareWorkerRequest,
  zones: Zones,
): Promise<Parameters<typeof eeRequests.markSyncStatusForFlare>[1]> => {
  const { ofDomain: fullName, remoteOperation } = flare;

  //
  const find = zones.find(([, name]) => fullName.endsWith(name));

  //
  if (find == undefined) {
    throw new Error(`Unknown zone ID for "${fullName}"`);
  }

  const [zone_id] = find;
  const name = fullName.split(".").find(Boolean); // get first

  //
  if (name == undefined || name == "" || name == fullName) {
    throw new Error(`Could not determine subdomain in "${fullName}"`);
  }

  const {
    ipv4: cachedIPv4,
    ipv6: cachedIPv6,
    proxied,
  } = await eeRequests.getCachedIPs(fullName);

  // If the IPs are identical to those already cached, no need to update
  if (
    (flare.flaredIPv4 && flare.flaredIPv4 === cachedIPv4) ||
    (flare.flaredIPv6 && flare.flaredIPv6 === cachedIPv6)
  ) {
    logr.logD(
      `[flareId|${flare.flareId}]`,
      "Skipping update - IP hasn't changed",
    );

    // Update the status without performing remote operation
    return {
      syncStatus: "noOp",
      statusDescr: null,
      statusAt: new Date(),
    };
  }

  //
  await _execRemote(cloudflareCli, remoteOperation, flare, zone_id, name, {
    ...options,
    proxied,
  });

  //
  const now = new Date();
  await eeRequests.mayUpdateFlareDomainSyncState({
    ...flare,
    statusAt: now,
  });

  //
  return {
    syncStatus: "ok",
    statusDescr: null,
    statusAt: now,
  };
};

//
//
//

const _execRemote = async (
  cloudflareCli: Cloudflare,
  remoteOperation: string,
  flare: CloudflareWorkerRequest["flareAdded"],
  zone_id: string,
  name: string,
  options?: CloudflareWorkerRequest["options"],
) => {
  switch (remoteOperation) {
    case "dummy":
      await _exec_dummy();
      break;
    case "batch":
      await _findExec(cloudflareCli, flare, zone_id, name, options);
      break;
    default:
      throw new Error(`Unknown operation: ${remoteOperation}`);
  }
};

//
//
//

//
const _getOperationTypeFrom = (flare: CloudflareWorkerRequest["flareAdded"]) =>
  flare.flaredIPv4 ? "A" : "AAAA";

//
const _exec_dummy = async () => {
  const randomLinger = randomIntFromInterval(300, 1000);
  const shouldError = Math.random() < 0.25; // 25% chance to throw
  await wait(randomLinger);
  if (shouldError) {
    throw new Error("Random dummy error occurred!");
  }
};

//
const _findExec = async (
  cloudflareCli: Cloudflare,
  flare: CloudflareWorkerRequest["flareAdded"],
  zone_id: string,
  name: string,
  options?: CloudflareWorkerRequest["options"],
) => {
  const found = await cloudflareCli.dns.records.list({
    zone_id,
    name: { exact: flare.ofDomain },
    type: _getOperationTypeFrom(flare),
  });

  let allAccounts: Cloudflare.DNS.Records.RecordResponse[] = [];
  for await (const account of found.iterPages()) {
    allAccounts = [...allAccounts, ...account.result];
  }

  //
  if (found.result.length > 0) {
    // update the first one
    const record_id = found.result[0].id;

    //
    return _exec_single(
      cloudflareCli,
      flare,
      zone_id,
      record_id,
      name,
      options,
    );
  } else {
    return _exec_batch(cloudflareCli, flare, zone_id, name, options);
  }
};

//
const _exec_single = (
  cloudflareCli: Cloudflare,
  flare: CloudflareWorkerRequest["flareAdded"],
  zone_id: string,
  record_id: string,
  name: string,
  options?: CloudflareWorkerRequest["options"],
) =>
  cloudflareCli.dns.records.update(record_id, {
    zone_id,
    type: _getOperationTypeFrom(flare),
    name,
    content: flare.flaredIPv4 ?? flare.flaredIPv6!,
    ttl: options?.ttl || 1,
    proxied: options?.proxied || willDomainBeCFProxiedByDefault,
  });

//
const _exec_batch = (
  cloudflareCli: Cloudflare,
  flare: CloudflareWorkerRequest["flareAdded"],
  zone_id: string,
  name: string,
  options?: CloudflareWorkerRequest["options"],
) =>
  cloudflareCli.dns.records.batch({
    zone_id,
    posts: [
      {
        type: _getOperationTypeFrom(flare),
        name,
        content: flare.flaredIPv4 ?? flare.flaredIPv6!,
        ttl: options?.ttl || 1,
        proxied: options?.proxied || willDomainBeCFProxiedByDefault,
      },
    ],
  });
