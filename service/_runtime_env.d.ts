declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly K8S_APP__IMAGE_VERSION: string;
      readonly K8S_APP__IMAGE_REVISION: string;
    }
  }
}

export {};
