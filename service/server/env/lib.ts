import type { z } from "zod";

type FetchEnvFrom = "process" | "importMeta" | "all";

// Définition de l'entrée d'environnement comme soit un schéma Zod, soit un tuple
type EnvEntry<T extends z.ZodType> =
  | T
  | readonly [schema: T, source?: FetchEnvFrom];

// Type pour la map des entrées d'environnement
type EnvEntries = Record<string, EnvEntry<z.ZodType>>;

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

// Type helper pour extraire le type de retour
type EnvValuesReturn<T extends EnvEntries> = {
  [K in keyof T]: T[K] extends z.ZodType<infer U>
    ? U
    : T[K] extends readonly [z.ZodType<infer V>, FetchEnvFrom?]
      ? V
      : never;
};

export const mapEnvFromSources = <T extends EnvEntries>(
  envEntries: T,
): EnvValuesReturn<T> => {
  const rawValues: Record<string, unknown> = {};
  const result = {} as EnvValuesReturn<T>;

  // Récupérer les valeurs brutes à partir des sources définies
  for (const key in envEntries) {
    const entry = envEntries[key];
    const source = Array.isArray(entry) ? (entry[1] ?? "all") : "all";
    rawValues[key] = _getPropertyFromSource(key, source);
  }

  // Valider chaque valeur avec son schéma correspondant
  for (const key in envEntries) {
    const entry = envEntries[key];
    const schema = Array.isArray(entry) ? entry[0] : entry;
    result[key as keyof T] = schema.parse(rawValues[key]);
  }

  return result;
};
