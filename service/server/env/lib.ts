type FetchEnvFrom = "process" | "importMeta" | "all";

type Envs = Record<string, FetchEnvFrom>;

//
const _getPropertyFromSource = (
  propertyName: string,
  source: FetchEnvFrom,
): string | undefined => {
  switch (source) {
    case "process":
      return process.env[propertyName];
    case "importMeta":
      return import.meta.env[propertyName];
    case "all":
      return (
        _getPropertyFromSource(propertyName, "importMeta") ??
        _getPropertyFromSource(propertyName, "process")
      );
  }
};

export const mapEnvFromSources = <T extends Envs>(
  envs: T,
): { [K in keyof T]: string | undefined } => {
  const result = {} as { [K in keyof T]: string | undefined };
  for (const key in envs) {
    const source = envs[key];
    result[key] = _getPropertyFromSource(key, source);
  }
  return result;
};
