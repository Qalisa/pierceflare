import { title } from "#/helpers/static";

const _log = (
  logger: typeof console.log | typeof console.error,
  ...args: unknown[]
) => {
  return logger(`[${title}]`, ...args);
};

const _logr = {
  log: (...args: unknown[]) => _log(console.log, ...args),
  error: (...args: unknown[]) => _log(console.error, ...args),
};

const logr = {
  ..._logr,
  /** only prints if in DEV Mode */
  logD: (...args: unknown[]) => {
    if (import.meta.env.PROD) return;
    _log(console.log, ...args);
  },
};

export default logr;
