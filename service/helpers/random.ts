// 10 Alphanumeric characters
const _produceRandomKey = () =>
  Math.random().toString(36).slice(2).toUpperCase();

export const produceRandomKey = () => _produceRandomKey() + _produceRandomKey();

export const randomIntFromInterval = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
