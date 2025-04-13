import envVar from "env-var";

import { mapEnvFromSources } from "./lib";

const envValues = envVar.from(
  mapEnvFromSources({
    K8S_APP__VERSION: "importMeta",
    CANONICAL_URL: "importMeta",
    //
    K8S_APP__IMAGE_VERSION: "all",
    K8S_APP__IMAGE_REVISION: "all",
    //
    SERVICE_AUTH_USERNAME: "all",
    SERVICE_AUTH_PASSWORD: "all",
    //
    SERVICE_DATABASE_FILES_PATH: "all",
    //
    CLOUDFLARE_API_TOKEN: "all",
    //
    PORT: "process",
  }),
);

export default envValues;
