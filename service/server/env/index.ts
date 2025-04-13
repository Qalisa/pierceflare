import { z } from "zod";

import type { EnvZ } from "./lib";
import { mapEnvFromSources } from "./lib";

export const envSchema = {
  // Par défaut, la source est "all" si non spécifiée
  K8S_APP__VERSION: [z.string().nonempty(), "importMeta"],
  CANONICAL_URL: [z.string().url().nonempty(), "importMeta"],
  //
  // Utilisation directe du schéma Zod (la source sera "all" par défaut)
  K8S_APP__IMAGE_VERSION: [z.string().nonempty()],
  K8S_APP__IMAGE_REVISION: [z.string().nonempty()],
  //
  SERVICE_AUTH_USERNAME: [z.string().nonempty()],
  SERVICE_AUTH_PASSWORD: [z.string().nonempty()],
  //
  SERVICE_DATABASE_FILES_PATH: [z.string().nonempty()],
  //
  CLOUDFLARE_API_TOKEN: [z.string().optional()],
  //
  PORT: [z.coerce.number().default(3000), "process"],
} satisfies EnvZ;

/** recover server-side parsed and validated environment variables */
const getEnvZ = () => mapEnvFromSources(envSchema);

export default getEnvZ;
