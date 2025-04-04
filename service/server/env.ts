import envVar from "env-var";

const env = envVar.from({
  //
  K8S_APP__VERSION: import.meta.env.K8S_APP__VERSION,
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
  SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS:
    import.meta.env.SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS ??
    process.env.SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS,
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

//
const onlyUniqueStr = (
  value: string,
  index: number,
  array: string | string[],
) => {
  return array.indexOf(value) === index;
};

export const SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS = env
  .get("SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS")
  .required()
  .asArray(",")
  .map((e) => {
    return e.replace(/\s/g, ""); // remove whitespaces
  })
  .filter(onlyUniqueStr); // prevents duplicates
