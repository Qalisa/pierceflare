import envValues from "./values";

export const imageVersion = envValues
  .get("K8S_APP__IMAGE_VERSION")
  .default("[unknown-from-vite]")
  .asString();

export const imageRevision = envValues
  .get("K8S_APP__IMAGE_REVISION")
  .default("[unknown-from-vite]")
  .asString();

export const version = envValues
  .get("K8S_APP__VERSION")
  .default("[unknown-from-vite]")
  .asString();

export const SERVICE_AUTH_USERNAME = envValues
  .get("SERVICE_AUTH_USERNAME")
  .required()
  .asString();

export const SERVICE_AUTH_PASSWORD = envValues
  .get("SERVICE_AUTH_PASSWORD")
  .required()
  .asString();

export const SERVICE_DATABASE_FILES_PATH = envValues
  .get("SERVICE_DATABASE_FILES_PATH")
  .required()
  .asString();

export const CLOUDFLARE_API_TOKEN = envValues
  .get("CLOUDFLARE_API_TOKEN")
  .asString();

//
const _PORT = envValues.get("PORT").default("3000");
export const PORT = _PORT.asIntPositive();
export const CANONICAL_URL = envValues
  .get("CANONICAL_URL")
  .required()
  .asUrlObject();
