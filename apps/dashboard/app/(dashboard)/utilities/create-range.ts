const defaultInitializer = (index: number) => index;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRange<T = number>(length: number, initializer: (index: number) => any = defaultInitializer): T[] {
  return [...new Array(length)].map((_, index) => initializer(index));
}
