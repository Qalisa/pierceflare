declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly K8S_APP__IMAGE_VERSION: string;
      readonly K8S_APP__IMAGE_REVISION: string;

      //
      readonly SERVICE_AUTH_USERNAME: string;
      readonly SERVICE_AUTH_PASSWORD: string;
      //
      readonly SERVICE_DATABASE_FILES_PATH: string;
    }
  }
}

export {};
