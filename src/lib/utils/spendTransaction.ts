export const getDashedFormattedValue = (value: string) => {
  const needToFormat = value?.includes("-");

  if (!needToFormat) return value;

  return value?.split("-")?.join(" ");
};
