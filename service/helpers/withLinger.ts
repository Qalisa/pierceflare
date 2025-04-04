export const withLinger = async <T>(
  promise: Promise<T>,
  ms: number = 1000,
): Promise<T> => {
  const wait = new Promise<void>((resolve) => setTimeout(resolve, ms));

  // Wait for both the original promise and the linger timer to finish
  return Promise.all([promise, wait])
    .then(([result]) => result)
    .catch(async (err) => {
      await wait;
      throw err;
    });
};
