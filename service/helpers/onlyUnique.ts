export const onlyUniqueStr = (
  value: string,
  index: number,
  array: string | string[],
) => {
  return array.indexOf(value) === index;
};
