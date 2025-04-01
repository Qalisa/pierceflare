import envVar from "env-var";

const env = envVar.from({
  //
  K8S_APP__VERSION: import.meta.env.K8S_APP__VERSION,
  //
  K8S_APP__IMAGE_VERSION: process.env.K8S_APP__IMAGE_VERSION,
  K8S_APP__IMAGE_REVISION: process.env.K8S_APP__IMAGE_REVISION,
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
