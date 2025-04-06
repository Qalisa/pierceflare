import type { DNSUpdateRequest } from "@/server/cloudflare/types";
import { Subject } from "rxjs";
//
//
//

//
console.log("LOADED CFEMITTER");
export const cfEmitter = new Subject<DNSUpdateRequest>();
