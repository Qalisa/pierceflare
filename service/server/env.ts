import envVar from "env-var";

const env = envVar.from({
  //
  K8S_APP__VERSION: import.meta.env.K8S_APP__VERSION,
  CANONICAL_URL: import.meta.env.CANONICAL_URL,
  //
  K8S_APP__IMAGE_VERSION:
    import.meta.env.K8S_APP__IMAGE_VERSION ??
    process.env.K8S_APP__IMAGE_VERSION,
  K8S_APP__IMAGE_REVISION:
    import.meta.env.K8S_APP__IMAGE_REVISION ??
    process.env.K8S_APP__IMAGE_REVISION,
  //
  SERVICE_AUTH_USERNAME:
    import.meta.env.SERVICE_AUTH_USERNAME ?? process.env.SERVICE_AUTH_USERNAME,
  SERVICE_AUTH_PASSWORD:
    import.meta.env.SERVICE_AUTH_PASSWORD ?? process.env.SERVICE_AUTH_PASSWORD,
  //
  SERVICE_DATABASE_FILES_PATH:
    import.meta.env.SERVICE_DATABASE_FILES_PATH ??
    process.env.SERVICE_DATABASE_FILES_PATH,
  //
  CLOUDFLARE_API_TOKEN:
    import.meta.env.CLOUDFLARE_API_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN,
  //
  PORT: process.env.PORT,
});

export const imageVersion = env
  .get("K8S_APP__IMAGE_VERSION")
  .default("[unknown-from-vite]")
  .asString();

export const imageRevision = env
  .get("K8S_APP__IMAGE_REVISION")
  .default("[unknown-from-vite]")
  .asString();

export const version = env
  .get("K8S_APP__VERSION")
  .default("[unknown-from-vite]")
  .asString();

export const SERVICE_AUTH_USERNAME = env
  .get("SERVICE_AUTH_USERNAME")
  .required()
  .asString();

export const SERVICE_AUTH_PASSWORD = env
  .get("SERVICE_AUTH_PASSWORD")
  .required()
  .asString();

export const SERVICE_DATABASE_FILES_PATH = env
  .get("SERVICE_DATABASE_FILES_PATH")
  .required()
  .asString();

export const CLOUDFLARE_API_TOKEN = env.get("CLOUDFLARE_API_TOKEN").asString();

//
const _PORT = env.get("PORT").default("3000");
export const PORT = _PORT.asInt();
export const CANONICAL_URL = env.get("CANONICAL_URL").required().asUrlObject();
