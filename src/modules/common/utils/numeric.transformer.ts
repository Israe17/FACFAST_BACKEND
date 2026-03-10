export const numeric_transformer = {
  to(value: number): number {
    return value;
  },
  from(value: string | number): number {
    return Number(value);
  },
};
