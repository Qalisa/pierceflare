import { z } from "zod";

import type { EnvEntries } from "./lib";
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
} satisfies EnvEntries;

// Récupérer et valider les variables d'environnement avec leurs schémas respectifs
const getEnv = () => mapEnvFromSources(envSchema);

export default getEnv;
