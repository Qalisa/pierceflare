import envVar from "env-var";

const env = envVar.from({
  //
  K8S_APP__VERSION: import.meta.env.K8S_APP__VERSION,
  LEGAL_CORS_BEARER_TOKEN: import.meta.env.LEGAL_CORS_BEARER_TOKEN,
  //
  K8S_APP__IMAGE_VERSION: process.env.K8S_APP__IMAGE_VERSION,
  K8S_APP__IMAGE_REVISION: process.env.K8S_APP__IMAGE_REVISION,
  //
  ODOO_BASE_URL: import.meta.env.ODOO_BASE_URL ?? process.env.ODOO_BASE_URL,
  ODOO_PORT: import.meta.env.ODOO_PORT ?? process.env.ODOO_PORT,
  ODOO_DB: import.meta.env.ODOO_DB ?? process.env.ODOO_DB,
  ODOO_USERNAME: import.meta.env.ODOO_USERNAME ?? process.env.ODOO_USERNAME,
  ODOO_PASSWORD: import.meta.env.ODOO_PASSWORD ?? process.env.ODOO_PASSWORD,
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

export const legal_CORS_bearerToken = env
  .get("LEGAL_CORS_BEARER_TOKEN")
  .asString();

//
//
//

export const odooBaseUrl = env.get("ODOO_BASE_URL").required().asUrlString();
export const odooPort = env.get("ODOO_PORT").asPortNumber();
export const odooDb = env.get("ODOO_DB").required().asString();
export const odooPassword = env.get("ODOO_PASSWORD").required().asString();
export const odooUsername = env.get("ODOO_USERNAME").required().asString();
