export type Constructor<T> = new (...args: never[]) => T;

export function assertNever(value: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${String(value)}`);
}