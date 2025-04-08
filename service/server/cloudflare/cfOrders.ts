import type { DNSUpdateRequest } from "@/server/cloudflare/types";
import { Subject } from "rxjs";
//
//
//

//
export const cfEmitter = new Subject<DNSUpdateRequest>();
