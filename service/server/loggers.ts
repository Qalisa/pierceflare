import { title } from "@/helpers/static";

const _log = (
  logger: typeof console.log | typeof console.error,
  ...args: unknown[]
) => {
  return logger(`[${title}]`, ...args);
};

const logr = {
  log: (...args: unknown[]) => _log(console.log, ...args),
  error: (...args: unknown[]) => _log(console.error, ...args),
};

export default logr;
