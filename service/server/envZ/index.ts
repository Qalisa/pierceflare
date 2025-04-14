import { z } from "zod";

import type { EnvZ } from "@qalisa/vike-envz";

export const envSchema = {
  //
  K8S_APP__VERSION: [z.string().nonempty(), "importMeta"],
  CANONICAL_URL: [z.string().url().nonempty(), "importMeta"],
  //
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
